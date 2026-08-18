# ZyncJobs — Full Technical Architecture Documentation

> **Audience:** Senior Frontend / Full-Stack Architect review
> **Prepared:** 15 Aug 2026
> **Scope:** Frontend, Backend, AI services, Database, Security, Integrations, Deployment

---

## 1. Project Overview

ZyncJobs is a **dual-sided recruitment platform** connecting candidates and employers.

- **Candidates** — job search, resume builder/studio, resume parsing & ATS scoring, skill assessment & gap analysis, career roadmap/coach, salary insights, interviews, messages, AI-ranked job matches.
- **Employers / Recruiters** — job posting, bulk import, candidate search & ranking, application management, AI rejection assistant, analytics, and a full **Recruiter Analytics (ATS) dashboard**.
- **Admin** — user/company/application management, talent pool, verifications, AI monitoring, email control, activity logs.

The product is a **monorepo split into two repos**: `zyncjobs-Frontend` (React SPA) and `zyncjobs-backend` (Node.js API). AI/LLM intelligence runs in a **separate FastAPI service** (deployed independently).

---

## 2. Technology Stack

### Frontend — `zyncjobs-Frontend`
| Layer | Technology |
|---|---|
| UI | React 18.3, TypeScript 5.5 |
| Build | Vite 7 (esbuild, manual chunks, dev proxy) |
| Routing | React Router v7 (`BrowserRouter`, lazy-loaded routes) |
| State | React state + Zustand 5 (navigation, saved jobs, resume, site settings) |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`), IBM Plex Sans, custom glassmorphism system |
| Charts | Recharts 3 |
| PDF/Docs | `@react-pdf/renderer`, `jspdf`, `docx`, `html2canvas`, `jszip` |
| Parsing | `pdfjs-dist`, `pdf-parse`, `mammoth`, `tesseract.js` (OCR) |
| Real-time | Socket.io client |
| Drag/drop | `@dnd-kit` |
| Error tracking | Sentry (`@sentry/react`) |
| HTTP | Native `fetch` wrapped in a custom `apiFetch` layer |

### Backend — `zyncjobs-backend`
| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM), Express |
| ORM/DB | Sequelize + PostgreSQL (production) |
| Auth | `jsonwebtoken` (access + refresh JWT), `passport-google-oauth20`, `passport-oauth2` (LinkedIn), `bcryptjs` |
| Security | `helmet`, `express-rate-limit`, `express-validator`, `cors`, `express-session` |
| Real-time | Socket.io |
| Files | `multer` + AWS S3 (`aws-sdk`) + local disk fallback |
| Email | `nodemailer` (SMTP) |
| PDF | `pdfkit`, `sharp` |
| Cache | `ioredis` (Redis) + in-memory caches |
| Jobs/schedulers | Node cron (`node-cron`) for alerts, notifications, GDPR retention, reminders |

### AI Service (separate FastAPI service)
- Hosted at `AI_GATEWAY_URL` (default `http://localhost:8001`), port `8000` in some QA configs.
- Owns the LLM provider SDK (Mistral etc.). **Model names / Mistral API keys are NOT in the Node repo** — the Node repo is a thin authenticated client to this gateway.

---

## 3. System Architecture

```
                          ┌────────────────────────────────────────────┐
                          │                Client (React SPA)          │
                          │  React Router · Zustand · apiFetch wrapper │
                          └───────────────┬────────────────────────────┘
                                          │ HTTPS (JSON / Socket.io)
              ┌───────────────────────────┴────────────────────────────┐
              ▼                                                         ▼
   ┌──────────────────────────┐                       ┌──────────────────────────┐
   │  Node.js / Express API   │   /ai/execute (JWT)   │  FastAPI AI Service      │
   │  routes/ + middleware/   │ ───────────────────► │  LLM orchestration        │
   │  services/ + models/     │ ◄─────────────────── │  (Mistral SDK)            │
   └──────────────┬───────────┘                       └──────────────────────────┘
                  │ Sequelize
      ┌───────────▼───────────────────────────┐
      │          PostgreSQL (zyncjobs)        │
      │  jobs, users, applications, candidates,│
      │  ats, interviews, messages, analytics │
      └───────────┬───────────────────────────┘
                  │
   ┌──────────────┼──────────────┬─────────────────┬───────────────┐
   ▼              ▼              ▼                 ▼               ▼
 AWS S3        SMTP/nodemailer  Redis (cache)    Socket.io       Google/Meet
 resumes/files  emails          (scores, alerts)  realtime       Zoom, GST
```

