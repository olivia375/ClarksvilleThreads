import { db, collections } from '../config/firebase.js';

/**
 * Create a new volunteer opportunity
 */
export const createOpportunity = async (opportunityData) => {
  const now = new Date().toISOString();

  const docRef = await db.collection(collections.volunteerOpportunities).add({
    ...opportunityData,
    slots_filled: 0,
    status: opportunityData.status || 'open',
    created_at: now,
    updated_at: now
  });

  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
};

/**
 * Get opportunity by ID
 */
export const getOpportunityById = async (id) => {
  const doc = await db.collection(collections.volunteerOpportunities).doc(id).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() };
};

/**
 * List all opportunities with optional filters
 */
export const listOpportunities = async (filters = {}, sortBy = '-created_at', limit = 100) => {
  let query = db.collection(collections.volunteerOpportunities);

  // Apply filters
  if (filters.status) {
    query = query.where('status', '==', filters.status);
  }
  if (filters.business_id) {
    query = query.where('business_id', '==', filters.business_id);
  }
  if (filters.urgency) {
    query = query.where('urgency', '==', filters.urgency);
  }

  // Parse sort parameter
  const descending = sortBy.startsWith('-');
  const field = descending ? sortBy.slice(1) : sortBy;

  query = query.orderBy(field, descending ? 'desc' : 'asc');
  query = query.limit(limit);

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Filter opportunities by business
 */
export const getOpportunitiesByBusiness = async (businessId, status = null) => {
  let query = db.collection(collections.volunteerOpportunities)
    .where('business_id', '==', businessId);

  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Update opportunity
 */
export const updateOpportunity = async (id, updates) => {
  const docRef = db.collection(collections.volunteerOpportunities).doc(id);

  await docRef.update({
    ...updates,
    updated_at: new Date().toISOString()
  });

  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
};

/**
 * Delete opportunity
 */
export const deleteOpportunity = async (id) => {
  await db.collection(collections.volunteerOpportunities).doc(id).delete();
  return { success: true };
};

/**
 * Increment slots filled
 */
export const incrementSlotsFilled = async (id) => {
  const docRef = db.collection(collections.volunteerOpportunities).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error('Opportunity not found');
  }

  const currentSlots = doc.data().slots_filled || 0;
  await docRef.update({
    slots_filled: currentSlots + 1,
    updated_at: new Date().toISOString()
  });

  const updatedDoc = await docRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() };
};

export default {
  createOpportunity,
  getOpportunityById,
  listOpportunities,
  getOpportunitiesByBusiness,
  updateOpportunity,
  deleteOpportunity,
  incrementSlotsFilled
};
