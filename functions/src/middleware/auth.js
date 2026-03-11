import { auth, db, collections } from '../config/firebase.js';

/**
 * Middleware to verify Firebase ID token
 * Attaches decoded user to req.user
 */
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;

    // Ensure user document exists in Firestore
    const userRef = db.collection(collections.users).doc(decodedToken.uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      const now = new Date().toISOString();
      const newUserData = {
        email: decodedToken.email,
        full_name: decodedToken.name || decodedToken.email.split('@')[0],
        picture: decodedToken.picture || null,
        account_type: null,
        created_at: now,
        updated_at: now,
        total_hours_volunteered: 0,
        verified_volunteer: false
      };
      await userRef.set(newUserData);
      req.userDoc = { id: decodedToken.uid, ...newUserData };
    } else {
      const userData = userDoc.data();
      // Backfill created_at if missing (ensures user appears in ordered queries)
      if (!userData.created_at) {
        const now = new Date().toISOString();
        await userRef.update({ created_at: now, updated_at: now });
        userData.created_at = now;
        userData.updated_at = now;
      }
      req.userDoc = { id: userDoc.id, ...userData };
    }

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token
 * Useful for endpoints that work for both authenticated and anonymous users
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
  } catch (error) {
    req.user = null;
  }

  next();
};

/**
 * Admin-only middleware - requires verifyToken to have run first
 * Checks the user's Firestore document for is_admin === true
 */
export const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Use user doc already fetched by verifyToken if available
    if (req.userDoc && req.userDoc.is_admin) {
      return next();
    }

    // Fallback: read from Firestore directly
    const userDoc = await db.collection(collections.users).doc(req.user.uid).get();
    if (userDoc.exists && userDoc.data().is_admin) {
      return next();
    }

    return res.status(403).json({ error: 'Admin access required' });
  } catch (error) {
    console.error('Admin check failed:', error);
    return res.status(500).json({ error: 'Failed to verify admin status' });
  }
};

export default { verifyToken, optionalAuth, requireAdmin };
