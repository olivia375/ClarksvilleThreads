import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { db, collections } from '../config/firebase.js';
import * as notificationService from '../services/notificationService.js';
import * as userService from '../services/userService.js';

const router = Router();

/**
 * GET /notifications
 * Get notifications for current user
 */
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const user = await userService.getUserByUid(req.user.uid);
    const { limit = 50 } = req.query;

    const notifications = await notificationService.getNotificationsByUser(
      user.email,
      parseInt(limit)
    );
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', verifyToken, async (req, res, next) => {
  try {
    const user = await userService.getUserByUid(req.user.uid);
    const count = await notificationService.getUnreadCount(user.email);
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', verifyToken, async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    res.json(notification);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', verifyToken, async (req, res, next) => {
  try {
    const user = await userService.getUserByUid(req.user.uid);
    const result = await notificationService.markAllAsRead(user.email);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /notifications/filter
 * Filter notifications by criteria
 */
router.post('/filter', verifyToken, async (req, res, next) => {
  try {
    const { filters = {}, sort, limit: maxResults } = req.body;
    let query = db.collection(collections.notifications);

    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      query = query.where(key, '==', value);
    }

    // Apply sort
    if (sort) {
      const desc = sort.startsWith('-');
      const field = desc ? sort.substring(1) : sort;
      query = query.orderBy(field, desc ? 'desc' : 'asc');
    }

    // Apply limit
    if (maxResults) {
      query = query.limit(maxResults);
    }

    const snapshot = await query.get();
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(results);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /notifications
 * Create a notification (internal use)
 */
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const notification = await notificationService.createNotification(req.body);
    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /notifications/:id
 * Delete a notification
 */
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
