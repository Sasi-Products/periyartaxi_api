# Periyar Taxi backend

## Stack
Node 22.16+ (Node 24 recommended), Express 4, MySQL 8, Sequelize v6, JWT, bcrypt, Razorpay, MSG91 Flow SMS, Firebase Admin SDK and Socket.IO.

## ES6 module upgrade

All backend JavaScript now uses native ES modules (`import`/`export`), with `"type": "module"` and `.js`-suffixed imports. The `.env` file is loaded using the built-in Node 24 `loadEnvFile()` API, so **dotenv is no longer required**. See `ESM_SETUP.md`.

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env: MySQL credentials, JWT_SECRET (32+ chars), SUPER_ADMIN_PASSWORD (12+ chars)
npm install
npm run check
npm test
npm run db:init
npm run db:seed
npm run dev
```

Create a MySQL database named `periyar_taxi` first. Run `npm test` to check pricing examples; `npm run check` validates backend ESM syntax and local imports. `db:init` uses Sequelize `sync()` for an **empty development database only**. Do not run automatic sync or destructive schema changes on production data without reviewed migrations and backups. `db:seed` creates one Erode branch, initial pricing examples, initial local packages, and the Super Admin account specified in `.env`.

Main entry point `server.js`; Express app `src/index.js`; DB at `src/config/dbConfig.js`; Sequelize model classes under `src/models/` and registered by `src/models/index.js`; separate controllers and matching route files under `src/controllers` and `src/routes`.

## Main API endpoints

| Path | Purpose |
|---|---|
| POST `/api/auth/login` | Username/password for staff and drivers |
| POST `/api/auth/otp/request`, `/api/auth/otp/verify` | SMS OTP customer login |
| GET `/api/auth/me` | Verify role/session |
| `/api/users` | Create staff/drivers, manage accounts and privileges |
| `/api/branches` | Branch and polygon boundaries |
| `/api/pricing`, `/api/pricing/packages` | Dynamic fares/packages per branch |
| `/api/vehicles` | Cars, documents and verification |
| `/api/drivers` | Driver onboarding and verification |
| `/api/assignments` | Multi-day driver/car assignments |
| `/api/locations/me`, `/api/drivers/live` | Duty location updates and oversight |
| POST `/api/trips/quote` | Route-based estimate via Google Routes API |
| `/api/trips` | Booking, offers, dispatch, arrival, OTP start, finish, cancellation, approved charges |
| `/api/payments` | Cash and Razorpay order/verification |
| POST `/api/payments/webhook` | Public Razorpay webhook; HMAC checked |
| `/api/attendance` | Staff attendance and driver shifts |
| `/api/payroll` | Salary draft, automatic calculation, approval, paid stage |
| `/api/expenses` | Expense tracking |
| `/api/analytics`, `/api/analytics/details` | Operational/financial and per-entity analytics |
| `/api/notifications`, `/api/places`, `/api/reviews`, `/api/audit` | Push notifications, favorites, review, audit |
| `/api/uploads` | Authenticated documents up to 5 MB |

## Critical provider settings

- Google: `GOOGLE_MAPS_SERVER_KEY` restricted to **Routes API**, from a billing-enabled Google Cloud project. The separate browser API key is in frontend `.env`. The polygon editor does not use retired DrawingManager.
- SMS: configure `MSG91_AUTH_KEY`, `MSG91_FLOW_ID` and `MSG91_SENDER_ID` to correspond to the approved DLT Flow variable (`OTP` is used by the included adapter). Development-only console OTP logs require `OTP_DEV_MODE=true` and `NODE_ENV!=production`.
- Razorpay: set key ID, key secret and webhook secret. Webhook URL: `https://YOUR_API_DOMAIN/api/payments/webhook`. Select relevant captured-payment events.
- Firebase: `FIREBASE_SERVICE_ACCOUNT_PATH` points to private Firebase service-account JSON **outside public web directory**.
- CORS: `CORS_ORIGINS` comma-delimited permitted frontend HTTPS origins.
- Never commit `.env`, customer IDs/documents, admin passwords, production provider credentials or upload storage.

## Workflow to demo

1. Bootstrap Super Admin and Erode branch; log in at frontend.
2. Create branch boundary polygon, validate fare rules; configure valet before quoting.
3. Create admin with permissions; create driver with temporary password.
4. Driver logs in, uploads license/Aadhaar/photo, submits verification; admin approves.
5. Admin creates vehicle, uploads six photos/four documents and approves it.
6. Admin assigns the driver and vehicle for 3 days; driver clocks in and makes self available.
7. Customer OTP login, selects pickup/drop/vehicle, sees Google-derived quote and confirms.
8. Driver receives offer and accepts; customer shares 4-digit start OTP; driver starts, ends, adds optional charge.
9. Admin reviews pending charges; driver collects cash or customer completes Razorpay; finance reports update.
10. Review salary, attendance, earnings, expenses, detailed analytics and audit events.

## Operational cautions

This is a single-process dispatch MVP with a periodic in-process worker (15s). Scaling out needs idempotent jobs and transactional driver reservations. SMS transport and FCM need provider validation. `uploads/` is intentionally outside the served public frontend; protect backups, file access, and retention. Personal data must have retention/consent controls before production. Keep API endpoints behind HTTPS. Review public cancellation policy, refund design, payout reconciliation, privacy rules and local commercial transport rules before launch.
# periyartaxi_api
