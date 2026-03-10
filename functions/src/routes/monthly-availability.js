import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { db, collections } from '../config/firebase.js';
import * as userService from '../services/userService.js';

const router = Router();

/**
 * GET /monthly-availability
 * Get current user's monthly availability records
 */
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const user = await userService.getUserByUid(req.user.uid);
    const snapshot = await db.collection(collections.monthlyAvailability)
      .where('user_email', '==', user.email)
      .get();

    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(records);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /monthly-availability/:id
 * Get a single record by ID
 */
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const doc = await db.collection(collections.monthlyAvailability).doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /monthly-availability/filter
 * Filter monthly availability by criteria
 */
router.post('/filter', verifyToken, async (req, res, next) => {
  try {
    const { filters = {}, sort, limit: maxResults } = req.body;
    let query = db.collection(collections.monthlyAvailability);

    for (const [key, value] of Object.entries(filters)) {
      query = query.where(key, '==', value);
    }

    if (sort) {
      const desc = sort.startsWith('-');
      const field = desc ? sort.substring(1) : sort;
      query = query.orderBy(field, desc ? 'desc' : 'asc');
    }

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
 * POST /monthly-availability
 * Create a new monthly availability record
 */
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const user = await userService.getUserByUid(req.user.uid);
    const { month, year, hours_available } = req.body;

    const now = new Date().toISOString();
    const data = {
      user_email: user.email,
      user_uid: req.user.uid,
      month,
      year,
      hours_available,
      created_at: now,
      updated_at: now
    };

    const docRef = await db.collection(collections.monthlyAvailability).add(data);
    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /monthly-availability/:id
 * Update a monthly availability record
 */
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const docRef = db.collection(collections.monthlyAvailability).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Record not found' });
    }

    if (doc.data().user_uid !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updates = { ...req.body, updated_at: new Date().toISOString() };
    await docRef.update(updates);

    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /monthly-availability/:id
 * Delete a monthly availability record
 */
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const docRef = db.collection(collections.monthlyAvailability).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Record not found' });
    }

    if (doc.data().user_uid !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await docRef.delete();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
