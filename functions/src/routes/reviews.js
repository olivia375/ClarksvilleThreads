import { Router } from 'express';
import { verifyToken, optionalAuth } from '../middleware/auth.js';
import { db, collections } from '../config/firebase.js';
import * as userService from '../services/userService.js';
import * as businessService from '../services/businessService.js';

const router = Router();

/**
 * GET /reviews/business/:businessId
 * Get reviews for a business
 */
router.get('/business/:businessId', optionalAuth, async (req, res, next) => {
  try {
    const snapshot = await db.collection(collections.reviews)
      .where('business_id', '==', req.params.businessId)
      .orderBy('created_at', 'desc')
      .get();

    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /reviews/filter
 * Filter reviews by criteria
 */
router.post('/filter', optionalAuth, async (req, res, next) => {
  try {
    const { filters = {}, sort, limit: maxResults } = req.body;
    let query = db.collection(collections.reviews);

    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      query = query.where(key, '==', value);
    }

    // Apply sort
    if (sort) {
      const desc = sort.startsWith('-');
      const field = desc ? sort.substring(1) : sort;
      query = query.orderBy(field, desc ? 'desc' : 'asc');
    } else {
      query = query.orderBy('created_at', 'desc');
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
 * POST /reviews
 * Create a review
 */
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const user = await userService.getUserByUid(req.user.uid);
    const { business_id, rating, comment } = req.body;

    if (!business_id || !rating) {
      return res.status(400).json({ error: 'Business ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if user already reviewed this business
    const existing = await db.collection(collections.reviews)
      .where('user_email', '==', user.email)
      .where('business_id', '==', business_id)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.status(400).json({ error: 'You have already reviewed this business' });
    }

    const docRef = await db.collection(collections.reviews).add({
      user_email: user.email,
      user_uid: req.user.uid,
      user_name: user.full_name,
      business_id,
      rating,
      comment: comment || '',
      created_at: new Date().toISOString()
    });

    // Update business rating
    await businessService.updateBusinessRating(business_id);

    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /reviews/:id
 * Update a review
 */
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const docRef = db.collection(collections.reviews).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Verify ownership
    if (doc.data().user_uid !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { rating, comment } = req.body;

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    await docRef.update({
      ...(rating && { rating }),
      ...(comment !== undefined && { comment }),
      updated_at: new Date().toISOString()
    });

    // Update business rating
    await businessService.updateBusinessRating(doc.data().business_id);

    const updatedDoc = await docRef.get();
    res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /reviews/:id
 * Delete a review
 */
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const docRef = db.collection(collections.reviews).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Verify ownership
    if (doc.data().user_uid !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const businessId = doc.data().business_id;
    await docRef.delete();

    // Update business rating
    await businessService.updateBusinessRating(businessId);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