**Data flow summary:** SPA → `apiFetch` (adds `Authorization: Bearer`) → Express route → Sequelize model → PostgreSQL. AI features route via `services/aiClient.js` → FastAPI gateway → LLM. Resumes/attachments go to S3 (or disk fallback). Email via SMTP. Realtime via Socket.io.

---

## 4. Frontend Architecture

### 4.1 Directory layout (`src/`)
- **`pages/`** — 73 page components (auth, candidate, employer, admin, public/marketing).
- **`components/`** — 89 shared components (Header, Footer, `AuthGuard`, `RoleGuard`, `TokenHandler`, `ErrorBoundary`, modals, chat).
- **`api/`** — `apiFetch.ts`, `enhancedApiFetch.ts`, domain modules (`auth.ts`, `account.ts`, `search.ts`, ...).
- **`config/`** — `env.ts` (primary), `constants.ts`, api re-exports.
- **`store/`** — Zustand slices.
- **`services/`** — AI clients, match engines, resume/S3/analytics services.
- **`utils/`** — 38 helpers incl. `tokenStorage.ts`, `userStorage.ts`, `rolePermissions.ts`.
- **`hooks/`**, **`lib/`**, **`styles/`** — custom hooks, helpers, CSS.

### 4.2 Routing
- `BrowserRouter` set up in `main.tsx`; **all routes defined centrally in `App.tsx`** (1,076 lines) inside one `<Routes>` block.
- Nearly every page is `React.lazy()` + `<Suspense>` → code-split on route boundaries (chunked).
- **Custom navigation abstraction:** `handleNavigation(page, params)` maps friendly page strings to `navigate()`, threaded to pages as `onNavigate`. Router is always the underlying mechanism.
- **Role-based guards:** `AuthGuard` (allowedRoles + userLoading spinner + redirect to role-correct login) and `RoleGuard` (feature-level `canAccess`/`hasPermission` via `utils/rolePermissions.ts`).
- Key routes: `/` (role-dispatch), `/dashboard` (admin→/admin/dashboard, employer→EmployerDashboard, candidate→CandidateDashboard), `/ats-dashboard`, `/job-detail`, `/job-listings`, `/application-management`, `/bulk-job-import`, `/resume-builder`, `/admin/dashboard`, `/candidate-search`, `/skill-assessment`, plus `*` → 404.

### 4.3 State management
- **No Redux, no auth Context.** Auth/user state lives in `App.tsx` via `useState`, passed via props (deliberate, avoids context re-render storms; documented trade-off).
- **Zustand** for global slices: `useNavigation`, `useSavedJobsStore` (optimistic + rollback), `useResumeStore` (persisted), `useSiteSettings`/`useHeroSection` (Strapi CMS).
- **Custom event bus** for cross-cutting events: `zync:logout`, `zync:account-locked`, `zync:alert`, `zync:user-updated`; `BroadcastChannel('zync:auth')` + `storage` events for cross-tab user sync.

### 4.4 Token handling — `apiFetch.ts` (the critical piece)
Tokens are stored via `utils/tokenStorage.ts`:
- Access + refresh mirrored to **both `localStorage` and `sessionStorage`**.
- Admin token lives **only in `sessionStorage`** (cleared on tab close).

`apiFetch(url, options)` behavior:
1. Reads access token, injects `Authorization: Bearer <accessToken>` if not already set.
2. **URL safety guard** `resolveSafeUrl()` — blocks any URL outside the configured API base (prevents SSRF/open-redirect misuse).
3. On **non-401** → returns response as-is.
4. On **401**:
   - If no refresh is in flight → calls `refreshAccessToken()` (`POST {base}/users/refresh` with `credentials:'include'`, body carries refresh token; the new refresh also arrives via httpOnly cookie).
   - **Concurrency/race handling:** a module-level `isRefreshing` boolean + `refreshQueue` promise array. Concurrent 401s wait for the single in-flight refresh, then re-attach the new token and **replay the original request** (`onRefreshed`).
   - On success → stores new access token, retries once with the new token.
   - On failure → clears all tokens and dispatches `zync:logout`.
5. `enhancedApiFetch.ts` is a secondary wrapper adding **5xx retry (3× exponential backoff)** and refresh only when body `code === 'TOKEN_EXPIRED'`.

