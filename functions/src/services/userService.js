import { db, collections } from '../config/firebase.js';

/**
 * Get user by Firebase UID
 */
export const getUserByUid = async (uid) => {
  const doc = await db.collection(collections.users).doc(uid).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() };
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email) => {
  const snapshot = await db.collection(collections.users)
    .where('email', '==', email)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

/**
 * Create or update user profile
 */
export const upsertUser = async (uid, userData) => {
  const userRef = db.collection(collections.users).doc(uid);
  const now = new Date().toISOString();

  const doc = await userRef.get();

  if (doc.exists) {
    // Update existing user
    await userRef.update({
      ...userData,
      updated_at: now
    });
  } else {
    // Create new user
    await userRef.set({
      ...userData,
      account_type: userData.account_type || null,
      created_at: now,
      updated_at: now,
      total_hours_volunteered: 0,
      verified_volunteer: false
    });
  }

  const updatedDoc = await userRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() };
};

/**
 * Update user profile
 */
export const updateUser = async (uid, updates) => {
  const userRef = db.collection(collections.users).doc(uid);
  const now = new Date().toISOString();

  const doc = await userRef.get();
  if (!doc.exists) {
    // Create the user doc if it doesn't exist yet
    await userRef.set({
      ...updates,
      account_type: updates.account_type || null,
      created_at: now,
      updated_at: now,
      total_hours_volunteered: 0,
      verified_volunteer: false
    });
  } else {
    await userRef.update({
      ...updates,
      updated_at: now
    });
  }

  const updatedDoc = await userRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() };
};

/**
 * List all users (admin only)
 */
export const listUsers = async (limit = 100) => {
  // First try ordered query — this excludes docs without created_at
  const orderedSnapshot = await db.collection(collections.users)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .get();

  if (orderedSnapshot.size > 0) {
    return orderedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Fallback: list without ordering to catch docs that lack created_at
  const snapshot = await db.collection(collections.users)
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export default {
  getUserByUid,
  getUserByEmail,
  upsertUser,
  updateUser,
  listUsers
};
