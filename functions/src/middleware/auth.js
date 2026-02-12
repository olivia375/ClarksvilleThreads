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
      await userRef.set({
        email: decodedToken.email,
        full_name: decodedToken.name || decodedToken.email.split('@')[0],
        picture: decodedToken.picture || null,
        created_at: now,
        updated_at: now,
        total_hours_volunteered: 0,
        verified_volunteer: false
      });
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

export default { verifyToken, optionalAuth };
