# CLAUDE.md — ClarksvilleThreads (CommunityConnect)

This file provides guidance for AI assistants working on the ClarksvilleThreads codebase.

## Project Overview

**CommunityConnect** is a local volunteer platform that connects volunteers with businesses and nonprofits. The app supports browsing organizations, discovering volunteer opportunities, tracking commitments, sending notifications, and managing business profiles.

- **Frontend:** React SPA hosted on Firebase Hosting
- **Backend:** Cloud Functions (Express) on Firebase
- **Database:** Firestore (NoSQL)
- **Storage:** Firebase Cloud Storage
- **Auth:** Firebase Authentication (Google Sign-In)
- **AI:** Vertex AI (via Cloud Functions)
- **Email:** SendGrid (via Cloud Functions)
- **GCP Project:** `community-threads-486622-2c2e0` (region: `us-central1`)

---

## Repository Structure

```
ClarksvilleThreads/
├── src/                        # Frontend React source
│   ├── main.jsx                # Entry point
│   ├── App.jsx                 # Root component (router + providers)
│   ├── Layout.jsx              # App shell (nav header + footer)
│   ├── pages.config.js         # Route registry — add new pages here
│   ├── api/
│   │   └── gcpClient.js        # Unified API client (entities, auth, integrations)
│   ├── components/
│   │   ├── ui/                 # Shadcn/ui primitives (50+ components)
│   │   ├── business/           # Business-domain components
│   │   └── explore/            # Explore-page components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/
│   │   ├── FirebaseAuthContext.jsx  # Auth context + useAuth hook
│   │   ├── firebase-config.js       # Firebase SDK init + env config
│   │   ├── query-client.js          # TanStack Query client instance
│   │   └── utils.js                 # cn() utility
│   ├── pages/                  # One file per page/route
│   └── utils/
│       └── index.ts            # createPageUrl() helper
├── functions/                  # Cloud Functions backend
│   ├── index.js                # Express app + Cloud Function export
│   └── src/
│       ├── config/
│       │   ├── firebase.js     # Firebase Admin SDK init
│       │   └── vertexai.js     # Vertex AI client config
│       ├── middleware/
│       │   └── auth.js         # JWT auth middleware
│       ├── routes/             # Express route handlers
│       │   ├── auth.js         # /auth/*
│       │   ├── businesses.js   # /businesses/*
│       │   ├── opportunities.js # /opportunities/*
│       │   ├── commitments.js  # /commitments/*
│       │   ├── chat.js         # /chat/invoke (LLM)
│       │   ├── notifications.js # /notifications/*
│       │   ├── favorites.js    # /favorites/*
│       │   ├── reviews.js      # /reviews/*
│       │   └── uploads.js      # /uploads/*
│       └── services/           # Business logic layer
│           ├── businessService.js
│           ├── commitmentService.js
│           ├── emailService.js
│           ├── llmService.js
│           ├── notificationService.js
│           ├── opportunityService.js
│           └── userService.js
├── .github/workflows/          # CI/CD (deploy on push to main)
├── firebase.json               # Firebase project config + emulator ports
├── firestore.rules             # Firestore security rules
├── firestore.indexes.json      # Firestore composite indexes
├── storage.rules               # Cloud Storage security rules
├── vite.config.js              # Vite build config (alias @ → ./src)
├── tailwind.config.js          # Tailwind + shadcn theme
├── components.json             # Shadcn/ui config (new-york style, neutral)
└── eslint.config.js            # ESLint (React + hooks rules)
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18.2 |
| Build tool | Vite 6.1 |
| Routing | React Router DOM 6.26 |
| Styling | Tailwind CSS 3.4 |
| UI components | Shadcn/ui (Radix UI primitives) |
| Server state | TanStack React Query 5 |
| Forms | React Hook Form 7 + Zod 3 |
| Animation | Framer Motion 11 |
| Icons | Lucide React |
| Backend runtime | Node.js 22, Express 4 |
| Backend hosting | Firebase Cloud Functions (1st gen, 256MB, us-central1) |
| Database | Firestore |
| Auth | Firebase Auth (Google provider) |
| Storage | Firebase Cloud Storage |
| AI | Google Vertex AI |
| Email | SendGrid |
| CI/CD | GitHub Actions → Firebase Hosting |

---

## Development Setup

### Prerequisites

- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud SDK (for production deployments)

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=          # Optional: defaults to the production Cloud Functions URL
VITE_USE_EMULATORS=true # Set to 'true' for local emulator development
```

