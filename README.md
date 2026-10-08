# Ajeet Digital Services

One MERN application for a local business with two divisions:

- **Shop** (`/shop`) - printing, documentation and digital services. Customers register, submit service requests with documents, and track status.
- **Catering** (`/catering`) - public equipment portfolio, plus admin rental/inventory management.
- **Admin** (`/admin`) - one admin area for both divisions.

Business: Ajeet Digital Services, Front of Tons Food Park, Nanda Ki Chowki, Sudhowala, Dehradun, Uttarakhand - 248007. There is **no online payment**; the data model leaves room to add it later (`ServiceRequest.payment`).

## Tech stack
React 18 + Vite + React Router + Tailwind CSS 3 + Axios + React Hook Form + lucide-react (JavaScript) ·
Node 18+, Express 4, MongoDB/Mongoose, JWT, bcryptjs, Multer, Nodemailer, Zod, helmet, cors, express-rate-limit, Cloudinary (optional local fallback) · Jest + Supertest + mongodb-memory-server.

## Architecture
```
Frontend: components -> pages -> services (Axios API layer) -> backend
Backend : routes -> controllers -> services -> models   (validators + middleware alongside)
```
- Business rules live in the backend only (status transitions, inventory, overdue logic, ID generation).
- Role is always read from the database user, never from the client or the token.
- File storage is pluggable: `backend/src/services/storage/` (`cloudinaryProvider`, `localProvider`). Add a provider with `{ name, upload, read, remove }` and select it in `storage/index.js`. Files are never stored in MongoDB; Cloudinary files are uploaded as `authenticated` and are streamed to the owner/admin through `GET /api/uploads/:id/download` (storage URLs/credentials are never sent to clients).
- Auth token is kept in `localStorage` but isolated in `frontend/src/utils/tokenStorage.js` + `services/api.js`, so migrating to httpOnly cookies later touches only those files plus the backend login response.

## Folder structure
```
backend/src/{config,controllers,middleware,models,routes,services,services/storage,utils,validators}, app.js, server.js, seed.js
backend/tests/            Jest + Supertest
frontend/src/{components,pages,layouts,hooks,context,services,utils}, App.jsx, main.jsx
```

## Environment variables
Copy `backend/.env.example` to `backend/.env` and fill it in (never commit `.env`).

| Variable | Purpose |
|---|---|
| `MONGO_URI`, `JWT_SECRET` | **Required.** Use a 32+ char random secret in production |
| `PORT`, `CLIENT_URL`, `TZ` | Server port, allowed frontend origin(s) (comma separated), timezone (default Asia/Kolkata; rental due-dates are day-based) |
| `STORAGE_PROVIDER`, `CLOUDINARY_*` | `cloudinary` or `local`. Defaults to Cloudinary when its 3 variables are set |
| `MAX_FILE_SIZE_MB`, `MAX_FILES_PER_REQUEST` | Upload limits (10 MB, 5 files) |
| `EMAIL_HOST/PORT/USER/PASSWORD/FROM` | Optional. If unset, email is skipped silently |
| `SHOP_WHATSAPP_NUMBER`, `SHOP_PHONE_1/2`, `SHOP_EMAIL` | Contact details served to the frontend |
| `SEED_ADMIN_*` | Seed admin credentials (dev defaults: `admin@ajeetdigital.local` / `Admin@12345`) |

Frontend: `frontend/.env.example` -> `VITE_API_URL` (empty in dev; Vite proxies `/api` to `localhost:5000`).

## Local setup
Requirements: Node 18+, MongoDB (local `mongod` or a free MongoDB Atlas cluster).
```bash
npm run install:all                 # root + backend + frontend
cp backend/.env.example backend/.env   # then set MONGO_URI and JWT_SECRET
npm run seed                        # admin account, 13 services, 4 equipment types
npm run dev                         # API on :5000, web on :5173
```
Open http://localhost:5173 . Admin login: http://localhost:5173/admin/login (seeded credentials; **change the password** / set your own `SEED_ADMIN_*` before deploying).

