import { Router } from 'express';
import { verifyToken, optionalAuth } from '../middleware/auth.js';
import * as businessService from '../services/businessService.js';

const router = Router();

/**
 * GET /businesses
 * List all businesses
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { sort = '-created_at', limit = 100 } = req.query;
    const businesses = await businessService.listBusinesses(sort, parseInt(limit));
    res.json(businesses);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /businesses/:id
 * Get a single business by ID
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const business = await businessService.getBusinessById(req.params.id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json(business);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /businesses/owner/me
 * Get the business owned by the current user
 */
router.get('/owner/me', verifyToken, async (req, res, next) => {
  try {
    const business = await businessService.getBusinessByOwner(req.user.uid);
    if (!business) {
      return res.status(404).json({ error: 'No business found for this user' });
    }
    res.json(business);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /businesses
 * Create a new business
 */
router.post('/', verifyToken, async (req, res, next) => {
  try {
    // Check if user already owns a business
    const existingBusiness = await businessService.getBusinessByOwner(req.user.uid);
    if (existingBusiness) {
      return res.status(400).json({ error: 'User already owns a business' });
    }

    const business = await businessService.createBusiness({
      ...req.body,
      owner_uid: req.user.uid,
      owner_email: req.user.email
    });

    res.status(201).json(business);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /businesses/:id
 * Update a business
 */
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const business = await businessService.getBusinessById(req.params.id);

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Check ownership
    if (business.owner_uid !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to update this business' });
    }

    const updatedBusiness = await businessService.updateBusiness(req.params.id, req.body);
    res.json(updatedBusiness);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /businesses/:id
 * Delete a business
 */
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const business = await businessService.getBusinessById(req.params.id);

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Check ownership
    if (business.owner_uid !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to delete this business' });
    }

    await businessService.deleteBusiness(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /businesses/filter
 * Filter businesses by criteria
 */
router.post('/filter', optionalAuth, async (req, res, next) => {
  try {
    const { filters = {}, limit = 100 } = req.body;
    const businesses = await businessService.filterBusinesses(filters, limit);
    res.json(businesses);
  } catch (error) {
    next(error);
  }
});

export default router;
