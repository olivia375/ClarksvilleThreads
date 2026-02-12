import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';

// Import routes
import authRoutes from './src/routes/auth.js';
import businessRoutes from './src/routes/businesses.js';
import opportunityRoutes from './src/routes/opportunities.js';
import commitmentRoutes from './src/routes/commitments.js';
import chatRoutes from './src/routes/chat.js';
import notificationRoutes from './src/routes/notifications.js';
import favoriteRoutes from './src/routes/favorites.js';
import reviewRoutes from './src/routes/reviews.js';
import uploadRoutes from './src/routes/uploads.js';

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/auth', authRoutes);
app.use('/businesses', businessRoutes);
app.use('/opportunities', opportunityRoutes);
app.use('/commitments', commitmentRoutes);
app.use('/chat', chatRoutes);
app.use('/notifications', notificationRoutes);
app.use('/favorites', favoriteRoutes);
app.use('/reviews', reviewRoutes);
app.use('/uploads', uploadRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Export the Express app as a Cloud Function (1st gen)
export const api = functions
  .region('us-central1')
  .runWith({ memory: '256MB' })
  .https.onRequest(app);
