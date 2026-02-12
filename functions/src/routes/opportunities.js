import { Router } from 'express';
import { verifyToken, optionalAuth } from '../middleware/auth.js';
import * as opportunityService from '../services/opportunityService.js';
import * as businessService from '../services/businessService.js';

const router = Router();

/**
 * GET /opportunities
 * List all opportunities
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { status, business_id, sort = '-created_at', limit = 100 } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (business_id) filters.business_id = business_id;

    const opportunities = await opportunityService.listOpportunities(filters, sort, parseInt(limit));
    res.json(opportunities);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /opportunities/:id
 * Get a single opportunity by ID
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const opportunity = await opportunityService.getOpportunityById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    res.json(opportunity);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /opportunities/business/:businessId
 * Get opportunities for a specific business
 */
router.get('/business/:businessId', optionalAuth, async (req, res, next) => {
  try {
    const { status } = req.query;
    const opportunities = await opportunityService.getOpportunitiesByBusiness(
      req.params.businessId,
      status
    );
    res.json(opportunities);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /opportunities
 * Create a new opportunity
 */
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { business_id } = req.body;

    // Verify user owns the business
    const business = await businessService.getBusinessById(business_id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    if (business.owner_uid !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to create opportunities for this business' });
    }

    const opportunity = await opportunityService.createOpportunity({
      ...req.body,
      business_name: business.name
    });

    res.status(201).json(opportunity);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /opportunities/:id
 * Update an opportunity
 */
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const opportunity = await opportunityService.getOpportunityById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // Verify user owns the business
    const business = await businessService.getBusinessById(opportunity.business_id);
    if (!business || business.owner_uid !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to update this opportunity' });
    }

    const updatedOpportunity = await opportunityService.updateOpportunity(req.params.id, req.body);
    res.json(updatedOpportunity);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /opportunities/:id
 * Delete an opportunity
 */
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const opportunity = await opportunityService.getOpportunityById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // Verify user owns the business
    const business = await businessService.getBusinessById(opportunity.business_id);
    if (!business || business.owner_uid !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to delete this opportunity' });
    }

    await opportunityService.deleteOpportunity(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /opportunities/filter
 * Filter opportunities by criteria
 */
router.post('/filter', optionalAuth, async (req, res, next) => {
  try {
    const { filters = {}, sort = '-created_at', limit = 100 } = req.body;
    const opportunities = await opportunityService.listOpportunities(filters, sort, limit);
    res.json(opportunities);
  } catch (error) {
    next(error);
  }
});

export default router;
