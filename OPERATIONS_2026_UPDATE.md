# Periyar Taxi — Driver, Fleet, Fares & Payroll update (Nov 2026)

## Updated behavior

- Driver onboarding: monthly/weekly/daily salary; overtime rate (₹/hour), selected languages, unlimited emergency contacts, signed Periyar Taxi agreement (required before verification), acting-driver vehicle capabilities, admin availability and monthly service marks. Historical per-trip/hourly database enum values are retained to prevent data loss but cannot be newly selected.
- Fleet: Tempo Traveller, Coach Van, Mini Bus, Bus and Urbania categories, alongside existing types. Attached-owner agreement remains supported and required for approval.
- Pricing: each branch/service has a default `ALL` category plus category-specific overrides. Driver-for-Rent uses customer transmission/class (MANUAL/AUTOMATIC/LUXURY), not company fleet category. Outstation has short and long bands with independent km/hour rates. Local package entries are editable and can be **deactivated** rather than physically deleted to preserve historical bookings.
- Booking: Driver-for-Rent requires customer vehicle category, brand and model; the vehicle fields are stored with the ride. Dispatch matches acting-driver capabilities.
- Staff: access-controlled, private staff document uploads/downloads; attendance includes optional clock-in and clock-out times. Payroll adds weekly periods (`YYYY-Www`), overtime separate from incentives, payment method/reference/remarks, detailed history. Monthly marks are operator-rated 0–5 by category and display supporting trip/review statistics; they are not automatically awarded.

## Installation — backend

1. Back up your existing source files and MySQL database first.
2. Stop the running Node app. Unzip the backend update **in the backend project root** (`unzip -o ...`).
3. Run `npm run db:migrate-operations` exactly against the intended DB connection; this is additive and does not seed/reset data.
4. Run `npm test`, `npm run check`, then restart the app (`npm run dev` locally or Restart App in Plesk).
5. Existing driver employment agreements can be uploaded through driver document management. A missing signed agreement prevents future verification approval.

## Installation — frontend

1. Back up frontend files. Unzip the frontend update **in the frontend project root**.
2. Run `npm run check` and `npm run dev` locally. For Vercel, deploy/rebuild as usual.
3. Visit Driver Creation/Review, Vehicles, Fare & Packages, Create Booking, Staff & Access / Documents, Attendance and Payroll.

## Limitations

- The migration has not been executed against your live MySQL server in this environment. Back up data first; keep existing data/legacy salary values.
- No new npm dependencies added. `node_modules`, lock files and private `.env` files are not included.
- Staff document access requires `users.manage` for admins or Super Admin; uploads stored in private server filesystem. Keep uploads in durable storage on Plesk.
- Manual monthly service marks and overtime must be reviewed by authorized staff. Agreements require actual signed files, not a generated legal contract.
