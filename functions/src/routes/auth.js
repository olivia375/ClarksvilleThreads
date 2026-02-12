import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as userService from '../services/userService.js';
import * as emailService from '../services/emailService.js';

const router = Router();

/**
 * GET /auth/me
 * Get current user profile
 */
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const user = await userService.getUserByUid(req.user.uid);

    if (!user) {
      // Create user profile from Firebase auth data
      const newUser = await userService.upsertUser(req.user.uid, {
        email: req.user.email,
        full_name: req.user.name || req.user.email.split('@')[0],
        picture: req.user.picture || null
      });
      return res.json(newUser);
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /auth/me
 * Update current user profile
 */
router.put('/me', verifyToken, async (req, res, next) => {
  try {
    const existingUser = await userService.getUserByUid(req.user.uid);
    const isFirstTimeSetup = existingUser && !existingUser.age && !existingUser.hours_available;

    const updatedUser = await userService.updateUser(req.user.uid, req.body);

    // Send welcome email on first profile completion
    if (isFirstTimeSetup && (req.body.age || req.body.hours_available)) {
      try {
        await emailService.sendWelcomeEmail({
          userEmail: updatedUser.email,
          userName: updatedUser.full_name
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/register
 * Register a new user (creates profile after Firebase Auth signup)
 */
router.post('/register', verifyToken, async (req, res, next) => {
  try {
    const { full_name, ...otherData } = req.body;

    const user = await userService.upsertUser(req.user.uid, {
      email: req.user.email,
      full_name: full_name || req.user.name || req.user.email.split('@')[0],
      picture: req.user.picture || null,
      ...otherData
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
