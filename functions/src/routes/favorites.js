import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { db, collections } from '../config/firebase.js';
import * as userService from '../services/userService.js';

const router = Router();

/**
 * GET /favorites
 * Get user's favorites
 */
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const user = await userService.getUserByUid(req.user.uid);

    const snapshot = await db.collection(collections.favorites)
      .where('user_email', '==', user.email)
      .get();

    const favorites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(favorites);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /favorites
 * Add a favorite
 */
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const user = await userService.getUserByUid(req.user.uid);
    const { business_id, business_name } = req.body;

    // Check if already favorited
    const existing = await db.collection(collections.favorites)
      .where('user_email', '==', user.email)
      .where('business_id', '==', business_id)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.status(400).json({ error: 'Already favorited' });
    }

    const docRef = await db.collection(collections.favorites).add({
      user_email: user.email,
      user_uid: req.user.uid,
      business_id,
      business_name,
      created_at: new Date().toISOString()
    });

    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /favorites/:id
 * Remove a favorite
 */
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const docRef = db.collection(collections.favorites).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    // Verify ownership
    if (doc.data().user_uid !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await docRef.delete();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /favorites/filter
 * Filter favorites by criteria
 */
router.post('/filter', verifyToken, async (req, res, next) => {
  try {
    const { filters = {}, sort, limit: maxResults } = req.body;
    let query = db.collection(collections.favorites);

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
 * DELETE /favorites/business/:businessId
 * Remove a favorite by business ID
 */
router.delete('/business/:businessId', verifyToken, async (req, res, next) => {
  try {
    const user = await userService.getUserByUid(req.user.uid);

    const snapshot = await db.collection(collections.favorites)
      .where('user_email', '==', user.email)
      .where('business_id', '==', req.params.businessId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    await snapshot.docs[0].ref.delete();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