Scripts: `npm run dev | build | start | seed | test` (root), same names inside `backend/` and `frontend/`.

### MongoDB
- Local: install MongoDB Community and use `mongodb://127.0.0.1:27017/ajeet_digital_services`.
- Atlas: create a free cluster, add a DB user, allow your IP, paste the SRV connection string into `MONGO_URI`.

### File uploads
Without Cloudinary credentials the app stores uploads in `backend/uploads/` (development only; not persistent on most hosts). For production create a Cloudinary account and set the three `CLOUDINARY_*` variables. Allowed: PDF, JPG, JPEG, PNG, DOC, DOCX; extension, MIME type and file signature (magic bytes) are all checked.

## Tests
`npm run test` (backend). `tests/unit.test.js` needs no database. The other suites use `mongodb-memory-server`, which downloads a MongoDB binary on first run (needs internet access), or set `MONGOMS_SYSTEM_BINARY` to a local `mongod`.
They cover registration, login, 401/403 access control, customer data isolation, service requests, file validation, status transitions, equipment, rentals, inventory limits, returns and overdue logic.

## API overview
All responses: `{ success, message, data }` or `{ success:false, message, errors:[] }`.
- Auth: `POST /api/auth/register | login | admin/login | logout`, `GET /api/auth/me`
- Services: `GET /api/services`, `GET /api/services/:id`; admin: `POST`, `PUT /:id`, `PATCH /:id/active`, `DELETE /:id` (soft-disables when requests reference it)
- Requests: `POST /api/requests` (multipart: fields + `files`), `GET /api/requests` (own, or all+filters for admin), `GET /api/requests/stats`, `GET /api/requests/:id`, `PATCH /api/requests/:id/status` (admin)
- Files: `GET /api/uploads/:id/download` (owner or admin)
- Admin: `GET /api/admin/dashboard | customers | customers/:id`
- Catering public: `GET /api/catering/public/equipment`
- Catering admin: `/api/catering/dashboard | clients | reports | equipment[/:id] | rentals[/:id]`, `PATCH /rentals/:id/return | cancel`
- Misc: `GET /api/config/business`, `GET /api/health`

Request status flow: pending -> accepted/rejected; accepted -> in_progress/ready/completed/rejected; in_progress -> ready/completed/rejected; ready -> completed. Rental status (`active/due/overdue/returned/cancelled`) is computed by the backend from dates; a rental is overdue the day after its due date if not returned. Availability = total quantity minus quantity in open (not returned/cancelled) rentals.

## Deployment
- **Database:** MongoDB Atlas.
- **Backend:** Render/Railway/Fly/VPS (Node 18+). Build: `npm install`; start: `npm start`; or use `backend/Dockerfile`. Set `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your frontend origin), `CLOUDINARY_*`, optional `EMAIL_*`. Run `npm run seed` once with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` set.
- **Frontend:** Vercel/Netlify. Root `frontend`, build `npm run build`, output `dist`, env `VITE_API_URL=https://<your-api>/api`. `frontend/vercel.json` provides SPA rewrites (on Netlify add `/* /index.html 200` in `_redirects`).
- Serve both over HTTPS.

## Security notes
helmet, CORS allow-list, rate limiting (stricter on auth), Zod validation on every write, Mongoose schema validation, bcrypt-hashed passwords (never returned), JWT verified and the user re-loaded from DB on each request, `authenticate` / `requireAdmin` middleware, customers get 404 for other people's requests/files, query-string values are coerced to primitives (no operator injection), upload type/size/signature checks, no stack traces in production, secrets only in `.env`.
Known limitations: JWT logout is client-side only (no server revocation); inventory locking is in-process (single API instance) - use transactions if you scale horizontally; there are no password-reset emails yet.