### Local Development (with Firebase Emulators)

```bash
# 1. Install frontend dependencies
npm install

# 2. Install backend dependencies
cd functions && npm install && cd ..

# 3. Start all emulators (auth, functions, firestore, hosting, storage)
npm run emulators

# 4. In a separate terminal, start the Vite dev server
npm run dev
```

Emulator ports:
| Service | Port |
|---|---|
| Auth | 9099 |
| Functions | 5001 |
| Firestore | 8080 |
| Hosting | 5000 |
| Storage | 9199 |
| Emulator UI | 4000 |

### Available Scripts

**Frontend (root):**
```bash
npm run dev          # Start Vite dev server
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npm run lint         # ESLint
npm run typecheck    # TypeScript check (via jsconfig.json)
npm run deploy       # Build + deploy hosting only
npm run deploy:all   # Build + deploy hosting + functions + rules
npm run emulators    # Start full Firebase emulator suite
```

**Backend (functions/):**
```bash
npm run serve        # Start functions emulator only
npm run deploy       # Deploy functions only
npm run logs         # Tail Cloud Function logs
```

---

## Key Conventions

### Routing

Pages are registered in `src/pages.config.js`. To add a new page:

1. Create the page component in `src/pages/MyPage.jsx`
2. Import and add it to the `PAGES` map in `pages.config.js`
3. The route becomes `/<PageName>` automatically

Use the `createPageUrl()` helper from `src/utils/index.ts` to generate route paths:

```jsx
import { createPageUrl } from "@/utils";

// Generates "/BusinessDashboard"
<Link to={createPageUrl("BusinessDashboard")}>Dashboard</Link>
```

**Always use React Router `<Link>` for internal navigation**, not `<a>` tags or `window.location.href`. This was the source of past navigation bugs.

### Path Alias

The `@` alias maps to `./src`. Use it for all imports within the `src/` tree:

```js
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/FirebaseAuthContext";
```

### Authentication

Use the `useAuth()` hook from `@/lib/FirebaseAuthContext`:

```jsx
const { user, isAuthenticated, isLoadingAuth, signInWithGoogle, logout, updateMe, refreshUser } = useAuth();
```

- `user.uid` — Firebase UID
- `user.email` — user email
- `user.full_name` — display name
- `user.is_business_owner` — boolean flag; controls nav items shown
- `user.total_hours_volunteered` — shown in the header

The auth system uses popup sign-in, falling back to redirect in iframe environments or when popups are blocked.

### API Client

All API calls go through `src/api/gcpClient.js`. It attaches the Firebase ID token as a `Bearer` token to every request.

```js
import { entities, authClient, integrations } from "@/api/gcpClient";

// CRUD on Firestore collections
await entities.Business.list();
await entities.Business.get(id);
await entities.Business.create(data);
await entities.Business.update(id, data);
await entities.Business.delete(id);
await entities.Business.filter({ status: "active" }, "-created_at", 10);

// Auth endpoints
await authClient.me();
await authClient.updateMe(data);
await authClient.register(data);

// Integrations
await integrations.Core.InvokeLLM({ prompt, model, temperature });
await integrations.Core.UploadFile({ file, fileName, contentType });
await integrations.Core.UploadFileBase64({ base64Data, fileName, contentType });
```

Available entity clients: `Business`, `VolunteerOpportunity`, `VolunteerCommitment`, `Notification`, `Favorite`, `Review`.

### UI Components

