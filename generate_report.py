from fpdf import FPDF

class ReportPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, "ClarksvilleThreads (CommonThread) - FBLA Rubric Analysis", align="C")
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def section_title(self, title):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(30, 60, 120)
        self.cell(0, 10, title, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(30, 60, 120)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def sub_title(self, title):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(50, 50, 50)
        self.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def body_text(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def bullet(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        x = self.get_x()
        self.cell(6, 5.5, "-")
        self.multi_cell(0, 5.5, text)
        self.ln(1)

    def status_badge(self, status, label):
        colors = {
            "pass": (34, 139, 34),
            "partial": (200, 150, 0),
            "fail": (200, 50, 50),
        }
        r, g, b = colors.get(status, (100, 100, 100))
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(r, g, b)
        self.cell(0, 6, label, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def table_row(self, cells, widths, bold=False, fill=False):
        self.set_font("Helvetica", "B" if bold else "", 9)
        if fill:
            self.set_fill_color(230, 235, 245)
        self.set_text_color(30, 30, 30)
        h = 7
        for i, (cell, w) in enumerate(zip(cells, widths)):
            self.cell(w, h, cell, border=1, fill=fill, align="C" if i > 0 else "L")
        self.ln(h)


pdf = ReportPDF()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)
pdf.add_page()

# ── TITLE PAGE ──
pdf.ln(30)
pdf.set_font("Helvetica", "B", 26)
pdf.set_text_color(30, 60, 120)
pdf.cell(0, 14, "ClarksvilleThreads", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 16)
pdf.set_text_color(80, 80, 80)
pdf.cell(0, 10, "CommonThread Volunteer Platform", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(8)
pdf.set_draw_color(30, 60, 120)
pdf.line(60, pdf.get_y(), 150, pdf.get_y())
pdf.ln(8)
pdf.set_font("Helvetica", "", 13)
pdf.cell(0, 8, "Codebase Overview & FBLA Rubric Analysis", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(6)
pdf.set_font("Helvetica", "", 11)
pdf.set_text_color(120, 120, 120)
pdf.cell(0, 7, "FBLA Coding & Programming 2025-2026", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 7, '"Byte-Sized Business Boost"', align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 7, "February 2026", align="C", new_x="LMARGIN", new_y="NEXT")

# ── PAGE 2: PROJECT OVERVIEW ──
pdf.add_page()
pdf.section_title("1. Project Overview")
pdf.body_text(
    "CommonThread is a full-stack volunteer management platform that connects volunteers "
    "with local businesses and nonprofits. It serves as a centralized marketplace where "
    "volunteers discover opportunities matching their skills, apply, track hours, and earn "
    "recognition -- while business owners post opportunities, review applications, and manage "
    "their volunteer roster."
)


pdf.sub_title("Core User Flows")
pdf.bullet("Volunteers: Browse businesses, filter opportunities by skills/urgency, apply, track hours on a calendar, bookmark favorites, leave reviews.")
pdf.bullet("Business Owners: Register a business, post volunteer opportunities with perks, review/approve applications, manage a volunteer roster.")
pdf.bullet("AI Chatbot: Gemini-powered Q&A helps users navigate the platform.")

pdf.sub_title("FBLA Topic Alignment: Byte-Sized Business Boost")
pdf.body_text("The prompt requires a tool that helps users discover and support small, local businesses. CommonThread addresses this by letting users:")
pdf.bullet("Sort businesses by category (food, retail, services, nonprofit)")
pdf.bullet("Leave reviews and star ratings on businesses")
pdf.bullet("Sort businesses by rating, review count, or name")
pdf.bullet("Bookmark/favorite businesses for later")
pdf.bullet('Display special deals via "Volunteer Perks" on each opportunity')

# ── PAGE 3: TECH STACK ──
pdf.add_page()
pdf.section_title("2. Tech Stack")

widths = [55, 135]
pdf.table_row(["Layer", "Technology"], widths, bold=True, fill=True)
pdf.table_row(["Frontend", "React 18 + Vite 6 (JSX)"], widths)
pdf.table_row(["Routing", "React Router DOM 6"], widths)
pdf.table_row(["UI Components", "Radix UI (shadcn/ui) + Tailwind CSS"], widths)
pdf.table_row(["Data Fetching", "TanStack React Query 5"], widths)
pdf.table_row(["Forms", "React Hook Form + Zod validation"], widths)
pdf.table_row(["Animation", "Framer Motion"], widths)
pdf.table_row(["Maps", "React Leaflet"], widths)
pdf.table_row(["Backend", "Node.js 22 + Express (Cloud Functions)"], widths)
pdf.table_row(["Database", "Google Firestore (NoSQL)"], widths)
pdf.table_row(["Auth", "Firebase Auth (Google OAuth 2.0)"], widths)
pdf.table_row(["File Storage", "Google Cloud Storage (signed URLs)"], widths)
pdf.table_row(["AI / Chat", "Vertex AI - Gemini 1.5 Flash"], widths)
pdf.table_row(["Email", "SendGrid (transactional)"], widths)
pdf.table_row(["Secrets", "Google Cloud Secret Manager"], widths)
pdf.table_row(["Hosting", "Firebase Hosting"], widths)
pdf.table_row(["CI/CD", "GitHub Actions (auto deploy + PR previews)"], widths)

pdf.ln(4)
pdf.body_text(
    "The frontend is a React single-page application built with Vite, styled with Tailwind CSS, "
    "and using 20+ accessible Radix UI primitives. The backend is an Express REST API deployed as "
    "a Firebase Cloud Function with JWT-based auth. Data lives in Firestore with security rules "
    "enforcing user-scoped access. File uploads use signed URLs to Google Cloud Storage. The AI "
    "chatbot uses Vertex AI's Gemini 1.5 Flash model for interactive Q&A."
)

# ── PAGE 4: ENTRY POINTS ──
pdf.add_page()
pdf.section_title("3. Main Entry Points")

pdf.sub_title("Frontend")
pdf.bullet("index.html -> src/main.jsx -> src/App.jsx (React root with AuthProvider, QueryClient, Router)")
pdf.bullet("src/Layout.jsx wraps all pages with desktop sidebar + mobile hamburger navigation")

pdf.sub_title("Page Routes (src/pages.config.js)")
widths2 = [40, 55, 95]
pdf.table_row(["Route", "Component", "Purpose"], widths2, bold=True, fill=True)
pdf.table_row(["/", "Home.jsx", "Landing page with hero, features, stats"], widths2)
pdf.table_row(["/explore", "Explore.jsx", "Browse businesses, smart recommendations"], widths2)
pdf.table_row(["/opportunities", "Opportunities.jsx", "Filter volunteer opportunities"], widths2)
pdf.table_row(["/calendar", "Calendar.jsx", "Calendar view of committed dates"], widths2)
pdf.table_row(["/favorites", "Favorites.jsx", "Bookmarked businesses"], widths2)
pdf.table_row(["/profile", "Profile.jsx", "Edit skills, interests, track hours"], widths2)
pdf.table_row(["/business-dashboard", "BusinessDashboard.jsx", "Owner: manage opps & apps"], widths2)
pdf.table_row(["/business-detail", "BusinessDetail.jsx", "Single business view + apply"], widths2)
pdf.table_row(["/business-signup", "BusinessSignup.jsx", "2-step business registration"], widths2)

pdf.ln(4)
pdf.sub_title("Backend API (functions/)")
pdf.body_text("Express app exported as Firebase Cloud Function. Base URL: /api")
widths3 = [40, 75, 75]
pdf.table_row(["Route File", "Key Endpoints", "Purpose"], widths3, bold=True, fill=True)
pdf.table_row(["auth.js", "GET/PUT /auth/me, POST /register", "User profile & registration"], widths3)
pdf.table_row(["businesses.js", "CRUD + filter /businesses", "Business management"], widths3)
pdf.table_row(["opportunities.js", "CRUD + filter /opportunities", "Opportunity listings"], widths3)
pdf.table_row(["commitments.js", "CRUD + filter /commitments", "Volunteer applications"], widths3)
pdf.table_row(["notifications.js", "CRUD /notifications", "In-app notifications"], widths3)
pdf.table_row(["favorites.js", "CRUD /favorites", "Bookmarked businesses"], widths3)
pdf.table_row(["reviews.js", "CRUD /reviews", "Ratings & reviews"], widths3)
pdf.table_row(["chat.js", "POST /chat/invoke, /conversation", "AI chatbot (Gemini)"], widths3)
pdf.table_row(["uploads.js", "POST /uploads/signed-url", "File storage"], widths3)

# ── PAGE 5: FILE STRUCTURE ──
pdf.add_page()
pdf.section_title("4. File Structure")

pdf.set_font("Courier", "", 8)
pdf.set_text_color(40, 40, 40)
structure = """ClarksvilleThreads/
|-- src/                              FRONTEND
|   |-- main.jsx                      React entry point
|   |-- App.jsx                       Root: auth + routing + providers
|   |-- Layout.jsx                    Nav shell (sidebar + mobile menu)
|   |-- pages.config.js               Route definitions
|   |-- api/gcpClient.js              REST client with auth token injection
|   |-- lib/
|   |   |-- FirebaseAuthContext.jsx    Auth state: login/logout, tokens
|   |   |-- firebase-config.js        Firebase SDK initialization
|   |   |-- query-client.js           React Query config
|   |   |-- PageNotFound.jsx          404 page
|   |-- pages/                        9 page components (see routes above)
|   |-- components/
|   |   |-- ui/                       20+ shadcn/Radix UI primitives
|   |   |-- business/                 OpportunityManager, ReviewSection, etc.
|   |   |-- explore/BusinessCard.jsx  Business listing card
|   |   |-- NotificationBadge.jsx     Bell icon with unread count
|   |   |-- QASection.jsx             AI chatbot widget
|
|-- functions/                        BACKEND (Cloud Functions)
|   |-- index.js                      Express app + route mounting
|   |-- src/routes/                   9 route files (REST endpoints)
|   |-- src/services/                 7 service files (business logic)
|   |   |-- userService.js            User CRUD
|   |   |-- businessService.js        Business CRUD + rating calc
|   |   |-- opportunityService.js     Opportunity CRUD + slot tracking
|   |   |-- commitmentService.js      Application CRUD
|   |   |-- notificationService.js    Notification CRUD
|   |   |-- emailService.js           SendGrid emails
|   |   |-- llmService.js             Gemini AI invocation
|   |-- src/middleware/auth.js        JWT verification
|   |-- src/config/                   Firebase Admin + Vertex AI init
|
|-- firebase.json                     Hosting/functions/storage config
|-- firestore.rules                   DB security rules
|-- storage.rules                     File upload rules
|-- .github/workflows/               CI/CD (deploy + PR previews)
|-- tailwind.config.js                Tailwind theme
|-- vite.config.js                    Vite build config"""
for line in structure.split("\n"):
    pdf.cell(0, 4, line, new_x="LMARGIN", new_y="NEXT")
pdf.ln(4)

# ── PAGE 6: HOW IT WORKS ──
pdf.add_page()
pdf.section_title("5. How the Code Works (End-to-End)")

pdf.sub_title("Example: Volunteer Applies for an Opportunity")
pdf.body_text("1. AUTH: User clicks Google Sign-In. FirebaseAuthContext runs signInWithPopup(). Firebase returns a JWT stored in React context.")
pdf.body_text("2. BROWSE: User visits /explore. Explore.jsx calls gcpClient.entities.Business.list(). The API client attaches the JWT as a Bearer token and hits GET /businesses.")
pdf.body_text("3. BACKEND: routes/businesses.js receives the request. optionalAuth middleware verifies the token via Firebase Admin SDK. businessService.listBusinesses() queries Firestore and returns JSON.")
pdf.body_text("4. RECOMMEND: Explore.jsx scores businesses by matching user interests/skills to business categories and opportunity requirements. Top matches shown first.")
pdf.body_text("5. APPLY: User clicks Apply on an opportunity, fills the form. Frontend calls entities.VolunteerCommitment.create() which POSTs to /commitments.")
pdf.body_text("6. AUTO-ACCEPT: Backend checks age/hour requirements. If met, status = confirmed; otherwise pending. Increments slots_filled on the opportunity.")
pdf.body_text("7. NOTIFY: Backend creates a Firestore notification doc and sends a SendGrid confirmation email to the volunteer.")
pdf.body_text("8. UPDATE: React Query invalidates the cache. UI refreshes showing the new commitment on the Calendar page.")

pdf.sub_title("Data Flow Diagram")
pdf.set_font("Courier", "", 9)
flow = [
    "  React Pages  -->  gcpClient.js  -->  Cloud Functions (Express)",
    "       |                                      |",
    "  React Query          JWT Bearer         Firestore DB",
    "  (cache)              Auth Token         (NoSQL docs)",
    "       |                                      |",
    "  Firebase Auth  <--  Auth Middleware  <--  Security Rules",
]
for line in flow:
    pdf.cell(0, 5, line, new_x="LMARGIN", new_y="NEXT")
pdf.ln(6)

# ── PAGE 7: RUBRIC MAPPING ──
pdf.add_page()
pdf.section_title("6. FBLA Rubric Mapping (110 pts)")

pdf.sub_title("Code Quality (20 pts)")

pdf.set_font("Helvetica", "B", 10)
pdf.set_text_color(40, 40, 40)
pdf.cell(0, 6, "Language Selection (5 pts)", new_x="LMARGIN", new_y="NEXT")
pdf.status_badge("pass", "STRONG - React/JSX frontend, Node.js/Express backend")
pdf.body_text("Industry-standard choices. React for component-based UI, Express for REST APIs, Firestore for scalable NoSQL. Vite for fast builds. Can explain selection using industry terminology.")

pdf.set_font("Helvetica", "B", 10)
pdf.cell(0, 6, "Comments & Formatting (5 pts)", new_x="LMARGIN", new_y="NEXT")
pdf.status_badge("partial", "GAP - ~7% comment density, inconsistent across files")
pdf.body_text("gcpClient.js has good JSDoc comments. Layout.jsx and most pages have zero comments. Naming conventions are consistent (camelCase). Formatting is clean. Recommend adding JSDoc to all major functions and components.")

pdf.set_font("Helvetica", "B", 10)
pdf.cell(0, 6, "Modular & Readable (10 pts)", new_x="LMARGIN", new_y="NEXT")
pdf.status_badge("pass", "STRONG - Clean separation of concerns")
pdf.body_text("Frontend: pages / components / api / lib layers. Backend: routes / services / middleware / config layers. Each service handles one domain. Components are small and focused. React Query manages server state cleanly.")

pdf.sub_title("User Experience (25 pts)")

pdf.set_font("Helvetica", "B", 10)
pdf.cell(0, 6, "UX Design, Journey & Accessibility (10 pts)", new_x="LMARGIN", new_y="NEXT")
pdf.status_badge("partial", "GOOD - Radix UI provides accessibility foundation")
pdf.body_text("Responsive design (mobile + desktop). Radix UI provides keyboard navigation and ARIA attributes. Custom accessibility labels are sparse. No skip-nav or explicit a11y audit. Recommend adding aria-labels to business-specific components.")

pdf.set_font("Helvetica", "B", 10)
pdf.cell(0, 6, "Intuitive UI / Instructions (5 pts)", new_x="LMARGIN", new_y="NEXT")
pdf.status_badge("pass", "STRONG - Clear navigation, well-labeled forms")
pdf.body_text("Sidebar navigation with icons and labels. Mobile hamburger menu. Form fields have labels and placeholders. Error states shown via toast notifications.")

pdf.set_font("Helvetica", "B", 10)
pdf.cell(0, 6, "Navigation + Intelligent Feature (5 pts)", new_x="LMARGIN", new_y="NEXT")
pdf.status_badge("pass", "STRONG - AI chatbot + smart recommendations")
pdf.body_text("QASection.jsx provides Gemini-powered interactive Q&A. Explore.jsx has a recommendation engine matching user skills/interests to opportunities. Both qualify as intelligent features.")

pdf.set_font("Helvetica", "B", 10)
pdf.cell(0, 6, "Input Validation (5 pts)", new_x="LMARGIN", new_y="NEXT")
pdf.status_badge("fail", "GAP - Basic HTML5 validation only")
pdf.body_text("Required field checks exist but no semantic validation. Zod is installed but unused. No server-side schema validation. No specific error messages for edge cases. Recommend implementing Zod schemas on both frontend and backend.")

# ── PAGE 8: RUBRIC MAPPING CONTINUED ──
pdf.add_page()
pdf.sub_title("Functionality (25 pts)")

pdf.set_font("Helvetica", "B", 10)
pdf.cell(0, 6, "Addresses All Parts of Prompt (10 pts)", new_x="LMARGIN", new_y="NEXT")
pdf.status_badge("partial", "MOSTLY MET - 5 of 6 topic requirements covered")
pdf.body_text("Category sorting: YES. Reviews/ratings: YES. Sort by rating: YES. Favorites/bookmarks: YES. Special deals (volunteer perks): YES. Bot verification: MISSING. Recommend adding reCAPTCHA or email verification.")

pdf.set_font("Helvetica", "B", 10)
pdf.cell(0, 6, "Presentable Report / Data Analysis (10 pts)", new_x="LMARGIN", new_y="NEXT")
pdf.status_badge("fail", "MISSING - No export or analytics features")
pdf.body_text("Dashboard shows basic stat cards (opportunity count, applications, volunteers). No PDF/CSV export despite jsPDF and html2canvas being in package.json. No charts despite recharts being installed. Recommend implementing CSV export for volunteer rosters and a PDF report for business dashboards.")

pdf.set_font("Helvetica", "B", 10)
pdf.cell(0, 6, "Data Storage (5 pts)", new_x="LMARGIN", new_y="NEXT")
pdf.status_badge("pass", "STRONG - 8 Firestore collections, proper variable scope")
pdf.body_text("Uses arrays for skills, interests, and notifications. Firestore collections: users, businesses, volunteer_opportunities, volunteer_commitments, notifications, favorites, reviews, monthly_availability. Variable scope is logical throughout services and components.")

pdf.sub_title("Presentation Delivery (30 pts)")
pdf.body_text("These 30 points are earned during the live presentation and cannot be assessed from code alone. Categories: well-organized statements (10 pts), confidence/body language/eye contact/voice (10 pts), answering questions effectively (10 pts).")

pdf.sub_title("Presentation Protocols (10 pts)")
pdf.body_text("10 points for following guidelines (max 3 devices, topic alignment, no QR scanning, etc.). Ensure compliance during your presentation.")

# ── PAGE 9: SCORECARD ──
pdf.add_page()
pdf.section_title("7. Estimated Score & Gap Analysis")

widths4 = [65, 15, 15, 95]
pdf.table_row(["Rubric Item", "Max", "Est.", "Notes"], widths4, bold=True, fill=True)
pdf.table_row(["Language Selection", "5", "5", "React + Node.js, strong industry choice"], widths4)
pdf.table_row(["Comments & Formatting", "5", "3", "Clean formatting, sparse comments"], widths4)
pdf.table_row(["Modular & Readable", "10", "9", "Excellent separation of concerns"], widths4)
pdf.table_row(["UX Design & Accessibility", "10", "7", "Good UX, basic a11y via Radix"], widths4)
pdf.table_row(["Intuitive UI", "5", "4", "Clear nav, labeled forms"], widths4)
pdf.table_row(["Navigation + Intelligent", "5", "5", "AI chatbot + recommendations"], widths4)
pdf.table_row(["Input Validation", "5", "2", "Basic only, Zod unused"], widths4)
pdf.table_row(["Addresses Prompt", "10", "7", "5/6 features, missing bot check"], widths4)
pdf.table_row(["Reports / Data Analysis", "10", "2", "Basic stats only, no exports"], widths4)
pdf.table_row(["Data Storage", "5", "5", "8 collections, arrays, proper scope"], widths4)
pdf.table_row(["Presentation Delivery", "30", "?", "Depends on live presentation"], widths4)
pdf.table_row(["Protocols", "10", "10", "Follow guidelines at competition"], widths4)

pdf.ln(4)
pdf.set_font("Helvetica", "B", 12)
pdf.set_text_color(30, 60, 120)
pdf.cell(0, 8, "Estimated Technical Score: 59 / 70 (before presentation)", new_x="LMARGIN", new_y="NEXT")
pdf.ln(2)
pdf.set_font("Helvetica", "", 10)
pdf.set_text_color(40, 40, 40)
pdf.body_text("With the recommended fixes below, potential score: 68-70 / 70.")

# ── PAGE 10: RECOMMENDATIONS ──
pdf.add_page()
pdf.section_title("8. Priority Recommendations")

pdf.sub_title("CRITICAL (Highest Rubric Impact)")
pdf.bullet("Add bot verification: Integrate reCAPTCHA v3 on business signup and review forms. This is an explicit prompt requirement worth significant points.")
pdf.bullet("Implement report generation: Use the already-installed jsPDF + html2canvas to export business dashboards and volunteer hour summaries as PDFs. Add CSV export for volunteer rosters.")
pdf.bullet("Activate Zod validation: Zod is already in package.json. Add schemas to all backend routes and frontend forms for syntactic + semantic validation with helpful error messages.")

pdf.sub_title("HIGH (Moderate Rubric Impact)")
pdf.bullet("Increase code comments: Add JSDoc comments to all major functions, components, and services. Target 15%+ comment density. Focus on explaining WHY, not WHAT.")
pdf.bullet("Enhance README.md: Add project overview, architecture diagram, feature list, setup instructions, and third-party attribution (Radix UI, shadcn/ui, Firebase, etc.).")
pdf.bullet("Add accessibility labels: Add custom aria-label and aria-describedby to business cards, opportunity listings, and dashboard components.")

pdf.sub_title("MEDIUM (Polish)")
pdf.bullet("Add charts to dashboard: Use the already-installed recharts library to visualize volunteer hours, application trends, or rating distributions.")
pdf.bullet("Add email verification step: Require email confirmation before allowing reviews to prevent spam.")

# ── PAGE 11: CALIFORNIA CHAMPIONS COMPARISON ──
pdf.add_page()
pdf.section_title("9. Reference: California State Champions Presentation")

pdf.body_text(
    "The Westlake Tennis Academy team (Spencer & Jay) won the California state competition "
    "with a tennis lesson scheduling platform. Key takeaways from their presentation style:"
)

pdf.sub_title("Presentation Structure They Used")
pdf.bullet("Page-by-page walkthrough: Homepage -> Mission -> Learn More -> Join Lesson -> Account -> Instructors -> Volunteer -> Admin")
pdf.bullet("Highlighted responsive/mobile design and accessibility (color contrast, collapsing nav)")
pdf.bullet("Showed live user flows: creating accounts, joining lessons, submitting applications")
pdf.bullet("Demonstrated admin flow: reviewing applications, editing lessons, sending emails")
pdf.bullet("Showed backend code organization (models, controllers, routers)")
pdf.bullet("Demonstrated automated features (reminder emails via job scheduler)")
pdf.bullet("Emphasized: 'All designs were original, no templates, designed in Figma then coded in React'")

pdf.sub_title("How CommonThread Compares")
pdf.bullet("Your stack is MORE sophisticated: Firebase + Vertex AI + SendGrid + Firestore security rules vs. their React + Node + MongoDB")
pdf.bullet("You have an AI chatbot (Gemini) which they lacked -- this is a strong differentiator")
pdf.bullet("Your smart recommendation engine matches their 'no templates' originality claim")
pdf.bullet("Consider structuring your presentation similarly: page walkthrough, live demo, code tour, then unique features")

pdf.ln(6)
pdf.set_draw_color(30, 60, 120)
pdf.line(10, pdf.get_y(), 200, pdf.get_y())
pdf.ln(4)
pdf.set_font("Helvetica", "I", 10)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 6, "Generated February 2026 | ClarksvilleThreads FBLA Analysis", align="C")

output_path = "/home/user/ClarksvilleThreads/ClarksvilleThreads_FBLA_Analysis.pdf"
pdf.output(output_path)
print(f"PDF saved to: {output_path}")