**401 → forced logout** is handled in `App.tsx`: resolves the role from `pendingLogoutRole` → `lastUserType` → stored user → JWT payload, clears storage, navigates to the role-appropriate login.

### 4.5 Session restore on reload
`App.tsx` `restoreSession()`:
1. Cleans base64 images from stored user.
2. If no access token, tries `/users/refresh` with stored refresh token.
3. `accountAPI.getMe()` (in `api/account.ts`): decodes JWT, checks `exp`, calls `GET /api/users/:id`, **validates the returned user id matches the JWT** (anti session-leak), rejects deleted/suspended accounts, reconciles user data, and resolves dual-role accounts (admin + company → employer view). A `loginTimestamp` ref skips overwrite if login just happened (<5 s).

### 4.6 Google / LinkedIn sign-in (frontend)
- **No client-side Google SDK.** It is a **server-side redirect (OAuth2 authorization-code)** flow:
  1. Button sets `window.location.href = <backend>/api/auth/google/candidate?portal=candidate` (also `/employer`, and `/linkedin/candidate`).
  2. Backend completes OAuth with Google, then **redirects back** to the SPA with `?token=...&refreshToken=...&portal=...&accountRole=...&isNewUser=...`.
  3. `App.tsx` detects `?token` in the URL → renders **`TokenHandler`** → stores tokens, decodes JWT, fetches user, detects **portal/role mismatch** (deletes accidental wrong-portal accounts), then logs in and routes new employers without a company to `/employer-complete-profile`, else `/dashboard`.

### 4.7 Styling / design system
- Tailwind v4 via Vite plugin; `IBM Plex Sans`; custom `primary`/`accent` palette, keyframes (fade, gradient, float, glow, shimmer), glow shadows.
- Reusable `@layer components` classes: `.glass-card`, `.gradient-border`, `.gradient-text`, `.shimmer-effect`, `.btn-glow`, `.neon-border`, `.card-hover`.
- Analytics-heavy pages (ATS dashboard, employer/candidate dashboards) use **inline `style` objects** with a consistent **"dark-blue gradient + frosted glass + glow"** design language.
- Responsive CSS layers: `mobile.css`, `mobile-fixes.css`, `responsive-fixes.css`, `accessibility.css` (with `prefers-reduced-motion` support).

### 4.8 Performance / build
- Vite manual chunks: `vendor-react`, `vendor-socket`, `vendor-lucide`, `vendor-charts` (recharts), `vendor-pdf`, `vendor-office`.
- `esbuild` minifier; **`console`/`debugger` dropped in production** (kept in QA).
- QA build outputs to `zync-site/`, prod to `dist/`.
- **No test script** wired (a `src/test/` dir exists; testing is an improvement area).
- Dev proxy: `/api` → `http://localhost:5000`; `/recruitment-ai` → `http://localhost:8001` (path rewritten); `/uploads` and `/socket.io` (ws).

---

## 5. Authentication & Security

### 5.1 JWT strategy
- **Access token:** `jwt.sign({ userId, type:'access' }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN || '1h' })`.
- **Refresh token:** signed with `JWT_REFRESH_SECRET`, payload `{ userId, type:'refresh', tokenId: Date.now() }`, expiry `JWT_REFRESH_EXPIRES_IN || '7d'`.
- `authenticateToken` middleware (`middleware/auth.js`): reads `Bearer`, verifies, **rejects if token `type` isn't `access`** (prevents using a refresh token as an access token), loads the full user row from DB (fresh `isActive` check → `401 ACCOUNT_INACTIVE`), sets `req.user`. Errors mapped: expired → `TOKEN_EXPIRED`, invalid → `TOKEN_INVALID`, missing → `NO_TOKEN`.

### 5.2 Refresh flow
- **`POST /api/users/refresh`** (used by `apiFetch`): verifies refresh token, reloads user, issues new access + new refresh; new refresh is set as an **httpOnly `refreshToken` cookie** (`secure` in prod, `sameSite:strict`, 7d) and access returned in JSON.
- **`POST /api/token/refresh`** (used by `enhancedApiFetch`): same, but returns **both** tokens in the JSON body (client persists refresh to storage).
- **Note (improvement):** two refresh endpoints with slightly different token delivery; recommended to consolidate.

