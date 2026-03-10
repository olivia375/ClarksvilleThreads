import { Router } from 'express';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { db, auth, collections } from '../config/firebase.js';
import * as userService from '../services/userService.js';
import * as businessService from '../services/businessService.js';
import * as opportunityService from '../services/opportunityService.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(verifyToken, requireAdmin);

// ─── Users ───────────────────────────────────────────────

/**
 * GET /admin/users
 * List all users
 */
router.get('/users', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const users = await userService.listUsers(limit);
    res.json(users);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /admin/users/:uid
 * Get a single user by UID
 */
router.get('/users/:uid', async (req, res, next) => {
  try {
    const user = await userService.getUserByUid(req.params.uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /admin/users/:uid
 * Update any user's profile (admin override)
 */
router.put('/users/:uid', async (req, res, next) => {
  try {
    const updatedUser = await userService.updateUser(req.params.uid, req.body);
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /admin/users/:uid
 * Delete a user account (Firestore doc + Firebase Auth)
 */
router.delete('/users/:uid', async (req, res, next) => {
  try {
    const uid = req.params.uid;

    // Prevent self-deletion
    if (uid === req.user.uid) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    // Delete user's Firestore document
    const userDoc = await db.collection(collections.users).doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.collection(collections.users).doc(uid).delete();

    // Delete from Firebase Auth
    try {
      await auth.deleteUser(uid);
    } catch (authError) {
      // User may not exist in Auth (e.g. already deleted)
      console.warn('Could not delete user from Firebase Auth:', authError.message);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ─── Businesses ──────────────────────────────────────────

/**
 * GET /admin/businesses
 * List all businesses
 */
router.get('/businesses', async (req, res, next) => {
  try {
    const businesses = await businessService.listBusinesses('-created_at', 200);
    res.json(businesses);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /admin/businesses/:id
 * Update any business (admin override, no ownership check)
 */
router.put('/businesses/:id', async (req, res, next) => {
  try {
    const business = await businessService.getBusinessById(req.params.id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    const updated = await businessService.updateBusiness(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /admin/businesses/:id
 * Delete any business (admin override)
 */
router.delete('/businesses/:id', async (req, res, next) => {
  try {
    const business = await businessService.getBusinessById(req.params.id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    await businessService.deleteBusiness(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ─── Opportunities ───────────────────────────────────────

/**
 * GET /admin/opportunities
 * List all volunteer opportunities
 */
router.get('/opportunities', async (req, res, next) => {
  try {
    const opportunities = await opportunityService.listOpportunities({}, '-created_at', 200);
    res.json(opportunities);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /admin/opportunities/:id
 * Update any opportunity (admin override)
 */
router.put('/opportunities/:id', async (req, res, next) => {
  try {
    const opp = await opportunityService.getOpportunityById(req.params.id);
    if (!opp) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    const updated = await opportunityService.updateOpportunity(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /admin/opportunities/:id
 * Delete any opportunity (admin override)
 */
router.delete('/opportunities/:id', async (req, res, next) => {
  try {
    const opp = await opportunityService.getOpportunityById(req.params.id);
    if (!opp) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    await opportunityService.deleteOpportunity(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ─── Stats ───────────────────────────────────────────────

/**
 * GET /admin/stats
 * Get platform-wide statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const [usersSnap, businessesSnap, opportunitiesSnap, commitmentsSnap] = await Promise.all([
      db.collection(collections.users).count().get(),
      db.collection(collections.businesses).count().get(),
      db.collection(collections.volunteerOpportunities).count().get(),
      db.collection(collections.volunteerCommitments).count().get(),
    ]);

    res.json({
      total_users: usersSnap.data().count,
      total_businesses: businessesSnap.data().count,
      total_opportunities: opportunitiesSnap.data().count,
      total_commitments: commitmentsSnap.data().count,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
