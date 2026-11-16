# Periyar Taxi — Importable demo database and media

**Purpose:** populate your *existing* Periyar Taxi MySQL development database with fictional sample records from **all 26 Sequelize model tables** in the ESM + Driver Onboarding + Fleet upgrade. The ZIP contains ONLY new seed/demo files. It does **not** replace your Express or React application.

## Critical safety notes

- **Development / demo databases only.** Back up your database before import.
- This SQL does not issue `DROP`, `TRUNCATE`, `DELETE`, or updates to real rows. It inserts namespaced samples (`DEMO_ERODE`, `DEMO_GOBI`, `ptdemo_*`, `DEMO-TN*`). Importing a second time will not duplicate those named examples.
- The sample driver/customer/admin users have **no passwords and are disabled**. Do not assume any sample account can log in.
- All drivers and vehicles are **unverified/inactive for real dispatch**, even after media installation. Photos, documents, license examples, mock owner details, and videos are **synthetic and visibly marked SAMPLE / NOT VALID**. This is not a substitute for actual KYC or a real fleet approval.
- `fcm_devices` has an inert, invalid demo token and `otps` has an expired, unusable sample, only so every model table has a record. Never treat them as real Firebase/SMS credentials.
- Example polygon boundaries are illustrative, **not approved Erode/Gobi coverage maps**.
- `VALET` rates and attached-vehicle settlement values are **illustrative**, not user-approved rates. Local, local package, outstation and driver-rent examples use the requirements supplied for Periyar Taxi.
- Demo rides are historic completed/cancelled records; nothing is queued for live dispatch. Demo cash payments are **fictional**, not reconciled real receipts.

## 1 — Check your current backend schema

Use your current project folder, containing `server.js`, `.env`, `src/` and `node_modules/`.

For an **existing populated** database, DO NOT run `db:init` just to import samples. Ensure you already applied the existing migrations:

```bash
npm run db:migrate-driver
npm run db:migrate-fleet
```

If this is a **brand-new empty** database only, run the project's `npm run db:init` before the two migrations. The SQL assumes all 26 model tables already exist; it is data-only, not schema DDL.

## 2 — Extract ZIP directly into your existing backend directory

```bash
cd ~/Downloads/Periyar_Taxi_Backend_Driver_Onboarding_ESM
unzip -o ~/Downloads/Periyar_Taxi_Demo_Database_And_Media.zip
```

This adds these folders/files without replacing your app source:

```text
sql/periyar_taxi_demo.sql
scripts/installDemoMedia.js
scripts/diagnosePricing.js
demo_assets/drivers/... (fictional images)
demo_assets/vehicles/... (fictional images, cert images, MP4 samples)
docs/SCHEMA_COVERAGE.md
README_IMPORT_FIRST.md
```

## 3 — Import MySQL sample records

Option A: **Terminal** (the configured local MySQL account has empty password in your example):

```bash
mysql -u root periyar_taxi < sql/periyar_taxi_demo.sql
```

If root uses a password:

```bash
mysql -u root -p periyar_taxi < sql/periyar_taxi_demo.sql
```

Option B: **phpMyAdmin** → select `periyar_taxi` → **Import** → choose `sql/periyar_taxi_demo.sql` → Go.

The SQL uses `START TRANSACTION` / `COMMIT`; it only adds the demo records. If you see a missing-column error, confirm you applied the corresponding driver/fleet migration. If your existing schema differs from the supplied backend models, stop and inspect before retrying.

## 4 — Install protected images, mock documents, and videos

SQL cannot place media into your filesystem or know auto-generated driver/vehicle database IDs. Run this **after** SQL import:

```bash
node scripts/installDemoMedia.js
```

The script finds demo users by `ptdemo_driver_*` and vehicles by `DEMO-TN*`, copies the media to `uploads/driver-private/{user_id}/` and `uploads/vehicle-private/{vehicle_id}/`, then updates only those demo records' JSON media fields to the exact backend-required SHA-style filenames. Running it again will reuse those files.

Expected final message:

`Success. Sample media stored privately. All demo driver accounts and vehicles remain disabled for real dispatch.`

Media is accessible through your existing authenticated driver and vehicle media API routes. It is intentionally **not** added under `public/` or `frontend/`.

## 5 — Diagnose the previous “Invalid pricing rule” error

```bash
node scripts/diagnosePricing.js
```

This script reports missing/invalid **saved** pricing configurations for each branch. It never updates pricing or any real record.

- If `DEMO_ERODE` and `DEMO_GOBI` show **OK** for all five services, the sample pricing was loaded correctly.
- If your **real ERODE** branch has an invalid rule, it needs separate review: the demo SQL intentionally does not overwrite your established real rates.
- If real ERODE rates all show **OK** but you still see “Invalid pricing rule” when clicking **Save**, inspect the browser's **Network** tab for the `PUT /api/pricing` body. `config` must be a JSON **object**, not a string or null. Seeding additional rows will not fix a malformed frontend request.

## 6 — Verify sample counts

```sql
USE periyar_taxi;
SELECT COUNT(*) AS sample_branches FROM branches WHERE code LIKE 'DEMO_%';
SELECT COUNT(*) AS sample_pricing_rules FROM pricing_rules WHERE branch_id IN
 (SELECT id FROM branches WHERE code LIKE 'DEMO_%');
SELECT COUNT(*) AS sample_vehicles FROM vehicles WHERE registration LIKE 'DEMO-%';
SELECT COUNT(*) AS sample_rides FROM rides WHERE notes LIKE 'PT_DEMO_RIDE_%';
```

Expected: 2 sample branches, 10 pricing rows, 4 vehicles, 8 rides.

## Important limitations

- These are **fictional fixtures for UI demonstration**, not authentic licences, RCs, insurance policies, Aadhaar records, compliance certificates, or payment receipts.
- Images are original, generated, visibly marked sample artwork (not actual cars/drivers); MP4s are brief sample slides, not real inspection footage.
- This package creates **no new tables**. It requires the exact existing Sequelize schema and migrations.
- Source/script syntax and ZIP contents were locally verified. A full import could not be exercised against your private local MySQL instance.
