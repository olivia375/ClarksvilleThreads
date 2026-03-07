/**
 * One-time cleanup script: removes test businesses and all related data.
 *
 * Businesses to remove (matched by name):
 *   "Me", "Christopher Campbell", "Hello", "Test"
 *
 * Also removes for each business:
 *   - volunteer_opportunities
 *   - reviews
 *   - favorites
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *   FIREBASE_PROJECT_ID=community-threads-486622-2c2e0 \
 *   node functions/scripts/cleanup-test-businesses.js
 *
 * Or from inside the functions/ directory:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *   FIREBASE_PROJECT_ID=community-threads-486622-2c2e0 \
 *   node scripts/cleanup-test-businesses.js
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const TEST_BUSINESS_NAMES = ['Me', 'Christopher Campbell', 'Hello', 'Test'];

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'community-threads-486622-2c2e0';
  initializeApp({ projectId });
}

const db = getFirestore();

async function deleteCollection(collectionRef) {
  const snapshot = await collectionRef.get();
  if (snapshot.empty) return 0;

  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  return snapshot.size;
}

async function cleanupTestBusinesses() {
  console.log('Looking for test businesses:', TEST_BUSINESS_NAMES);

  const snapshot = await db.collection('businesses').get();
  const testBusinesses = snapshot.docs.filter(doc =>
    TEST_BUSINESS_NAMES.includes(doc.data().name)
  );

  if (testBusinesses.length === 0) {
    console.log('No test businesses found. Nothing to delete.');
    return;
  }

  console.log(`Found ${testBusinesses.length} test business(es):`);
  testBusinesses.forEach(doc => {
    console.log(`  - [${doc.id}] "${doc.data().name}"`);
  });

  for (const businessDoc of testBusinesses) {
    const businessId = businessDoc.id;
    const businessName = businessDoc.data().name;
    console.log(`\nCleaning up "${businessName}" (${businessId})...`);

    // Delete volunteer opportunities
    const oppsQuery = db.collection('volunteer_opportunities').where('business_id', '==', businessId);
    const oppsDeleted = await deleteCollection(oppsQuery);
    console.log(`  Deleted ${oppsDeleted} volunteer opportunit${oppsDeleted !== 1 ? 'ies' : 'y'}`);

    // Delete reviews
    const reviewsQuery = db.collection('reviews').where('business_id', '==', businessId);
    const reviewsDeleted = await deleteCollection(reviewsQuery);
    console.log(`  Deleted ${reviewsDeleted} review${reviewsDeleted !== 1 ? 's' : ''}`);

    // Delete favorites
    const favoritesQuery = db.collection('favorites').where('business_id', '==', businessId);
    const favoritesDeleted = await deleteCollection(favoritesQuery);
    console.log(`  Deleted ${favoritesDeleted} favorite${favoritesDeleted !== 1 ? 's' : ''}`);

    // Delete the business itself
    await db.collection('businesses').doc(businessId).delete();
    console.log(`  Deleted business "${businessName}"`);
  }

  console.log('\nCleanup complete.');
}

cleanupTestBusinesses().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
