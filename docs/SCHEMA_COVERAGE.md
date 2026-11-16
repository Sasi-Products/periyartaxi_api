# Demo data coverage — all Sequelize tables

The following 26 tables come from `src/models/index.js` in the latest Periyar Taxi ESM backend combined with the Driver Onboarding and Fleet updates. This package inserts at least one namespaced demo row in **each table**, without deleting your current records.

| Table | Sample records |
|---|---|
| `branches` | Erode Demo and Gobi Demo with illustrative polygon service boundaries |
| `pricing_rules` | All 5 services for both demo branches |
| `local_packages` | 2h/20km, 3h/30km, 4h/40km packages in each demo branch |
| `users` | Disabled demo Admin, Driver, Customer accounts without login passwords |
| `driver_profiles` | Permanent/acting demo profiles; sample addresses/emergency contacts and mock documentation |
| `vehicles` | Company and attached vehicle examples; owner terms and synthetic photos/certificates/videos |
| `vehicle_service_logs` | Oil-change examples and linked sample invoice documents |
| `vehicle_odometer_logs` | Previous and current readings per demo vehicle |
| `assignments` | Historical (inactive) multi-day driver/car assignments |
| `driver_locations` | Stale sample GPS coordinates (not real-time) |
| `driver_shifts` | Closed historical shifts |
| `rides` | Completed/cancelled samples across Local, Local Package, Outstation, Driver Rent, Valet |
| `ride_drivers` | Driver allocations for sample completed trips |
| `ride_events` | Sample import audit event per ride |
| `ride_offers` | Historical expired offers only |
| `ride_charges` | Toll, parking, driver beta and food extra charges |
| `payments` | Fictional cash records and a failed/invalid Razorpay example |
| `attendance` | Sample attendance records for drivers and admin staff |
| `payroll` | Draft October 2026 salary examples |
| `expenses` | Fuel, vehicle service, insurance, cleaning expenses |
| `audit_logs` | Demo import actions |
| `notifications` | Example (non-pushed) notification items |
| `fcm_devices` | One intentionally unusable marker/token |
| `otps` | One expired, unusable OTP entry |
| `saved_places` | Sample customer saved places |
| `reviews` | Sample trip reviews |

## Source of truth

Matched to supplied previous backend files:
- `Periyar_Taxi_Backend_Driver_Onboarding_ESM.zip`
- `Periyar_Taxi_Backend_Updated_Files_Fleet_Fares_Map.zip`

SQL uses the actual underscored MySQL column names from Sequelize's `define: { underscored: true, timestamps: true }` and is intended for the **same schema versions**.
