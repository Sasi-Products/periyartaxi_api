# Periyar Taxi — Trip Timing & Two-Stage OTP Update

This is an UPDATE-ONLY patch. Back up your database and current source files before extracting. It does not require db:init or db:seed. Existing model tables remain intact.

## Apply

```bash
cd ~/Downloads/Periyar_Taxi_Backend_Driver_Onboarding_ESM
unzip -o ~/Downloads/Periyar_Taxi_Backend_Trip_Timing_Update.zip
npm run db:migrate-trip-timing
npm test
npm run dev
```

Extract the matching frontend patch into your existing frontend root and run `npm run dev`.

## New database tables

- `ride_otps`: separate hashed, expiring, one-time START and END OTP records. Maximum five attempts per code and a resend cooldown. Old deterministic OTPs will no longer work; request a new one for an existing assigned trip.
- `ride_gps_samples`: timestamped samples with phone / vehicle GPS source, speed and location accuracy. The API rejects very old, future, implausible or excessively frequent observations.
- `ride_wait_intervals`: explicit waiting start/end records, reasons, approval status and reviewing operator.

No existing trip, payment, customer or vehicle data is deleted.

## OTP lifecycle

1. Book normally; an assigned driver or operator opens Trip Details.
2. Click **Send start OTP**. Passenger receives the OTP using configured MSG91. The code is not revealed to the driver or admin. In `NODE_ENV=development` with `OTP_DEV_MODE=true`, your existing SMS adapter prints the OTP to the backend terminal *for testing only*.
3. Enter six digits and start the trip. The server records `startedAt`.
4. When the passenger is ready to finish, click **Send end OTP**. This is a different code and cannot reuse the start code.
5. Enter the end code. The server records `endedAt`, stops any running wait interval, calculates the fare and marks the trip completed.

If the driver has no phone, the operator uses exactly the same OTP flow in the admin React Trip Details page. If the passenger has no phone, record this during booking and confirm in person with an audited reason at start and end. A reachable passenger's OTP may be bypassed only by an authorized operator using **Supervisor emergency override** with a reason (e.g. SMS outage). Do not use these exceptions for ordinary trips.

**MSG91 must be configured for real SMS** (auth, flow ID and sender). OTP verification is not a production-ready SMS capability until your provider and DLT template are verified.

## Distance and running/waiting time

- Total elapsed: server end minus start (never Google ETA).
- GPS moving and stationary: estimated from accepted samples and their timestamps; gaps >120 seconds or low-accuracy readings are *unobserved*. Device/phone samples are measured independently, not mixed into one zigzag route.
- Running: trip elapsed less **approved passenger waiting**. This is elapsed operational time, NOT the same as GPS moving time.
- Chargeable waiting: start/stop explicitly in the driver/admin interface, and then operator approves. Traffic congestion is not automatically chargeable.
- Fare: Local Trips have *optional* per-minute waiting and grace fields (initially `0` so no unexpected charges). Local Packages, Outstation, Driver Rent and Valet use total elapsed for their existing hour allowances; no automatic second waiting fee.
- Distance: approved odometer readings have priority. A high-coverage GPS trail (>=90%) is the second choice. Otherwise the previously quoted Google route distance is marked `ROUTE_ESTIMATE` and `provisional=true` until an operator verifies distance. For round trips a complete odometer/GPS path is not multiplied a second time.
- Extra charges (toll, driver beta, parking, food, hill) continue through the existing approved RideCharge workflow.

GPS cannot independently identify customer-requested waiting versus traffic stops. Google Routes API estimates a route; it is not a real vehicle movement sensor. **Browser geolocation does not guarantee background tracking** when a tab is closed or the device sleeps. For reliable unattended tracking, build a native driver-app background location service or integrate a physical vehicle GPS tracker.

## Vehicle GPS integration

Only when integrating an actual third-party tracker:

1. Configure a random 32+ character `VEHICLE_GPS_INGEST_TOKEN` in the **backend** `.env`. Keep it out of the frontend.
2. The vendor server submits HTTPS `POST /api/telematics/ingest` with `X-Periyar-Gps-Token` set to that token and JSON like:

```json
{"rideId":123,"vehicleId":15,"lat":11.341,"lng":77.7172,"accuracyM":12,"speedKmh":23.4,"observedAt":"2026-11-16T04:30:00.000Z"}
```

The trip must be `IN_PROGRESS`, and `vehicleId` must be assigned to that trip. The shared integration token is a baseline integration mechanism; use TLS, network restrictions, rotation and ideally device-specific signed credentials before production.

## API endpoints

- `POST /api/trips/:id/otp/request` with `{"stage":"START"}` or `{"stage":"END"}`
- `POST /api/trips/:id/start` / `POST /api/trips/:id/finish` with `{"otp":"123456"}`
- No-phone: `{ "noPhone":true, "passengerConfirmed":true, "reason":"Customer has no reachable mobile phone" }` (only for recorded no-phone journeys)
- Supervisor emergency: `{ "adminOverride":true, "reason":"Documented SMS outage; passenger verified" }`
- `POST /api/trips/:id/gps` (assigned driver on duty, driver phone samples)
- `GET /api/trips/:id/timing` (authorized passenger, driver or branch staff)
- `POST /api/trips/:id/wait/start` / `/wait/end`
- `POST /api/trips/:id/wait/:waitId/review` with `{ "approve":true }` (operator)
- `POST /api/trips/:id/wait/manual` (operator witnessed waiting)
- `POST /api/trips/:id/distance/verify` with `{ "odometerStartKm":10000, "odometerEndKm":10041, "reason":"Vehicle odometer photographed at both ends" }` (operator)

## Pre-deployment checks

- Test each service and each OTP path, including expired/wrong/reused OTP, SMS failure, passenger without phone, driver without phone and emergency override.
- Check MySQL migration on a staging backup. Existing rides with the old start OTP should request a new START OTP.
- Check 90% GPS coverage on realistic drives, delayed samples and GPS noise; use odometer evidence whenever coverage is not sufficient.
- Require explicit staff permission `trips.override` for admin lifecycle and manual fare actions.
- Define a privacy/retention policy for precise location traces and protect all logs, SMS data and tracker tokens.