UI primitives live in `src/components/ui/`. These are [Shadcn/ui](https://ui.shadcn.com/) components (new-york style, neutral color, Radix UI-based).

- Import from `@/components/ui/<component-name>`
- Do not edit files in `src/components/ui/` directly unless patching a bug — prefer composition
- Use `cn()` from `@/lib/utils` for conditional class merging (combines `clsx` + `tailwind-merge`)

```js
import { cn } from "@/lib/utils";
<div className={cn("base-class", isActive && "active-class")} />
```

### Styling

- **Tailwind CSS** for all styling. No CSS modules or styled-components.
- Design system uses Inter font, blue-900 primary (`#1e3a8a`), gray-50 background.
- Dark mode is class-based but not currently activated in the app.
- Custom CSS variables for colors are defined in `Layout.jsx` via inline `<style>`.

### Forms

Use React Hook Form + Zod for all forms:

```jsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1) });
const form = useForm({ resolver: zodResolver(schema) });
```

### Data Fetching

Use TanStack React Query for server state. The query client instance is in `src/lib/query-client.js`.

### Notifications / Toasts

Two toast libraries are in use:
- **Sonner** (`sonner`) — preferred for new code
- **React Hot Toast** (`react-hot-toast`) — legacy, still in use

Use Sonner's `toast()` for new features.

---

## Backend Structure

The Cloud Functions backend is a single Express app exported as `api` from `functions/index.js`. It runs in `us-central1` with 256MB memory.

### API Route Prefix

In production: `https://us-central1-community-threads-486622-2c2e0.cloudfunctions.net/api`

With emulators: `http://localhost:5001/community-threads-486622-2c2e0/us-central1/api`

### Auth Middleware

`functions/src/middleware/auth.js` verifies the Firebase ID token on protected routes. Routes that call `authenticate` middleware require a valid `Authorization: Bearer <token>` header.

### Adding a New Route

1. Create `functions/src/routes/<name>.js` with an Express router
2. Optionally create `functions/src/services/<name>Service.js` for business logic
3. Import and mount in `functions/index.js`:
   ```js
   import myRoutes from './src/routes/<name>.js';
   app.use('/<name>', myRoutes);
   ```

### LLM Integration

`functions/src/services/llmService.js` calls Vertex AI. Invoked via `POST /chat/invoke` with `{ prompt, model, temperature, maxOutputTokens }`.

---

## Firestore Data Model

| Collection | Key Fields | Access |
|---|---|---|
| `users` | `uid`, `email`, `full_name`, `is_business_owner`, `total_hours_volunteered` | Owner read/write; authenticated read |
| `businesses` | `owner_uid`, `name`, `description`, `category`, `location` | Public read; owner update/delete |
| `volunteer_opportunities` | `business_id`, `title`, `status`, `date`, `hours` | Public read; authenticated write |
| `volunteer_commitments` | `volunteer_email`, `opportunity_id`, `status` | Authenticated only |
| `notifications` | `user_email`, `message`, `read`, `created_at` | User-specific |
| `favorites` | `user_uid`, `business_id` | User-specific |
| `reviews` | `user_uid`, `business_id`, `rating`, `text` | Public read; owner update/delete |
| `monthly_availability` | `user_uid`, `month`, `available_dates` | Authenticated read; owner write |

Firestore security rules are in `firestore.rules`. Composite indexes are in `firestore.indexes.json`.

Cloud Storage paths follow `/uploads/{userId}/**`. All files are publicly readable; only the owning user can write/delete.

---

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

- **`firebase-hosting-deploy.yml`** — Triggered on push to `main`. Runs `npm install` → `npm run build` → deploys Firebase Hosting.
- **`firebase-hosting-preview.yml`** — Triggered on pull requests to `main`. Deploys a 7-day preview channel.

Both workflows use Workload Identity Federation (keyless auth) with service account `github-actions-deploy@community-threads-486622-2c2e0.iam.gserviceaccount.com`.

---

## Common Pitfalls

- **Navigation:** Always use React Router `<Link to={...}>` for internal links. Using `<a href>` or `window.location.href` breaks client-side routing and has caused repeated bugs.
- **API base URL:** Never hardcode the API URL. It is read from `VITE_API_URL` env var (or constructed from the Firebase project ID). Access it via the `API_URL` export from `src/lib/firebase-config.js`.
- **ES modules:** Both the frontend and `functions/` use `"type": "module"`. All imports must use `.js` extensions in the functions code.
- **Shadcn components:** Do not install new shadcn components by editing `src/components/ui/` manually. Use the CLI: `npx shadcn@latest add <component>`.
- **Empty page files:** Several page files (`BusinessApplications.jsx`, `ManageOpportunities.jsx`, `RegisterBusiness.jsx`, `UserTypeSelection.jsx`) are scaffolded but empty. Implement them before linking to them.
- **Dual toast libraries:** Both `sonner` and `react-hot-toast` are installed. Prefer `sonner` for new code.
