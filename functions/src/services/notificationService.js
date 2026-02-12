import { db, collections } from '../config/firebase.js';

/**
 * Create a new notification
 */
export const createNotification = async (notificationData) => {
  const now = new Date().toISOString();

  const docRef = await db.collection(collections.notifications).add({
    ...notificationData,
    is_read: false,
    created_at: now
  });

  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
};

/**
 * Get notifications for a user
 */
export const getNotificationsByUser = async (email, limit = 50) => {
  const snapshot = await db.collection(collections.notifications)
    .where('user_email', '==', email)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get unread notification count for a user
 */
export const getUnreadCount = async (email) => {
  const snapshot = await db.collection(collections.notifications)
    .where('user_email', '==', email)
    .where('is_read', '==', false)
    .count()
    .get();

  return snapshot.data().count;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (id) => {
  const docRef = db.collection(collections.notifications).doc(id);

  await docRef.update({
    is_read: true
  });

  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (email) => {
  const snapshot = await db.collection(collections.notifications)
    .where('user_email', '==', email)
    .where('is_read', '==', false)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { is_read: true });
  });

  await batch.commit();
  return { updated: snapshot.docs.length };
};

/**
 * Delete notification
 */
export const deleteNotification = async (id) => {
  await db.collection(collections.notifications).doc(id).delete();
  return { success: true };
};

export default {
  createNotification,
  getNotificationsByUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
