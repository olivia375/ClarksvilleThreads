import { db, collections } from '../config/firebase.js';

/**
 * Create a new business
 */
export const createBusiness = async (businessData) => {
  const now = new Date().toISOString();

  const docRef = await db.collection(collections.businesses).add({
    ...businessData,
    average_rating: 0,
    total_reviews: 0,
    created_at: now,
    updated_at: now
  });

  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
};

/**
 * Get business by ID
 */
export const getBusinessById = async (id) => {
  const doc = await db.collection(collections.businesses).doc(id).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() };
};

/**
 * Get business by owner UID
 */
export const getBusinessByOwner = async (ownerUid) => {
  const snapshot = await db.collection(collections.businesses)
    .where('owner_uid', '==', ownerUid)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

/**
 * List all businesses with optional sorting
 */
export const listBusinesses = async (sortBy = '-created_at', limit = 100) => {
  let query = db.collection(collections.businesses);

  // Parse sort parameter
  const descending = sortBy.startsWith('-');
  const field = descending ? sortBy.slice(1) : sortBy;

  query = query.orderBy(field, descending ? 'desc' : 'asc');
  query = query.limit(limit);

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Filter businesses
 */
export const filterBusinesses = async (filters, limit = 100) => {
  let query = db.collection(collections.businesses);

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query = query.where(key, '==', value);
    }
  });

  query = query.limit(limit);

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Update business
 */
export const updateBusiness = async (id, updates) => {
  const docRef = db.collection(collections.businesses).doc(id);

  await docRef.update({
    ...updates,
    updated_at: new Date().toISOString()
  });

  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
};

/**
 * Delete business
 */
export const deleteBusiness = async (id) => {
  await db.collection(collections.businesses).doc(id).delete();
  return { success: true };
};

/**
 * Update business rating (called after a review is added)
 */
export const updateBusinessRating = async (businessId) => {
  // Get all reviews for this business
  const reviewsSnapshot = await db.collection(collections.reviews)
    .where('business_id', '==', businessId)
    .get();

  if (reviewsSnapshot.empty) {
    return;
  }

  const reviews = reviewsSnapshot.docs.map(doc => doc.data());
  const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
  const averageRating = totalRating / reviews.length;

  await db.collection(collections.businesses).doc(businessId).update({
    average_rating: Math.round(averageRating * 10) / 10,
    total_reviews: reviews.length,
    updated_at: new Date().toISOString()
  });
};

export default {
  createBusiness,
  getBusinessById,
  getBusinessByOwner,
  listBusinesses,
  filterBusinesses,
  updateBusiness,
  deleteBusiness,
  updateBusinessRating
};