### 5.3 Refresh-token delivery — defense in depth
- Refresh token is delivered **both** as an httpOnly cookie and (for some flows) in the JSON body / OAuth redirect URL so the SPA can mirror it to `localStorage`. In production the **httpOnly cookie** is the safer channel; the mirrored copy supports cross-tab/restart sessions.

### 5.4 RBAC
- `middleware/roleAuth.js`: role hierarchy `super_admin > admin > manager > employer > candidate`; `requireRole`, `requireAdmin`, `requireSuperAdmin` (with hard-coded admin emails), `requirePermission` (feature permissions map), `requireTeamRole` (ATS team members).
- `middleware/adminAuth.js`: admin/super-admin gate + admin audit logging.

### 5.5 Credential security & anti-abuse
- **bcrypt** password hashing (rounds 8 on register; 10 on reset/change).
- **Account lockout:** `failedLoginAttempts`, `accountLockedUntil` on User; threshold `LOGIN_ATTEMPT_LIMIT` (5), lockout `LOCKOUT_DURATION_MINUTES` (15) → `423 Locked`; resets on success.
- **Rate limiting:** global limiter (500 req/min prod), dedicated `loginLimiter` on `/api/users/login` + `/api/users/register` (20 per 15-min prod).
- **Password policy:** `lastPasswordChange`, `passwordExpiryDays` (90 for admins), `mustChangePassword`, `passwordHistory` (last 5) — enforced at login.
- **Password reset:** crypto-random 32-byte token in `PasswordReset` table, **1-hour expiry, single-use**, invalidated on re-issue.

### 5.6 Transport & input security
- **helmet** with custom CSP (frame-ancestors, img-src), `crossOriginResourcePolicy: cross-origin`.
- **CORS** allow-list: `zyncjobs.com`, `qa.zyncjobs.com`, `trinitetech.com`, localhost dev ports; `credentials: true`; methods `GET,POST,PUT,DELETE,PATCH,OPTIONS`.
- **`express-validator`** on auth inputs (email, password min 6); **`sanitizeInput`** global middleware strips `<script>`, `javascript:`, and `$`-prefixed keys (NoSQL-injection guard).
- **SQL injection** mitigated via Sequelize parameterized ORM.
- **Body limit** 20 MB; **multer** file restrictions (resume ≤10 MB, `.pdf/.doc/.docx/.rtf` only; photos ≤10 MB).
- Secrets in **env files** (`.env`, `.env.production`, `.env.qa`); `utils/envValidator.js` fails fast if `DATABASE_URL`, `JWT_SECRET` (≥32 chars), `SMTP_EMAIL`, `SMTP_PASSWORD` missing.
- Frontend **`resolveSafeUrl()`** blocks out-of-origin API URLs (SSRF/open-redirect guard).

### 5.7 OAuth providers
- **Google** (`passport-google-oauth20`): find-or-create by `googleId`/email; new users get `emailVerified:true`, `password` set to a non-bcrypt placeholder (`google-oauth-<id>`) — they can never log in with that password (safe), plus employer company verification on first OAuth.
- **LinkedIn** (`passport-oauth2`): same find-or-create pattern, fetches `/v2/userinfo`.
- **Google Meet / Calendar** OAuth is a **separate** flow (service-account env vars) for interview scheduling — not a login provider.

### 5.8 Known improvement areas (for review discussion)
- ✅ **Implemented:** Refresh-token server-side revocation — new `refresh_sessions` table stores a SHA-256 hash of each refresh token; logout/revoke invalidates it server-side, refresh validates the session (with a 60 s rotation grace window for concurrent tabs), rotation soft-expires the old token. Refresh token no longer persisted to `localStorage` (sessionStorage + httpOnly cookie only); `apiFetch`/session-restore refresh via the httpOnly cookie even without a stored token.
- Two competing fetch wrappers & two refresh endpoints → consolidate to one.
- OAuth placeholder passwords stored un-hashed (low risk — non-login); Google Meet OAuth tokens stored plaintext → consider encryption at rest.
- Access token in `localStorage` is XSS-accessible → full move to in-memory + httpOnly-cookie auth is a further hardening option.

---

## 6. Backend Architecture

### 6.1 Server bootstrap (`server.js`)
Middleware order: `cors` → `trust proxy` → `helmet` → `express-session` → `passport` → rate limiters → `cookieParser` → `express.json(20mb)` → `sanitizeInput` → dev logger → static/downloads → `maintenanceGuard`.

