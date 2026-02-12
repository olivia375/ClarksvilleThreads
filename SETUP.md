# CommonThread - GCP Setup Guide

This guide walks through setting up the CommonThread volunteer platform on Google Cloud Platform.

## Prerequisites

- Node.js 20+
- npm or yarn
- Google Cloud SDK (`gcloud` CLI)
- Firebase CLI (`firebase-tools`)
- A GCP account with billing enabled

## GCP Configuration

- **Project ID**: `community-threads-486622-2c2e0`
- **Project Number**: `722363925527`
- **Region**: `us-central1`

## Phase 1: GCP Infrastructure Setup

### 1. Authenticate with GCP

```bash
# Login to Google Cloud
gcloud auth login commonthread.clarksville@gmail.com

# Set the project
gcloud config set project community-threads-486622-2c2e0

# Verify configuration
gcloud config list
```

### 2. Enable Required APIs

```bash
gcloud services enable \
  firestore.googleapis.com \
  cloudfunctions.googleapis.com \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com
```

### 3. Initialize Firebase

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Project is already initialized with:
# - Firestore
# - Functions
# - Hosting
# - Storage
```

### 4. Create Cloud Storage Bucket

```bash
# Create uploads bucket
gsutil mb -l us-central1 gs://community-threads-486622-2c2e0-uploads

# Set CORS configuration
gsutil cors set cors.json gs://community-threads-486622-2c2e0-uploads
```

Create `cors.json`:
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
```

### 5. Configure Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select the `community-threads-486622-2c2e0` project
3. Navigate to **Authentication** > **Sign-in method**
4. Enable **Google** provider
5. Add authorized domains if needed

### 6. Set Up Secrets

```bash
# Store SendGrid API key
echo -n "your-sendgrid-api-key" | gcloud secrets create SENDGRID_API_KEY --data-file=-

# Grant Cloud Functions access to the secret
gcloud secrets add-iam-policy-binding SENDGRID_API_KEY \
  --member="serviceAccount:community-threads-486622-2c2e0@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Phase 2: Local Development Setup

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install functions dependencies
cd functions
npm install
cd ..
```

### 2. Configure Environment Variables

Create `.env` file from the example:
```bash
cp .env.example .env
```

Edit `.env` with your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=community-threads-486622-2c2e0.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=community-threads-486622-2c2e0
VITE_FIREBASE_STORAGE_BUCKET=community-threads-486622-2c2e0.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=https://us-central1-community-threads-486622-2c2e0.cloudfunctions.net/api
```

Get your Firebase config from:
1. Firebase Console > Project Settings > General > Your apps
2. Click on the web app or create one
3. Copy the configuration values

### 3. Start Local Development

**Option A: Using Firebase Emulators (Recommended)**

```bash
# Start emulators
npm run emulators

# In another terminal, start the frontend
npm run dev
```

Set `VITE_USE_EMULATORS=true` in `.env` to use local emulators.

**Option B: Using Production Backend**

```bash
# Just start the frontend (uses production Cloud Functions)
npm run dev
```

## Phase 3: Deployment

### 1. Deploy Cloud Functions

```bash
cd functions
npm run deploy
```

### 2. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 3. Deploy Frontend

```bash
# Build and deploy
npm run deploy

# Or deploy everything at once
npm run deploy:all
```

### 4. Verify Deployment

- Frontend: `https://community-threads-486622-2c2e0.web.app`
- API: `https://us-central1-community-threads-486622-2c2e0.cloudfunctions.net/api/health`

## Firestore Collections

| Collection | Description |
|------------|-------------|
| `users` | User profiles (keyed by Firebase UID) |
| `businesses` | Business/nonprofit profiles |
| `volunteer_opportunities` | Available volunteer opportunities |
| `volunteer_commitments` | Volunteer applications & commitments |
| `notifications` | In-app notifications |
| `favorites` | User favorites |
| `reviews` | Business reviews |
| `monthly_availability` | Volunteer availability |

## API Endpoints

All endpoints are prefixed with `/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/auth/me` | Get current user |
| PUT | `/auth/me` | Update user profile |
| GET | `/businesses` | List businesses |
| POST | `/businesses` | Create business |
| GET | `/businesses/:id` | Get business |
| PUT | `/businesses/:id` | Update business |
| GET | `/opportunities` | List opportunities |
| POST | `/opportunities` | Create opportunity |
| GET | `/commitments` | List user's commitments |
| POST | `/commitments` | Create commitment (apply) |
| PUT | `/commitments/:id` | Update commitment |
| GET | `/notifications` | Get notifications |
| POST | `/chat/invoke` | Invoke LLM chatbot |

## Troubleshooting

### Firebase Authentication Issues

1. Ensure Google provider is enabled in Firebase Console
2. Check authorized domains include your deployment URL
3. Verify environment variables are set correctly

### Cloud Functions Not Deploying

1. Check Node.js version matches `engines` in `functions/package.json`
2. Verify all required APIs are enabled
3. Check Cloud Build logs for errors

### Firestore Permission Denied

1. Verify user is authenticated
2. Check Firestore security rules
3. Ensure indexes are deployed

## Support

For issues, please open a GitHub issue at:
https://github.com/your-org/commonthread/issues
