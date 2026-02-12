import { db, collections } from '../config/firebase.js';

/**
 * Create a new volunteer commitment
 */
export const createCommitment = async (commitmentData) => {
  const now = new Date().toISOString();

  const docRef = await db.collection(collections.volunteerCommitments).add({
    ...commitmentData,
    status: commitmentData.status || 'pending',
    created_at: now,
    updated_at: now
  });

  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
};

/**
 * Get commitment by ID
 */
export const getCommitmentById = async (id) => {
  const doc = await db.collection(collections.volunteerCommitments).doc(id).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() };
};

/**
 * Get commitments by volunteer email
 */
export const getCommitmentsByVolunteer = async (email, status = null) => {
  let query = db.collection(collections.volunteerCommitments)
    .where('volunteer_email', '==', email);

  if (status) {
    if (Array.isArray(status)) {
      query = query.where('status', 'in', status);
    } else {
      query = query.where('status', '==', status);
    }
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get commitments by business
 */
export const getCommitmentsByBusiness = async (businessId, status = null) => {
  let query = db.collection(collections.volunteerCommitments)
    .where('business_id', '==', businessId);

  if (status) {
    if (Array.isArray(status)) {
      query = query.where('status', 'in', status);
    } else {
      query = query.where('status', '==', status);
    }
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get commitments by opportunity
 */
export const getCommitmentsByOpportunity = async (opportunityId) => {
  const snapshot = await db.collection(collections.volunteerCommitments)
    .where('opportunity_id', '==', opportunityId)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Update commitment
 */
export const updateCommitment = async (id, updates) => {
  const docRef = db.collection(collections.volunteerCommitments).doc(id);

  await docRef.update({
    ...updates,
    updated_at: new Date().toISOString()
  });

  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
};

/**
 * Delete commitment
 */
export const deleteCommitment = async (id) => {
  await db.collection(collections.volunteerCommitments).doc(id).delete();
  return { success: true };
};

/**
 * List all commitments (admin)
 */
export const listCommitments = async (limit = 100) => {
  const snapshot = await db.collection(collections.volunteerCommitments)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export default {
  createCommitment,
  getCommitmentById,
  getCommitmentsByVolunteer,
  getCommitmentsByBusiness,
  getCommitmentsByOpportunity,
  updateCommitment,
  deleteCommitment,
  listCommitments
};