Route groups mounted (each `/<path>` under `/api`): jobs, auth, token, users, applications, job-alerts, upload, moderation, analytics(+tracking), admin/*, companies, ai-suggestions/ai/ai-flow/ai-proxy, employer, **ats**, resume*, notifications, messages, profile, search*, interviews, meetings, team, team-auth, credentialing, gdpr, contact, verify, candidate, dashboard. Socket.io configured for realtime notifications.

Error handling: centralized `errorHandler` (Sequelize/JWT/upload-aware; stack trace only in dev).

### 6.2 Core route modules
| Module | Responsibility |
|---|---|
| `routes/jobs.js` | Job CRUD, `/employer/email/:email` (company-wide jobs), `/jobs` public listing, bulk, refresh |
| `routes/applications.js` | Application lifecycle, AI scores, auto-rejection hook |
| `routes/auth.js` / `users.js` | Register/login/logout, token refresh, profile, security fields |
| `routes/ats.js` | Recruiter Analytics: dashboard, pipeline, activity, team, SLA, audit, performance, notes, assignments |
| `routes/ai*.js` | Chat, scoring flow, rejection settings, suggestions, resume score/parser |
| `routes/search.js` / `advancedSearch.js` | Job/candidate search, locations, filters |
| `routes/admin*.js` | Users, applications, bulk, verifications, AI monitoring, settings, email control |
| `routes/upload.js` | S3/disk upload, file-type & size enforcement |
| `routes/interviews.js` / `meetings.js` | Interview scheduling, Google Meet/Zoom |
| `routes/team.js` / `teamAuth.js` | Team members, OTP login |
| `routes/gdpr.js` | Data export, consent, retention |

---

## 7. Database Design (PostgreSQL + Sequelize)

~33 models. Core schema:

### 7.1 Users & roles
**`User`** — `id` (UUID), email (unique), password (bcrypt), `role`/`userType` (`candidate | employer | admin | super_admin | manager`), `isActive`, `emailVerified`, `googleId`, `linkedinId`, security fields (`failedLoginAttempts`, `accountLockedUntil`, `passwordHistory`, `lastPasswordChange`), plus Google Meet token columns.

### 7.2 Jobs — **`Job`**
- `id` (UUID), `employerId`, **`positionId` (unique)**, `jobTitle`, `company`, `location`, `jobType` (ENUM: `Full-time, Part-time, Contract, Freelance, Internship, Temporary`), `workSetting` (`Remote, Hybrid, On-site`), `description`, `requirements`, `skills[]`, `salaryMin/Max`, `currency`, `payRate`, `experienceLevel` (`Entry, Mid, Senior, Lead`), `employerEmail`, `postedBy`, `assignedTo` (recruiter), `companyId` (FK), `applicationDeadline`, **`isActive`** (soft-delete flag), `status` (`active/hold/closed`), `slug` (unique), `views`, `applicationsCount`, `refreshCount`, `lastRefreshedAt`.
- Indexed on jobTitle, company, location, jobType, employerEmail, isActive, status, employerId, positionId (unique), createdAt, slug, companyId.

### 7.3 Applications — **`Application`**
- `jobId` (UUID FK), `candidateId`, `employerId`, `candidateEmail`, `candidateName`, `status` (ENUM: `pending, applied, reviewed, shortlisted, interviewed, rejected, hired, withdrawn`), `coverLetter`, `resumeUrl`, **`aiScore`, `aiAnalysis` (JSONB), `aiSuggestion`** (`reject`), `employerConfirmedRejection`.

### 7.4 ATS module tables
- **`CandidateAssignment`** — candidate ↔ job ↔ recruiter assignment, `pipelineStage` ENUM (`Applied, Screening, Shortlisted, Interview 1, Interview 2, Selected, Offer, Joined, Rejected`).
- **`CandidateNote`** — recruiter follow-up notes (type ENUM: call/email/interview/note/status_change/offer).
- **`RecruiterActivityLog`** — full audit trail (user, action, module, entity, IP, timestamp).
- **`TeamMember`** — employer team (role, permissions, employerId).

### 7.5 Other notable tables
`Company`/`CompanyProfile` (verification), `Resume`/`ResumeVersion`, `Interview`, `Message`, `Notification`, `JobAlert`/`JobAlertNotification`, `SavedCandidate`, `SavedRecommendedJob`, `TalentCandidate`, `Credentialing`, `SkillAssessment`, `CareerRoadmap`, `Review`, `Analytics`, `HeadlineAnalytics`, `SearchAnalytics`, `PasswordReset`, `EmailLog`, `GdprConsent`, `DeletedUser`, `AuditLog`, `UserPreferences`, `Profile`.

**Migrations:** targeted `Model.sync({alter:true})` + raw-SQL index creation + named migration scripts run at boot (e.g. enhanced company fields, team invitation columns, job-type enum, ATS model sync). No full migration framework — uses sync + idempotent scripts.

---

## 8. AI / ML Services

### 8.1 Architecture — AI gateway (key point)
The **Node backend does not call an LLM directly.** All LLM work goes through `services/aiClient.js` → **FastAPI AI service** (`{AI_GATEWAY_URL}/ai/execute`) authenticated with a short-lived service JWT (`AI_JWT_SECRET`). A verbatim reverse proxy (`routes/aiProxy.js`) forwards `/api/ai-proxy/*` to the gateway. **Mistral model names/keys live only in the FastAPI service.**

### 8.2 Feature inventory (input → output)
| Feature | Implementation | Fallback |
|---|---|---|
| **Resume parsing** (`resumeParserAI.js`) | regex pre-extract → AI JSON → validation | full regex/rule parser + 1 h in-memory cache (SHA-256 key) |
| **Candidate ranking / AI scoring** (`utils/aiScoring.js`) | hybrid `round(rule*0.5 + ai*0.5)` | rule-based only on AI failure |
| **AI rejection assistant** (`aiRejectionSettings.js`) | AI *suggests* `reject` only; status unchanged until employer confirms | rule-based 60/40 skill/experience |
| **Job Description / JD optimization** | `aiClient.generateJD` + ZyncJobs apply-CTA injection | canned/template |
| **Resume builder content** | `aiClient.suggest` JSON prompts | rule-based JSON fallbacks |
| **Chat assistant** (`routes/ai.js`) | chat + SSE stream | keyword canned responses |
| **Recommendations** (`recommendationService.js`) | **TF-IDF + cosine similarity** in SQL (`vectorService.js`, `job_embeddings`/`resume_embeddings`) — NOT an LLM | score-based |

### 8.3 Prompt & reliability patterns
- **JSON-only output mode** ("Return ONLY valid JSON") with regex `/{[\s\S]*}/` extraction before `JSON.parse`; number-only mode for scores.
- **Fallback-first design:** every AI path has a deterministic fallback (rule/regex/canned) so the product never hard-fails on LLM outage.
- **Caching:** resume parse (1 h in-memory), resume score feedback (Redis 1 h), AI gateway service token (cached 10 min before expiry).
- **Non-AI intelligence:** recommendations and salary insights are deterministic (TF-IDF cosine similarity; DB averages) — fast and explainable.

---

## 9. Integrations & Services

| Service | Provider / Mechanism |
|---|---|
| Object storage | **AWS S3** (`S3_BUCKET`, `ap-south-1`) for resumes, talent resumes, job banners; local disk fallback for photos |
| Email | **nodemailer** SMTP (`SMTP_SERVER/EMAIL/PASSWORD/FROM_EMAIL`); templates with CTA/info boxes; OTP service (10-min, 5 attempts, 3 resends, 60 s cooldown) |
| Realtime | **Socket.io** — `notification_update:<userId>` |
| Scheduling | `node-cron`: job alerts, notifications, reminders, GDPR retention, job refresh |
| Calendar/Video | **Google Meet / Google Calendar** (service account), **Zoom** |
| Company verification | **GST via SUREPASS** (`SUREPASS_TOKEN`), Clearbit for enrichment |
| CMS (site settings/nav) | **Strapi** (`VITE_STRAPI_URL`) with fallbacks |
| Error tracking | **Sentry** (frontend + backend `@sentry/node`) |
| Cache | **Redis** (`ioredis`) + in-memory caches |

---

## 10. Environments & Deployment

| Env | Frontend `VITE_API_URL` | Backend | Notes |
|---|---|---|---|
| **Dev** | `/api` (Vite proxy → `localhost:5000`) | `localhost:5000` | AI proxy → `localhost:8001` |
| **QA** | `https://qaapi.zyncjobs.com/api` | qa host | `build:qa` → `zync-site/` |
| **Production** | `https://api.zyncjobs.com/api` | api host | `build` → `dist/` |

- Scripts: `dev`, `build`, `build:qa`, `preview`, `lint`, `start:all` (concurrently runs backend + frontend), `deploy:qa`, `deploy:prod`.
- **Env-var NAMES** used by backend (names only): `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `DATABASE_URL`/`DB_*`, `PORT`, `NODE_ENV`, `FRONTEND_URL`, `BACKEND_URL`, `AI_GATEWAY_URL`, `AI_JWT_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `LINKEDIN_CLIENT_ID/SECRET`, `GOOGLE_MEET_*`, `ZOOM_*`, `SMTP_*`, `S3_BUCKET`, `AWS_REGION`, `REDIS_URL`, `SESSION_SECRET`, `LOGIN_ATTEMPT_LIMIT`, `LOCKOUT_DURATION_MINUTES`, `RATE_LIMIT_*`, `SUREPASS_TOKEN`, `CLEARBIT_API_KEY`, `LOAD_SAMPLE_DATA`.

---

## 11. Scalability & Reliability Practices
- **Frontend:** lazy route code-splitting, vendor chunking, minification, conservative bundle sizing (manual chunks), responsive/accessibility layers.
- **API:** stateless JWT (horizontal scaling friendly), centralized error handler, rate limiting, idempotent migrations at boot.
- **Resilience:** AI always has a deterministic fallback; fetch layer auto-refreshes tokens and retries (5xx backoff in `enhancedApiFetch`); optimistic UI with rollback for saved jobs.
- **Realtime:** Socket.io for notifications; scheduled jobs for alerts/reminders/GDPR.
- **Data safety:** soft-delete for jobs (`isActive`); single-use reset tokens; account lockout.

---

## 12. Likely Interview Questions & Short Answers (prep)

**Q: How does token refresh work?**
A: Access JWT (1 h) + refresh JWT (7 d, separate secret). `apiFetch` adds `Bearer`; on 401 it calls `/users/refresh`, gets a new access token, replays the original request. Concurrent 401s are queued behind a single in-flight refresh (`isRefreshing` + `refreshQueue`) to avoid stampede. Refresh token is delivered via httpOnly cookie + mirrored to sessionStorage. **Server-side revocation:** each refresh token is stored (SHA-256 hashed) in a `refresh_sessions` table; logout/revoke invalidates it, refresh validates the session, rotation soft-expires the old token with a 60 s grace window so concurrent tabs don't get logged out. On failure we clear storage and force a role-correct logout.

**Q: How does Google "Continue with Google" work?**
A: No client SDK. Button redirects to backend `/api/auth/google/candidate?portal=candidate`; Passport OAuth2 exchanges the code, find-or-creates the user, issues access+refresh JWTs, sets httpOnly cookie, then redirects back to the SPA with `?token&refreshToken&portal`. `TokenHandler` stores them, fetches the user, guards portal/role mismatches, and routes appropriately.

**Q: What's the security model?**
A: bcrypt hashing, JWT with separate refresh secret + type check, RBAC (`requireRole`/`requirePermission`), rate limiting + account lockout (5 tries/15 min), helmet + allow-listed CORS, input validation + sanitization, Sequelize parameterization (SQLi-safe), multer type/size limits, env-based secrets with fail-fast validation.

**Q: How is the frontend structured?**
A: React 18 + TS, React Router v7 with lazy routes, Zustand for global state, auth held in `App.tsx` (prop-driven), `apiFetch` as the single auth-aware HTTP layer, Tailwind v4 design system, Recharts for analytics, custom PDF (react-pdf/jspdf) and parsing (pdfjs/mammoth/tesseract).

**Q: How are AI features built?**
A: LLM work is isolated in a FastAPI AI service; Node calls it via an authed `aiClient` gateway (no Mistral key in the Node repo). Every feature has a deterministic fallback (regex/rule/canned) and JSON-only prompts with extraction + caching, so the platform never hard-fails on LLM outage. Recommendations use TF-IDF + cosine similarity (explainable, no cost).

**Q: What DB / how are models managed?**
A: PostgreSQL via Sequelize. ~33 models. Enums for job type, application status, pipeline stage. Soft-delete via `isActive`. Schema changes via `sync({alter})` + idempotent boot migrations (improvement: migrate to real migration tool).

**Q: Any known weaknesses?**
A: (be honest) refresh-token server-side revocation is not enforced yet; two fetch wrappers/two refresh endpoints could be consolidated; large page files (CandidateDashboard ~7k lines) could be refactored; no automated test script wired.

---

*End of document.*