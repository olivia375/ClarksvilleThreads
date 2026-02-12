import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as commitmentService from '../services/commitmentService.js';
import * as opportunityService from '../services/opportunityService.js';
import * as businessService from '../services/businessService.js';
import * as notificationService from '../services/notificationService.js';
import * as emailService from '../services/emailService.js';
import * as userService from '../services/userService.js';

const router = Router();

/**
 * GET /commitments
 * List commitments for current user
 */
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const user = await userService.getUserByUid(req.user.uid);
    const { status } = req.query;

    const commitments = await commitmentService.getCommitmentsByVolunteer(
      user.email,
      status ? status.split(',') : null
    );
    res.json(commitments);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /commitments/:id
 * Get a single commitment by ID
 */
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const commitment = await commitmentService.getCommitmentById(req.params.id);
    if (!commitment) {
      return res.status(404).json({ error: 'Commitment not found' });
    }
    res.json(commitment);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /commitments/business/:businessId
 * Get commitments for a specific business
 */
router.get('/business/:businessId', verifyToken, async (req, res, next) => {
  try {
    // Verify user owns the business
    const business = await businessService.getBusinessById(req.params.businessId);
    if (!business || business.owner_uid !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to view these commitments' });
    }

    const { status } = req.query;
    const commitments = await commitmentService.getCommitmentsByBusiness(
      req.params.businessId,
      status ? status.split(',') : null
    );
    res.json(commitments);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /commitments
 * Create a new commitment (apply to opportunity)
 */
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const user = await userService.getUserByUid(req.user.uid);
    const { opportunity_id, hours_committed, start_date, notes } = req.body;

    // Get opportunity and business
    const opportunity = await opportunityService.getOpportunityById(opportunity_id);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    const business = await businessService.getBusinessById(opportunity.business_id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Check if slots are available
    if (opportunity.slots_needed > 0 && opportunity.slots_filled >= opportunity.slots_needed) {
      return res.status(400).json({ error: 'This opportunity is already full' });
    }

    // Check requirements for auto-approval
    const meetsAgeRequirement = user.age && user.age >= (business.min_volunteer_age || 0);

    // Calculate scheduled hours for the selected month
    const selectedMonth = new Date(start_date);
    const existingCommitments = await commitmentService.getCommitmentsByVolunteer(
      user.email,
      ['confirmed', 'in_progress']
    );

    const scheduledHoursInMonth = existingCommitments
      .filter(c => {
        if (!c.start_date) return false;
        const commitmentDate = new Date(c.start_date);
        return commitmentDate.getMonth() === selectedMonth.getMonth() &&
               commitmentDate.getFullYear() === selectedMonth.getFullYear();
      })
      .reduce((sum, c) => sum + (c.hours_committed || 0), 0);

    const hoursAvailable = (user.hours_available || 0) - scheduledHoursInMonth;
    const hasEnoughHours = hoursAvailable >= parseInt(hours_committed);

    // Auto-approve if requirements are met
    const status = meetsAgeRequirement && hasEnoughHours ? 'confirmed' : 'pending';

    // Create the commitment
    const commitment = await commitmentService.createCommitment({
      volunteer_email: user.email,
      volunteer_name: user.full_name,
      opportunity_id,
      business_id: business.id,
      business_name: business.name,
      opportunity_title: opportunity.title,
      hours_committed: parseInt(hours_committed),
      start_date,
      notes,
      status
    });

    // Update opportunity slots if confirmed
    if (status === 'confirmed' && opportunity.slots_needed > 0) {
      await opportunityService.incrementSlotsFilled(opportunity_id);
    }

    // Create notification
    const notificationMessage = status === 'confirmed'
      ? `Your application for "${opportunity.title}" at ${business.name} has been automatically confirmed!`
      : `Your application for "${opportunity.title}" at ${business.name} has been received and is pending review.`;

    await notificationService.createNotification({
      user_email: user.email,
      type: status === 'confirmed' ? 'application_approved' : 'application_received',
      title: status === 'confirmed' ? 'Application Confirmed!' : 'Application Submitted',
      message: notificationMessage,
      related_commitment_id: commitment.id,
      related_business_id: business.id
    });

    // Send email
    try {
      await emailService.sendApplicationConfirmation({
        userEmail: user.email,
        userName: user.full_name,
        businessName: business.name,
        opportunityTitle: opportunity.title,
        hoursCommitted: hours_committed,
        startDate: new Date(start_date).toLocaleDateString(),
        status
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }

    res.status(201).json(commitment);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /commitments/:id
 * Update a commitment (status, hours, etc.)
 */
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const commitment = await commitmentService.getCommitmentById(req.params.id);
    if (!commitment) {
      return res.status(404).json({ error: 'Commitment not found' });
    }

    const user = await userService.getUserByUid(req.user.uid);

    // Check if user is the volunteer or the business owner
    const business = await businessService.getBusinessById(commitment.business_id);
    const isVolunteer = commitment.volunteer_email === user.email;
    const isBusinessOwner = business && business.owner_uid === req.user.uid;

    if (!isVolunteer && !isBusinessOwner) {
      return res.status(403).json({ error: 'Not authorized to update this commitment' });
    }

    // Handle status changes
    const { status: newStatus } = req.body;
    const oldStatus = commitment.status;

    // If business owner is approving a pending application
    if (isBusinessOwner && oldStatus === 'pending' && newStatus === 'confirmed') {
      // Update slots
      const opportunity = await opportunityService.getOpportunityById(commitment.opportunity_id);
      if (opportunity && opportunity.slots_needed > 0) {
        await opportunityService.incrementSlotsFilled(commitment.opportunity_id);
      }

      // Notify volunteer
      await notificationService.createNotification({
        user_email: commitment.volunteer_email,
        type: 'application_approved',
        title: 'Application Approved!',
        message: `Your application for "${commitment.opportunity_title || 'opportunity'}" at ${commitment.business_name} has been approved!`,
        related_commitment_id: commitment.id,
        related_business_id: commitment.business_id
      });
    }

    const updatedCommitment = await commitmentService.updateCommitment(req.params.id, req.body);
    res.json(updatedCommitment);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /commitments/:id
 * Delete a commitment
 */
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const commitment = await commitmentService.getCommitmentById(req.params.id);
    if (!commitment) {
      return res.status(404).json({ error: 'Commitment not found' });
    }

    const user = await userService.getUserByUid(req.user.uid);

    // Check if user is the volunteer or the business owner
    const business = await businessService.getBusinessById(commitment.business_id);
    const isVolunteer = commitment.volunteer_email === user.email;
    const isBusinessOwner = business && business.owner_uid === req.user.uid;

    if (!isVolunteer && !isBusinessOwner) {
      return res.status(403).json({ error: 'Not authorized to delete this commitment' });
    }

    await commitmentService.deleteCommitment(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /commitments/filter
 * Filter commitments by criteria
 */
router.post('/filter', verifyToken, async (req, res, next) => {
  try {
    const user = await userService.getUserByUid(req.user.uid);
    const { volunteer_email, business_id, status } = req.body;

    // If filtering by business, verify ownership
    if (business_id) {
      const business = await businessService.getBusinessById(business_id);
      if (business && business.owner_uid === req.user.uid) {
        const commitments = await commitmentService.getCommitmentsByBusiness(business_id, status);
        return res.json(commitments);
      }
    }

    // Otherwise, return user's own commitments
    const email = volunteer_email || user.email;
    const commitments = await commitmentService.getCommitmentsByVolunteer(email, status);
    res.json(commitments);
  } catch (error) {
    next(error);
  }
});

export default router;
