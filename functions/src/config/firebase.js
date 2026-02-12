import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin SDK
// When running in Cloud Functions, credentials are auto-detected
if (!getApps().length) {
  initializeApp();
}

export const db = getFirestore();
export const auth = getAuth();
export const storage = getStorage();

// Collection references
export const collections = {
  users: 'users',
  businesses: 'businesses',
  volunteerOpportunities: 'volunteer_opportunities',
  volunteerCommitments: 'volunteer_commitments',
  notifications: 'notifications',
  favorites: 'favorites',
  reviews: 'reviews',
  monthlyAvailability: 'monthly_availability'
};

export default { db, auth, storage, collections };
