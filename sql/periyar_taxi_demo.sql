-- PERIYAR TAXI • DEMO DATA (MySQL 8 / MariaDB-compatible basic DML)
-- Created against the Periyar Taxi ESM + Driver Onboarding + Fleet migration Sequelize models.
-- DML ONLY: no CREATE/DROP/TRUNCATE/DELETE and no modifications of existing non-demo rows.
-- Idempotent: namespaced demo branch codes, accounts, vehicle registrations, and ride markers.
-- Sample identities/documents are fictional; no real login credentials or active dispatch.
-- The media must be installed using `node scripts/installDemoMedia.js` AFTER importing this SQL.
-- IMPORTANT: Take a backup; demo records will appear in admin dashboards and analytics.
-- Apply schema first: npm run db:init (ONLY fresh DB), npm run db:migrate-driver, npm run db:migrate-fleet.
SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO `branches` (`name`, `code`, `center_lat`, `center_lng`, `polygon`, `active`, `created_at`, `updated_at`)
SELECT 'Periyar Demo • Erode', 'DEMO_ERODE', 11.341, 77.7172, '[{"lat":11.315,"lng":77.685},{"lat":11.371,"lng":77.687},{"lat":11.381,"lng":77.742},{"lat":11.342,"lng":77.756},{"lat":11.307,"lng":77.739}]', 1, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `branches` WHERE code='DEMO_ERODE');

SET @bE := (SELECT `id` FROM `branches` WHERE code='DEMO_ERODE' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `branches` (`name`, `code`, `center_lat`, `center_lng`, `polygon`, `active`, `created_at`, `updated_at`)
SELECT 'Periyar Demo • Gobichettipalayam', 'DEMO_GOBI', 11.4545, 77.4427, '[{"lat":11.427,"lng":77.415},{"lat":11.47,"lng":77.415},{"lat":11.487,"lng":77.458},{"lat":11.454,"lng":77.482},{"lat":11.418,"lng":77.459}]', 1, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `branches` WHERE code='DEMO_GOBI');

SET @bG := (SELECT `id` FROM `branches` WHERE code='DEMO_GOBI' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `pricing_rules` (`branch_id`, `service`, `config`, `version`, `active`, `created_at`, `updated_at`)
SELECT @bE, 'LOCAL', '{"baseKm":3,"baseFare":100,"extraKm":21,"boundaryFee":70,"graceKm":3,"convertAfterKm":3}', 1, 1, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `pricing_rules` WHERE branch_id=@bE AND service='LOCAL');

INSERT INTO `pricing_rules` (`branch_id`, `service`, `config`, `version`, `active`, `created_at`, `updated_at`)
SELECT @bE, 'LOCAL_PACKAGE', '{"boundaryFee":70,"graceKm":3,"convertAfterKm":3}', 1, 1, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `pricing_rules` WHERE branch_id=@bE AND service='LOCAL_PACKAGE');

INSERT INTO `pricing_rules` (`branch_id`, `service`, `config`, `version`, `active`, `created_at`, `updated_at`)
SELECT @bE, 'OUTSTATION', '{"shortThresholdKm":100,"minFare":450,"includedKm":30,"perKm":13,"shortIncludedHours":3,"longIncludedHours":5,"extraHour":80,"oneWayDistanceMultiplier":1,"roundTripDistanceMultiplier":2}', 1, 1, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `pricing_rules` WHERE branch_id=@bE AND service='OUTSTATION');

INSERT INTO `pricing_rules` (`branch_id`, `service`, `config`, `version`, `active`, `created_at`, `updated_at`)
SELECT @bE, 'DRIVER_RENT', '{"minimumHours":6,"minimumFare":700,"extraHour":55}', 1, 1, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `pricing_rules` WHERE branch_id=@bE AND service='DRIVER_RENT');

INSERT INTO `pricing_rules` (`branch_id`, `service`, `config`, `version`, `active`, `created_at`, `updated_at`)
SELECT @bE, 'VALET', '{"minimumHours":4,"perDriverBaseFare":650,"extraHourPerDriver":120,"maxDrivers":20}', 1, 1, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `pricing_rules` WHERE branch_id=@bE AND service='VALET');

INSERT INTO `pricing_rules` (`branch_id`, `service`, `config`, `version`, `active`, `created_at`, `updated_at`)
SELECT @bG, 'LOCAL', '{"baseKm":3,"baseFare":110,"extraKm":21,"boundaryFee":70,"graceKm":3,"convertAfterKm":3}', 1, 1, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `pricing_rules` WHERE branch_id=@bG AND service='LOCAL');

INSERT INTO `pricing_rules` (`branch_id`, `service`, `config`, `version`, `active`, `created_at`, `updated_at`)
SELECT @bG, 'LOCAL_PACKAGE', '{"boundaryFee":70,"graceKm":3,"convertAfterKm":3}', 1, 1, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `pricing_rules` WHERE branch_id=@bG AND service='LOCAL_PACKAGE');

INSERT INTO `pricing_rules` (`branch_id`, `service`, `config`, `version`, `active`, `created_at`, `updated_at`)
SELECT @bG, 'OUTSTATION', '{"shortThresholdKm":100,"minFare":450,"includedKm":30,"perKm":13,"shortIncludedHours":3,"longIncludedHours":5,"extraHour":80,"oneWayDistanceMultiplier":1,"roundTripDistanceMultiplier":2}', 1, 1, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `pricing_rules` WHERE branch_id=@bG AND service='OUTSTATION');

INSERT INTO `pricing_rules` (`branch_id`, `service`, `config`, `version`, `active`, `created_at`, `updated_at`)
SELECT @bG, 'DRIVER_RENT', '{"minimumHours":6,"minimumFare":770,"extraHour":55}', 1, 1, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `pricing_rules` WHERE branch_id=@bG AND service='DRIVER_RENT');

INSERT INTO `pricing_rules` (`branch_id`, `service`, `config`, `version`, `active`, `created_at`, `updated_at`)
SELECT @bG, 'VALET', '{"minimumHours":4,"perDriverBaseFare":715,"extraHourPerDriver":120,"maxDrivers":20}', 1, 1, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `pricing_rules` WHERE branch_id=@bG AND service='VALET');

INSERT INTO `local_packages` (`branch_id`, `name`, `hours`, `kms`, `base_fare`, `extra_hour`, `extra_km`, `active`, `created_at`, `updated_at`)
SELECT @bE, '2 Hours / 20 KM', 2, 20, 420, 90, 21, 1, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `local_packages` WHERE branch_id=@bE AND name='2 Hours / 20 KM');

INSERT INTO `local_packages` (`branch_id`, `name`, `hours`, `kms`, `base_fare`, `extra_hour`, `extra_km`, `active`, `created_at`, `updated_at`)
SELECT @bE, '3 Hours / 30 KM', 3, 30, 720, 90, 21, 1, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `local_packages` WHERE branch_id=@bE AND name='3 Hours / 30 KM');

INSERT INTO `local_packages` (`branch_id`, `name`, `hours`, `kms`, `base_fare`, `extra_hour`, `extra_km`, `active`, `created_at`, `updated_at`)
SELECT @bE, '4 Hours / 40 KM', 4, 40, 1020, 90, 21, 1, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `local_packages` WHERE branch_id=@bE AND name='4 Hours / 40 KM');

INSERT INTO `local_packages` (`branch_id`, `name`, `hours`, `kms`, `base_fare`, `extra_hour`, `extra_km`, `active`, `created_at`, `updated_at`)
SELECT @bG, '2 Hours / 20 KM', 2, 20, 462.0, 90, 21, 1, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `local_packages` WHERE branch_id=@bG AND name='2 Hours / 20 KM');

INSERT INTO `local_packages` (`branch_id`, `name`, `hours`, `kms`, `base_fare`, `extra_hour`, `extra_km`, `active`, `created_at`, `updated_at`)
SELECT @bG, '3 Hours / 30 KM', 3, 30, 792.0, 90, 21, 1, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `local_packages` WHERE branch_id=@bG AND name='3 Hours / 30 KM');

INSERT INTO `local_packages` (`branch_id`, `name`, `hours`, `kms`, `base_fare`, `extra_hour`, `extra_km`, `active`, `created_at`, `updated_at`)
SELECT @bG, '4 Hours / 40 KM', 4, 40, 1122.0, 90, 21, 1, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `local_packages` WHERE branch_id=@bG AND name='4 Hours / 40 KM');

SET @pkg2 := (SELECT `id` FROM `local_packages` WHERE branch_id=@bE AND name='2 Hours / 20 KM' ORDER BY `id` ASC LIMIT 1);
SET @pkg3 := (SELECT `id` FROM `local_packages` WHERE branch_id=@bE AND name='3 Hours / 30 KM' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `users` (`username`, `mobile`, `name`, `password_hash`, `role`, `branch_id`, `permissions`, `salary_type`, `salary_rate`, `active`, `token_version`, `must_change_password`, `verified_at`, `created_at`, `updated_at`)
SELECT 'ptdemo_erode_admin', NULL, 'Demo Erode Manager', NULL, 'ADMIN', @bE, '["drivers.manage","vehicles.manage","pricing.manage","rides.manage"]', 'MONTHLY', 26000, 0, 0, 1, NULL, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `users` WHERE username='ptdemo_erode_admin');

SET @admE := (SELECT `id` FROM `users` WHERE username='ptdemo_erode_admin' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `users` (`username`, `mobile`, `name`, `password_hash`, `role`, `branch_id`, `permissions`, `salary_type`, `salary_rate`, `active`, `token_version`, `must_change_password`, `verified_at`, `created_at`, `updated_at`)
SELECT 'ptdemo_gobi_admin', NULL, 'Demo Gobi Manager', NULL, 'ADMIN', @bG, '["drivers.manage","vehicles.manage","pricing.manage","rides.manage"]', 'MONTHLY', 25000, 0, 0, 1, NULL, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `users` WHERE username='ptdemo_gobi_admin');

SET @admG := (SELECT `id` FROM `users` WHERE username='ptdemo_gobi_admin' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `users` (`username`, `mobile`, `name`, `password_hash`, `role`, `branch_id`, `permissions`, `salary_type`, `salary_rate`, `active`, `token_version`, `must_change_password`, `verified_at`, `created_at`, `updated_at`)
SELECT 'ptdemo_driver_1', NULL, 'Demo Driver Kumar', NULL, 'DRIVER', @bE, '[]', 'MONTHLY', 18000, 0, 0, 1, NULL, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `users` WHERE username='ptdemo_driver_1');

SET @d1 := (SELECT `id` FROM `users` WHERE username='ptdemo_driver_1' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `users` (`username`, `mobile`, `name`, `password_hash`, `role`, `branch_id`, `permissions`, `salary_type`, `salary_rate`, `active`, `token_version`, `must_change_password`, `verified_at`, `created_at`, `updated_at`)
SELECT 'ptdemo_driver_2', NULL, 'Demo Acting Driver Ravi', NULL, 'DRIVER', @bE, '[]', 'DAILY', 850, 0, 0, 1, NULL, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `users` WHERE username='ptdemo_driver_2');

SET @d2 := (SELECT `id` FROM `users` WHERE username='ptdemo_driver_2' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `users` (`username`, `mobile`, `name`, `password_hash`, `role`, `branch_id`, `permissions`, `salary_type`, `salary_rate`, `active`, `token_version`, `must_change_password`, `verified_at`, `created_at`, `updated_at`)
SELECT 'ptdemo_driver_3', NULL, 'Demo Driver Meena', NULL, 'DRIVER', @bE, '[]', 'MONTHLY', 20500, 0, 0, 1, NULL, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `users` WHERE username='ptdemo_driver_3');

SET @d3 := (SELECT `id` FROM `users` WHERE username='ptdemo_driver_3' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `users` (`username`, `mobile`, `name`, `password_hash`, `role`, `branch_id`, `permissions`, `salary_type`, `salary_rate`, `active`, `token_version`, `must_change_password`, `verified_at`, `created_at`, `updated_at`)
SELECT 'ptdemo_driver_4', NULL, 'Demo Driver Arun', NULL, 'DRIVER', @bG, '[]', 'MONTHLY', 19000, 0, 0, 1, NULL, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `users` WHERE username='ptdemo_driver_4');

SET @d4 := (SELECT `id` FROM `users` WHERE username='ptdemo_driver_4' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `users` (`username`, `mobile`, `name`, `password_hash`, `role`, `branch_id`, `permissions`, `salary_type`, `salary_rate`, `active`, `token_version`, `must_change_password`, `verified_at`, `created_at`, `updated_at`)
SELECT 'ptdemo_customer_1', NULL, 'Demo Customer Asha', NULL, 'CUSTOMER', @bE, '[]', 'MONTHLY', 0, 0, 0, 1, NULL, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `users` WHERE username='ptdemo_customer_1');

SET @c1 := (SELECT `id` FROM `users` WHERE username='ptdemo_customer_1' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `users` (`username`, `mobile`, `name`, `password_hash`, `role`, `branch_id`, `permissions`, `salary_type`, `salary_rate`, `active`, `token_version`, `must_change_password`, `verified_at`, `created_at`, `updated_at`)
SELECT 'ptdemo_customer_2', NULL, 'Demo Customer Naveen', NULL, 'CUSTOMER', @bE, '[]', 'MONTHLY', 0, 0, 0, 1, NULL, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `users` WHERE username='ptdemo_customer_2');

SET @c2 := (SELECT `id` FROM `users` WHERE username='ptdemo_customer_2' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `users` (`username`, `mobile`, `name`, `password_hash`, `role`, `branch_id`, `permissions`, `salary_type`, `salary_rate`, `active`, `token_version`, `must_change_password`, `verified_at`, `created_at`, `updated_at`)
SELECT 'ptdemo_customer_3', NULL, 'Demo Customer Divya', NULL, 'CUSTOMER', @bG, '[]', 'MONTHLY', 0, 0, 0, 1, NULL, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `users` WHERE username='ptdemo_customer_3');

SET @c3 := (SELECT `id` FROM `users` WHERE username='ptdemo_customer_3' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `driver_profiles` (`user_id`, `kind`, `license_number`, `license_expiry`, `aadhaar_last4`, `documents`, `verification`, `verification_note`, `verified_by`, `home_lat`, `home_lng`, `available`, `salary_type`, `salary_rate`, `employee_code`, `email`, `date_of_birth`, `joined_on`, `experience_years`, `license_classes`, `permanent_address`, `temporary_address`, `emergency_name`, `emergency_mobile`, `emergency_relation`, `blood_group`, `languages`, `reference_name`, `reference_mobile`, `background_check_status`, `background_check_date`, `onboarding_note`, `document_files`, `created_at`, `updated_at`)
SELECT @d1, 'PERMANENT', 'DEMO-NOT-VALID', '2028-12-31', '0000', '{}', 'PENDING', 'SYNTHETIC DEMO DOCUMENTS - NOT VERIFIED', NULL, 11.348, 77.721, 0, 'MONTHLY', 18000, 'PT-DEMO-001', 'demo1@invalid.example', '1991-02-10', '2026-01-02', 4, 'LMV', '{"line1":"Demo House 1, Testing Street","city":"Erode","district":"Erode","state":"Tamil Nadu","pincode":"638001"}', NULL, 'Demo Contact 1', NULL, 'FAMILY', 'O+', 'Tamil, English', 'Demo Reference', NULL, 'NOT_STARTED', NULL, 'Demo-only identity; not eligible for real dispatch.', '{}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `driver_profiles` WHERE user_id=@d1);

INSERT INTO `driver_profiles` (`user_id`, `kind`, `license_number`, `license_expiry`, `aadhaar_last4`, `documents`, `verification`, `verification_note`, `verified_by`, `home_lat`, `home_lng`, `available`, `salary_type`, `salary_rate`, `employee_code`, `email`, `date_of_birth`, `joined_on`, `experience_years`, `license_classes`, `permanent_address`, `temporary_address`, `emergency_name`, `emergency_mobile`, `emergency_relation`, `blood_group`, `languages`, `reference_name`, `reference_mobile`, `background_check_status`, `background_check_date`, `onboarding_note`, `document_files`, `created_at`, `updated_at`)
SELECT @d2, 'ACTING', 'DEMO-NOT-VALID', '2028-12-31', '0000', '{}', 'PENDING', 'SYNTHETIC DEMO DOCUMENTS - NOT VERIFIED', NULL, 11.34, 77.703, 0, 'DAILY', 850, 'PT-DEMO-002', 'demo2@invalid.example', '1992-02-10', '2026-01-02', 5, 'LMV', '{"line1":"Demo House 2, Testing Street","city":"Erode","district":"Erode","state":"Tamil Nadu","pincode":"638001"}', '{"line1":"Demo House 2, Testing Street","city":"Erode","district":"Erode","state":"Tamil Nadu","pincode":"638001"}', 'Demo Contact 2', NULL, 'FAMILY', 'B+', 'Tamil, English', 'Demo Reference', NULL, 'NOT_STARTED', NULL, 'Demo-only identity; not eligible for real dispatch.', '{}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `driver_profiles` WHERE user_id=@d2);

INSERT INTO `driver_profiles` (`user_id`, `kind`, `license_number`, `license_expiry`, `aadhaar_last4`, `documents`, `verification`, `verification_note`, `verified_by`, `home_lat`, `home_lng`, `available`, `salary_type`, `salary_rate`, `employee_code`, `email`, `date_of_birth`, `joined_on`, `experience_years`, `license_classes`, `permanent_address`, `temporary_address`, `emergency_name`, `emergency_mobile`, `emergency_relation`, `blood_group`, `languages`, `reference_name`, `reference_mobile`, `background_check_status`, `background_check_date`, `onboarding_note`, `document_files`, `created_at`, `updated_at`)
SELECT @d3, 'PERMANENT', 'DEMO-NOT-VALID', '2028-12-31', '0000', '{}', 'PENDING', 'SYNTHETIC DEMO DOCUMENTS - NOT VERIFIED', NULL, 11.358, 77.736, 0, 'MONTHLY', 20500, 'PT-DEMO-003', 'demo3@invalid.example', '1993-02-10', '2026-01-02', 6, 'LMV', '{"line1":"Demo House 3, Testing Street","city":"Erode","district":"Erode","state":"Tamil Nadu","pincode":"638001"}', NULL, 'Demo Contact 3', NULL, 'FAMILY', 'A+', 'Tamil, English', 'Demo Reference', NULL, 'NOT_STARTED', NULL, 'Demo-only identity; not eligible for real dispatch.', '{}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `driver_profiles` WHERE user_id=@d3);

INSERT INTO `driver_profiles` (`user_id`, `kind`, `license_number`, `license_expiry`, `aadhaar_last4`, `documents`, `verification`, `verification_note`, `verified_by`, `home_lat`, `home_lng`, `available`, `salary_type`, `salary_rate`, `employee_code`, `email`, `date_of_birth`, `joined_on`, `experience_years`, `license_classes`, `permanent_address`, `temporary_address`, `emergency_name`, `emergency_mobile`, `emergency_relation`, `blood_group`, `languages`, `reference_name`, `reference_mobile`, `background_check_status`, `background_check_date`, `onboarding_note`, `document_files`, `created_at`, `updated_at`)
SELECT @d4, 'PERMANENT', 'DEMO-NOT-VALID', '2028-12-31', '0000', '{}', 'PENDING', 'SYNTHETIC DEMO DOCUMENTS - NOT VERIFIED', NULL, 11.455, 77.443, 0, 'MONTHLY', 19000, 'PT-DEMO-004', 'demo4@invalid.example', '1994-02-10', '2026-01-02', 7, 'LMV', '{"line1":"Demo House 4, Testing Street","city":"Gobichettipalayam","district":"Erode","state":"Tamil Nadu","pincode":"638001"}', '{"line1":"Demo House 4, Testing Street","city":"Gobichettipalayam","district":"Erode","state":"Tamil Nadu","pincode":"638001"}', 'Demo Contact 4', NULL, 'FAMILY', 'AB+', 'Tamil, English', 'Demo Reference', NULL, 'NOT_STARTED', NULL, 'Demo-only identity; not eligible for real dispatch.', '{}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `driver_profiles` WHERE user_id=@d4);

INSERT INTO `vehicles` (`branch_id`, `registration`, `brand`, `name`, `variant`, `model_year`, `fuel_type`, `seats`, `type`, `ownership_type`, `owner_details`, `attachment_terms`, `chassis_last6`, `engine_last6`, `registration_date`, `insurance_expiry`, `pollution_expiry`, `permit_expiry`, `fitness_expiry`, `road_tax_expiry`, `odometer_km`, `service_due_km`, `service_due_date`, `last_service_at`, `vehicle_status`, `insurance_provider`, `policy_number`, `notes`, `photos`, `documents`, `videos`, `verification`, `active`, `created_at`, `updated_at`)
SELECT @bE, 'DEMO-TN33-SEDAN', 'Maruti Suzuki', 'Dzire', 'VXI', 2025, 'PETROL_CNG', 5, 'SEDAN', 'COMPANY', '{}', '{}', NULL, NULL, '2024-01-01', '2028-10-30', '2027-07-30', '2028-05-30', '2028-12-30', '2028-11-01', 28500, 33500, '2027-02-20', '2026-09-01', 'AVAILABLE', 'Demo Insurer (NOT REAL)', 'DEMO-POLICY-NOT-VALID', 'DEMO ONLY: photos/documents are synthetic', '{}', '{}', '{}', 'PENDING', 0, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `vehicles` WHERE registration='DEMO-TN33-SEDAN');

SET @v1 := (SELECT `id` FROM `vehicles` WHERE registration='DEMO-TN33-SEDAN' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `vehicles` (`branch_id`, `registration`, `brand`, `name`, `variant`, `model_year`, `fuel_type`, `seats`, `type`, `ownership_type`, `owner_details`, `attachment_terms`, `chassis_last6`, `engine_last6`, `registration_date`, `insurance_expiry`, `pollution_expiry`, `permit_expiry`, `fitness_expiry`, `road_tax_expiry`, `odometer_km`, `service_due_km`, `service_due_date`, `last_service_at`, `vehicle_status`, `insurance_provider`, `policy_number`, `notes`, `photos`, `documents`, `videos`, `verification`, `active`, `created_at`, `updated_at`)
SELECT @bE, 'DEMO-TN33-MINI', 'Maruti Suzuki', 'Wagon R', 'LXI', 2023, 'PETROL', 5, 'MINI', 'ATTACHED', '{"name":"Demo Owner Selvam","mobile":"0000000000","address":"Sample Street, Erode","city":"Erode","state":"Tamil Nadu","pincode":"638001"}', '{"startDate":"2026-01-01","endDate":"2028-12-31","settlementType":"PER_TRIP","settlementRate":350,"notes":"DEMO ONLY: no real contract"}', NULL, NULL, '2024-01-01', '2028-10-30', '2027-07-30', '2028-05-30', '2028-12-30', '2028-11-01', 40300, 45300, '2027-02-20', '2026-09-01', 'AVAILABLE', 'Demo Insurer (NOT REAL)', 'DEMO-POLICY-NOT-VALID', 'DEMO ONLY: photos/documents are synthetic', '{}', '{}', '{}', 'PENDING', 0, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `vehicles` WHERE registration='DEMO-TN33-MINI');

SET @v2 := (SELECT `id` FROM `vehicles` WHERE registration='DEMO-TN33-MINI' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `vehicles` (`branch_id`, `registration`, `brand`, `name`, `variant`, `model_year`, `fuel_type`, `seats`, `type`, `ownership_type`, `owner_details`, `attachment_terms`, `chassis_last6`, `engine_last6`, `registration_date`, `insurance_expiry`, `pollution_expiry`, `permit_expiry`, `fitness_expiry`, `road_tax_expiry`, `odometer_km`, `service_due_km`, `service_due_date`, `last_service_at`, `vehicle_status`, `insurance_provider`, `policy_number`, `notes`, `photos`, `documents`, `videos`, `verification`, `active`, `created_at`, `updated_at`)
SELECT @bE, 'DEMO-TN33-SUV', 'Toyota', 'Innova', 'GX', 2022, 'DIESEL', 8, 'SUV', 'ATTACHED', '{"name":"Demo Owner Shanthi","mobile":"0000000000","address":"Example Road, Erode","city":"Erode","state":"Tamil Nadu","pincode":"638001"}', '{"startDate":"2026-01-01","endDate":"2028-12-31","settlementType":"PERCENTAGE","settlementRate":25,"notes":"DEMO ONLY: no real contract"}', NULL, NULL, '2024-01-01', '2028-10-30', '2027-07-30', '2028-05-30', '2028-12-30', '2028-11-01', 62200, 67200, '2027-02-20', '2026-09-01', 'AVAILABLE', 'Demo Insurer (NOT REAL)', 'DEMO-POLICY-NOT-VALID', 'DEMO ONLY: photos/documents are synthetic', '{}', '{}', '{}', 'PENDING', 0, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `vehicles` WHERE registration='DEMO-TN33-SUV');

SET @v3 := (SELECT `id` FROM `vehicles` WHERE registration='DEMO-TN33-SUV' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `vehicles` (`branch_id`, `registration`, `brand`, `name`, `variant`, `model_year`, `fuel_type`, `seats`, `type`, `ownership_type`, `owner_details`, `attachment_terms`, `chassis_last6`, `engine_last6`, `registration_date`, `insurance_expiry`, `pollution_expiry`, `permit_expiry`, `fitness_expiry`, `road_tax_expiry`, `odometer_km`, `service_due_km`, `service_due_date`, `last_service_at`, `vehicle_status`, `insurance_provider`, `policy_number`, `notes`, `photos`, `documents`, `videos`, `verification`, `active`, `created_at`, `updated_at`)
SELECT @bG, 'DEMO-TN36-SEDAN', 'Hyundai', 'Aura', 'S', 2024, 'PETROL', 5, 'SEDAN', 'COMPANY', '{}', '{}', NULL, NULL, '2024-01-01', '2028-10-30', '2027-07-30', '2028-05-30', '2028-12-30', '2028-11-01', 19400, 24400, '2027-02-20', '2026-09-01', 'AVAILABLE', 'Demo Insurer (NOT REAL)', 'DEMO-POLICY-NOT-VALID', 'DEMO ONLY: photos/documents are synthetic', '{}', '{}', '{}', 'PENDING', 0, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `vehicles` WHERE registration='DEMO-TN36-SEDAN');

SET @v4 := (SELECT `id` FROM `vehicles` WHERE registration='DEMO-TN36-SEDAN' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `assignments` (`driver_id`, `vehicle_id`, `branch_id`, `starts_at`, `ends_at`, `active`, `created_at`, `updated_at`)
SELECT @d1, @v1, @bE, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY), 0, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `assignments` WHERE driver_id=@d1 AND vehicle_id=@v1 AND active=0);

INSERT INTO `driver_locations` (`driver_id`, `branch_id`, `lat`, `lng`, `accuracy`, `speed`, `heading`, `reported_at`, `created_at`, `updated_at`)
SELECT @d1, @bE, 11.34, 77.705, 12.1, 0, 90, DATE_SUB(NOW(), INTERVAL 6 DAY), NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `driver_locations` WHERE driver_id=@d1);

INSERT INTO `driver_shifts` (`driver_id`, `branch_id`, `starts_at`, `ends_at`, `active`, `created_at`, `updated_at`)
SELECT @d1, @bE, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), 0, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `driver_shifts` WHERE driver_id=@d1 AND active=0);

INSERT INTO `assignments` (`driver_id`, `vehicle_id`, `branch_id`, `starts_at`, `ends_at`, `active`, `created_at`, `updated_at`)
SELECT @d2, @v2, @bE, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY), 0, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `assignments` WHERE driver_id=@d2 AND vehicle_id=@v2 AND active=0);

INSERT INTO `driver_locations` (`driver_id`, `branch_id`, `lat`, `lng`, `accuracy`, `speed`, `heading`, `reported_at`, `created_at`, `updated_at`)
SELECT @d2, @bE, 11.36, 77.71000000000001, 12.1, 0, 90, DATE_SUB(NOW(), INTERVAL 6 DAY), NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `driver_locations` WHERE driver_id=@d2);

INSERT INTO `driver_shifts` (`driver_id`, `branch_id`, `starts_at`, `ends_at`, `active`, `created_at`, `updated_at`)
SELECT @d2, @bE, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), 0, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `driver_shifts` WHERE driver_id=@d2 AND active=0);

INSERT INTO `assignments` (`driver_id`, `vehicle_id`, `branch_id`, `starts_at`, `ends_at`, `active`, `created_at`, `updated_at`)
SELECT @d3, @v3, @bE, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY), 0, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `assignments` WHERE driver_id=@d3 AND vehicle_id=@v3 AND active=0);

INSERT INTO `driver_locations` (`driver_id`, `branch_id`, `lat`, `lng`, `accuracy`, `speed`, `heading`, `reported_at`, `created_at`, `updated_at`)
SELECT @d3, @bE, 11.38, 77.715, 12.1, 0, 90, DATE_SUB(NOW(), INTERVAL 6 DAY), NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `driver_locations` WHERE driver_id=@d3);

INSERT INTO `driver_shifts` (`driver_id`, `branch_id`, `starts_at`, `ends_at`, `active`, `created_at`, `updated_at`)
SELECT @d3, @bE, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), 0, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `driver_shifts` WHERE driver_id=@d3 AND active=0);

INSERT INTO `assignments` (`driver_id`, `vehicle_id`, `branch_id`, `starts_at`, `ends_at`, `active`, `created_at`, `updated_at`)
SELECT @d4, @v4, @bG, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY), 0, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `assignments` WHERE driver_id=@d4 AND vehicle_id=@v4 AND active=0);

INSERT INTO `driver_locations` (`driver_id`, `branch_id`, `lat`, `lng`, `accuracy`, `speed`, `heading`, `reported_at`, `created_at`, `updated_at`)
SELECT @d4, @bG, 11.4, 77.72, 12.1, 0, 90, DATE_SUB(NOW(), INTERVAL 6 DAY), NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `driver_locations` WHERE driver_id=@d4);

INSERT INTO `driver_shifts` (`driver_id`, `branch_id`, `starts_at`, `ends_at`, `active`, `created_at`, `updated_at`)
SELECT @d4, @bG, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), 0, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `driver_shifts` WHERE driver_id=@d4 AND active=0);

INSERT INTO `vehicle_odometer_logs` (`vehicle_id`, `branch_id`, `reading_km`, `reading_at`, `source`, `note`, `created_by`, `created_at`, `updated_at`)
SELECT @v1, @bE, 26900, DATE_SUB(NOW(), INTERVAL 38 DAY), 'INSPECTION', 'DEMO_ODOMETER_v1_0', @admE, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `vehicle_odometer_logs` WHERE vehicle_id=@v1 AND note='DEMO_ODOMETER_v1_0');

INSERT INTO `vehicle_odometer_logs` (`vehicle_id`, `branch_id`, `reading_km`, `reading_at`, `source`, `note`, `created_by`, `created_at`, `updated_at`)
SELECT @v1, @bE, 28500, DATE_SUB(NOW(), INTERVAL 18 DAY), 'SERVICE', 'DEMO_ODOMETER_v1_1', @admE, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `vehicle_odometer_logs` WHERE vehicle_id=@v1 AND note='DEMO_ODOMETER_v1_1');

INSERT INTO `vehicle_service_logs` (`vehicle_id`, `branch_id`, `service_date`, `category`, `workshop`, `description`, `odometer_km`, `parts_cost`, `labour_cost`, `total_cost`, `next_service_km`, `next_service_date`, `invoice_document`, `expense_id`, `created_by`, `created_at`, `updated_at`)
SELECT @v1, @bE, DATE_SUB(CURDATE(), INTERVAL 21 DAY), 'DEMO_OIL_CHANGE', 'Demo Vehicle Workshop', 'DEMO_SERVICE_FOR_v1: Engine oil and filters replaced (sample)', 28500, 1400, 600, 2000, 33500, '2027-02-20', NULL, NULL, @admE, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `vehicle_service_logs` WHERE vehicle_id=@v1 AND description LIKE 'DEMO_SERVICE_FOR_v1:%');

INSERT INTO `vehicle_odometer_logs` (`vehicle_id`, `branch_id`, `reading_km`, `reading_at`, `source`, `note`, `created_by`, `created_at`, `updated_at`)
SELECT @v2, @bE, 38700, DATE_SUB(NOW(), INTERVAL 38 DAY), 'INSPECTION', 'DEMO_ODOMETER_v2_0', @admE, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `vehicle_odometer_logs` WHERE vehicle_id=@v2 AND note='DEMO_ODOMETER_v2_0');

INSERT INTO `vehicle_odometer_logs` (`vehicle_id`, `branch_id`, `reading_km`, `reading_at`, `source`, `note`, `created_by`, `created_at`, `updated_at`)
SELECT @v2, @bE, 40300, DATE_SUB(NOW(), INTERVAL 18 DAY), 'SERVICE', 'DEMO_ODOMETER_v2_1', @admE, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `vehicle_odometer_logs` WHERE vehicle_id=@v2 AND note='DEMO_ODOMETER_v2_1');

INSERT INTO `vehicle_service_logs` (`vehicle_id`, `branch_id`, `service_date`, `category`, `workshop`, `description`, `odometer_km`, `parts_cost`, `labour_cost`, `total_cost`, `next_service_km`, `next_service_date`, `invoice_document`, `expense_id`, `created_by`, `created_at`, `updated_at`)
SELECT @v2, @bE, DATE_SUB(CURDATE(), INTERVAL 21 DAY), 'DEMO_OIL_CHANGE', 'Demo Vehicle Workshop', 'DEMO_SERVICE_FOR_v2: Engine oil and filters replaced (sample)', 40300, 1400, 600, 2000, 45300, '2027-02-20', NULL, NULL, @admE, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `vehicle_service_logs` WHERE vehicle_id=@v2 AND description LIKE 'DEMO_SERVICE_FOR_v2:%');

INSERT INTO `vehicle_odometer_logs` (`vehicle_id`, `branch_id`, `reading_km`, `reading_at`, `source`, `note`, `created_by`, `created_at`, `updated_at`)
SELECT @v3, @bE, 60600, DATE_SUB(NOW(), INTERVAL 38 DAY), 'INSPECTION', 'DEMO_ODOMETER_v3_0', @admE, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `vehicle_odometer_logs` WHERE vehicle_id=@v3 AND note='DEMO_ODOMETER_v3_0');

INSERT INTO `vehicle_odometer_logs` (`vehicle_id`, `branch_id`, `reading_km`, `reading_at`, `source`, `note`, `created_by`, `created_at`, `updated_at`)
SELECT @v3, @bE, 62200, DATE_SUB(NOW(), INTERVAL 18 DAY), 'SERVICE', 'DEMO_ODOMETER_v3_1', @admE, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `vehicle_odometer_logs` WHERE vehicle_id=@v3 AND note='DEMO_ODOMETER_v3_1');

INSERT INTO `vehicle_service_logs` (`vehicle_id`, `branch_id`, `service_date`, `category`, `workshop`, `description`, `odometer_km`, `parts_cost`, `labour_cost`, `total_cost`, `next_service_km`, `next_service_date`, `invoice_document`, `expense_id`, `created_by`, `created_at`, `updated_at`)
SELECT @v3, @bE, DATE_SUB(CURDATE(), INTERVAL 21 DAY), 'DEMO_OIL_CHANGE', 'Demo Vehicle Workshop', 'DEMO_SERVICE_FOR_v3: Engine oil and filters replaced (sample)', 62200, 1400, 600, 2000, 67200, '2027-02-20', NULL, NULL, @admE, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `vehicle_service_logs` WHERE vehicle_id=@v3 AND description LIKE 'DEMO_SERVICE_FOR_v3:%');

INSERT INTO `vehicle_odometer_logs` (`vehicle_id`, `branch_id`, `reading_km`, `reading_at`, `source`, `note`, `created_by`, `created_at`, `updated_at`)
SELECT @v4, @bG, 17800, DATE_SUB(NOW(), INTERVAL 38 DAY), 'INSPECTION', 'DEMO_ODOMETER_v4_0', @admG, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `vehicle_odometer_logs` WHERE vehicle_id=@v4 AND note='DEMO_ODOMETER_v4_0');

INSERT INTO `vehicle_odometer_logs` (`vehicle_id`, `branch_id`, `reading_km`, `reading_at`, `source`, `note`, `created_by`, `created_at`, `updated_at`)
SELECT @v4, @bG, 19400, DATE_SUB(NOW(), INTERVAL 18 DAY), 'SERVICE', 'DEMO_ODOMETER_v4_1', @admG, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `vehicle_odometer_logs` WHERE vehicle_id=@v4 AND note='DEMO_ODOMETER_v4_1');

INSERT INTO `vehicle_service_logs` (`vehicle_id`, `branch_id`, `service_date`, `category`, `workshop`, `description`, `odometer_km`, `parts_cost`, `labour_cost`, `total_cost`, `next_service_km`, `next_service_date`, `invoice_document`, `expense_id`, `created_by`, `created_at`, `updated_at`)
SELECT @v4, @bG, DATE_SUB(CURDATE(), INTERVAL 21 DAY), 'DEMO_OIL_CHANGE', 'Demo Vehicle Workshop', 'DEMO_SERVICE_FOR_v4: Engine oil and filters replaced (sample)', 19400, 1400, 600, 2000, 24400, '2027-02-20', NULL, NULL, @admG, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `vehicle_service_logs` WHERE vehicle_id=@v4 AND description LIKE 'DEMO_SERVICE_FOR_v4:%');

INSERT INTO `rides` (`branch_id`, `customer_id`, `guest_name`, `guest_mobile`, `service`, `trip_mode`, `package_id`, `vehicle_type`, `required_drivers`, `pickup`, `dropoff`, `pickup_address`, `dropoff_address`, `distance_km`, `duration_minutes`, `scheduled_at`, `return_at`, `status`, `assigned_driver_id`, `vehicle_id`, `quote`, `estimated_fare`, `final_fare`, `payment_status`, `start_otp_hash`, `started_at`, `ended_at`, `cancelled_at`, `cancel_reason`, `created_by`, `notes`, `metadata`, `created_at`, `updated_at`)
SELECT @bE, @c1, NULL, NULL, 'LOCAL', 'ONE_WAY', NULL, 'SEDAN', 1, '{"lat":11.344,"lng":77.72}', '{"lat":11.358,"lng":77.736}', 'DEMO: Periyar Taxi Sample Pickup', 'DEMO: Sample Destination, Erode', 8.0, 24, DATE_SUB(NOW(), INTERVAL 13 DAY), NULL, 'COMPLETED', @d1, @v1, '{"estimate":{"service":"LOCAL","tripMode":"ONE_WAY","distKm":8.0,"hours":0.4,"total":275,"components":{"baseFare":275,"extraKmFare":0,"extraHourFare":0,"boundaryCharge":0},"formula":"DEMO estimate; not a live Google Routes result"},"originalService":"LOCAL","demo":true}', 275, 295, 'PAID', NULL, DATE_SUB(NOW(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY), NULL, NULL, @admE, 'PT_DEMO_RIDE_01', '{"demo":true}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `rides` WHERE notes='PT_DEMO_RIDE_01');

SET @r1 := (SELECT `id` FROM `rides` WHERE notes='PT_DEMO_RIDE_01' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `ride_events` (`ride_id`, `actor_id`, `event`, `message`, `payload`, `created_at`, `updated_at`)
SELECT @r1, @admE, 'DEMO_IMPORTED', 'PT_DEMO_RIDE_01: imported sample event', '{"demo":true}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_events` WHERE ride_id=@r1 AND event='DEMO_IMPORTED');

INSERT INTO `ride_drivers` (`ride_id`, `driver_id`, `vehicle_id`, `status`, `created_at`, `updated_at`)
SELECT @r1, @d1, @v1, 'COMPLETED', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_drivers` WHERE ride_id=@r1 AND driver_id=@d1);

INSERT INTO `ride_offers` (`ride_id`, `driver_id`, `vehicle_id`, `expires_at`, `status`, `created_at`, `updated_at`)
SELECT @r1, @d1, @v1, DATE_SUB(NOW(), INTERVAL 13 DAY), 'EXPIRED', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_offers` WHERE ride_id=@r1 AND driver_id=@d1);

INSERT INTO `payments` (`ride_id`, `customer_id`, `collected_by`, `amount`, `method`, `status`, `provider_order_id`, `provider_payment_id`, `reconciled_at`, `notes`, `created_at`, `updated_at`)
SELECT @r1, @c1, @d1, 295, 'CASH', 'SUCCESS', NULL, NULL, DATE_SUB(NOW(), INTERVAL 13 DAY), 'DEMO_CASH_r1', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `payments` WHERE notes='DEMO_CASH_r1');

INSERT INTO `reviews` (`ride_id`, `customer_id`, `rating`, `comment`, `created_at`, `updated_at`)
SELECT @r1, @c1, 5, 'DEMO review: helpful driver', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `reviews` WHERE ride_id=@r1);

INSERT INTO `rides` (`branch_id`, `customer_id`, `guest_name`, `guest_mobile`, `service`, `trip_mode`, `package_id`, `vehicle_type`, `required_drivers`, `pickup`, `dropoff`, `pickup_address`, `dropoff_address`, `distance_km`, `duration_minutes`, `scheduled_at`, `return_at`, `status`, `assigned_driver_id`, `vehicle_id`, `quote`, `estimated_fare`, `final_fare`, `payment_status`, `start_otp_hash`, `started_at`, `ended_at`, `cancelled_at`, `cancel_reason`, `created_by`, `notes`, `metadata`, `created_at`, `updated_at`)
SELECT @bE, @c2, NULL, NULL, 'LOCAL_PACKAGE', 'ONE_WAY', @pkg2, 'MINI', 1, '{"lat":11.347,"lng":77.723}', '{"lat":11.361,"lng":77.739}', 'DEMO: Periyar Taxi Sample Pickup', 'DEMO: Sample Destination, Erode', 18.0, 110, DATE_SUB(NOW(), INTERVAL 14 DAY), NULL, 'COMPLETED', @d2, @v2, '{"estimate":{"service":"LOCAL_PACKAGE","tripMode":"ONE_WAY","distKm":18.0,"hours":1.83,"total":420,"components":{"baseFare":420,"extraKmFare":0,"extraHourFare":0,"boundaryCharge":0},"formula":"DEMO estimate; not a live Google Routes result"},"originalService":"LOCAL_PACKAGE","demo":true}', 420, 420, 'PAID', NULL, DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY), NULL, NULL, @admE, 'PT_DEMO_RIDE_02', '{"demo":true}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `rides` WHERE notes='PT_DEMO_RIDE_02');

SET @r2 := (SELECT `id` FROM `rides` WHERE notes='PT_DEMO_RIDE_02' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `ride_events` (`ride_id`, `actor_id`, `event`, `message`, `payload`, `created_at`, `updated_at`)
SELECT @r2, @admE, 'DEMO_IMPORTED', 'PT_DEMO_RIDE_02: imported sample event', '{"demo":true}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_events` WHERE ride_id=@r2 AND event='DEMO_IMPORTED');

INSERT INTO `ride_drivers` (`ride_id`, `driver_id`, `vehicle_id`, `status`, `created_at`, `updated_at`)
SELECT @r2, @d2, @v2, 'COMPLETED', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_drivers` WHERE ride_id=@r2 AND driver_id=@d2);

INSERT INTO `ride_offers` (`ride_id`, `driver_id`, `vehicle_id`, `expires_at`, `status`, `created_at`, `updated_at`)
SELECT @r2, @d2, @v2, DATE_SUB(NOW(), INTERVAL 14 DAY), 'EXPIRED', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_offers` WHERE ride_id=@r2 AND driver_id=@d2);

INSERT INTO `payments` (`ride_id`, `customer_id`, `collected_by`, `amount`, `method`, `status`, `provider_order_id`, `provider_payment_id`, `reconciled_at`, `notes`, `created_at`, `updated_at`)
SELECT @r2, @c2, @d2, 420, 'CASH', 'SUCCESS', NULL, NULL, DATE_SUB(NOW(), INTERVAL 14 DAY), 'DEMO_CASH_r2', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `payments` WHERE notes='DEMO_CASH_r2');

INSERT INTO `rides` (`branch_id`, `customer_id`, `guest_name`, `guest_mobile`, `service`, `trip_mode`, `package_id`, `vehicle_type`, `required_drivers`, `pickup`, `dropoff`, `pickup_address`, `dropoff_address`, `distance_km`, `duration_minutes`, `scheduled_at`, `return_at`, `status`, `assigned_driver_id`, `vehicle_id`, `quote`, `estimated_fare`, `final_fare`, `payment_status`, `start_otp_hash`, `started_at`, `ended_at`, `cancelled_at`, `cancel_reason`, `created_by`, `notes`, `metadata`, `created_at`, `updated_at`)
SELECT @bE, @c1, NULL, NULL, 'OUTSTATION', 'ONE_WAY', NULL, 'SEDAN', 1, '{"lat":11.35,"lng":77.726}', '{"lat":11.364,"lng":77.742}', 'DEMO: Periyar Taxi Sample Pickup', 'DEMO: Sample Destination, Erode', 81.0, 105, DATE_SUB(NOW(), INTERVAL 15 DAY), NULL, 'COMPLETED', @d1, @v1, '{"estimate":{"service":"OUTSTATION","tripMode":"ONE_WAY","distKm":81.0,"hours":1.75,"total":1113,"components":{"baseFare":1113,"extraKmFare":0,"extraHourFare":0,"boundaryCharge":0},"formula":"DEMO estimate; not a live Google Routes result"},"originalService":"OUTSTATION","demo":true}', 1113, 1301, 'PAID', NULL, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY), NULL, NULL, @admE, 'PT_DEMO_RIDE_03', '{"demo":true}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `rides` WHERE notes='PT_DEMO_RIDE_03');

SET @r3 := (SELECT `id` FROM `rides` WHERE notes='PT_DEMO_RIDE_03' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `ride_events` (`ride_id`, `actor_id`, `event`, `message`, `payload`, `created_at`, `updated_at`)
SELECT @r3, @admE, 'DEMO_IMPORTED', 'PT_DEMO_RIDE_03: imported sample event', '{"demo":true}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_events` WHERE ride_id=@r3 AND event='DEMO_IMPORTED');

INSERT INTO `ride_drivers` (`ride_id`, `driver_id`, `vehicle_id`, `status`, `created_at`, `updated_at`)
SELECT @r3, @d1, @v1, 'COMPLETED', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_drivers` WHERE ride_id=@r3 AND driver_id=@d1);

INSERT INTO `ride_offers` (`ride_id`, `driver_id`, `vehicle_id`, `expires_at`, `status`, `created_at`, `updated_at`)
SELECT @r3, @d1, @v1, DATE_SUB(NOW(), INTERVAL 15 DAY), 'EXPIRED', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_offers` WHERE ride_id=@r3 AND driver_id=@d1);

INSERT INTO `payments` (`ride_id`, `customer_id`, `collected_by`, `amount`, `method`, `status`, `provider_order_id`, `provider_payment_id`, `reconciled_at`, `notes`, `created_at`, `updated_at`)
SELECT @r3, @c1, @d1, 1301, 'CASH', 'SUCCESS', NULL, NULL, DATE_SUB(NOW(), INTERVAL 15 DAY), 'DEMO_CASH_r3', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `payments` WHERE notes='DEMO_CASH_r3');

INSERT INTO `reviews` (`ride_id`, `customer_id`, `rating`, `comment`, `created_at`, `updated_at`)
SELECT @r3, @c1, 5, 'DEMO review: helpful driver', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `reviews` WHERE ride_id=@r3);

INSERT INTO `rides` (`branch_id`, `customer_id`, `guest_name`, `guest_mobile`, `service`, `trip_mode`, `package_id`, `vehicle_type`, `required_drivers`, `pickup`, `dropoff`, `pickup_address`, `dropoff_address`, `distance_km`, `duration_minutes`, `scheduled_at`, `return_at`, `status`, `assigned_driver_id`, `vehicle_id`, `quote`, `estimated_fare`, `final_fare`, `payment_status`, `start_otp_hash`, `started_at`, `ended_at`, `cancelled_at`, `cancel_reason`, `created_by`, `notes`, `metadata`, `created_at`, `updated_at`)
SELECT @bE, @c2, NULL, NULL, 'OUTSTATION', 'ROUND_TRIP', NULL, 'SUV', 1, '{"lat":11.353,"lng":77.729}', '{"lat":11.367,"lng":77.745}', 'DEMO: Periyar Taxi Sample Pickup', 'DEMO: Sample Destination, Erode', 82.0, 190, DATE_SUB(NOW(), INTERVAL 16 DAY), NULL, 'COMPLETED', @d3, @v3, '{"estimate":{"service":"OUTSTATION","tripMode":"ROUND_TRIP","distKm":82.0,"hours":3.17,"total":2132,"components":{"baseFare":2132,"extraKmFare":0,"extraHourFare":0,"boundaryCharge":0},"formula":"DEMO estimate; not a live Google Routes result"},"originalService":"OUTSTATION","demo":true}', 2132, 2257, 'PAID', NULL, DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 16 DAY), NULL, NULL, @admE, 'PT_DEMO_RIDE_04', '{"demo":true}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `rides` WHERE notes='PT_DEMO_RIDE_04');

SET @r4 := (SELECT `id` FROM `rides` WHERE notes='PT_DEMO_RIDE_04' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `ride_events` (`ride_id`, `actor_id`, `event`, `message`, `payload`, `created_at`, `updated_at`)
SELECT @r4, @admE, 'DEMO_IMPORTED', 'PT_DEMO_RIDE_04: imported sample event', '{"demo":true}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_events` WHERE ride_id=@r4 AND event='DEMO_IMPORTED');

INSERT INTO `ride_drivers` (`ride_id`, `driver_id`, `vehicle_id`, `status`, `created_at`, `updated_at`)
SELECT @r4, @d3, @v3, 'COMPLETED', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_drivers` WHERE ride_id=@r4 AND driver_id=@d3);

INSERT INTO `payments` (`ride_id`, `customer_id`, `collected_by`, `amount`, `method`, `status`, `provider_order_id`, `provider_payment_id`, `reconciled_at`, `notes`, `created_at`, `updated_at`)
SELECT @r4, @c2, @d3, 2257, 'CASH', 'SUCCESS', NULL, NULL, DATE_SUB(NOW(), INTERVAL 16 DAY), 'DEMO_CASH_r4', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `payments` WHERE notes='DEMO_CASH_r4');

INSERT INTO `reviews` (`ride_id`, `customer_id`, `rating`, `comment`, `created_at`, `updated_at`)
SELECT @r4, @c2, 4, 'DEMO review: helpful driver', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `reviews` WHERE ride_id=@r4);

INSERT INTO `rides` (`branch_id`, `customer_id`, `guest_name`, `guest_mobile`, `service`, `trip_mode`, `package_id`, `vehicle_type`, `required_drivers`, `pickup`, `dropoff`, `pickup_address`, `dropoff_address`, `distance_km`, `duration_minutes`, `scheduled_at`, `return_at`, `status`, `assigned_driver_id`, `vehicle_id`, `quote`, `estimated_fare`, `final_fare`, `payment_status`, `start_otp_hash`, `started_at`, `ended_at`, `cancelled_at`, `cancel_reason`, `created_by`, `notes`, `metadata`, `created_at`, `updated_at`)
SELECT @bG, @c3, NULL, NULL, 'DRIVER_RENT', 'ONE_WAY', NULL, NULL, 1, '{"lat":11.356,"lng":77.732}', NULL, 'DEMO: Periyar Taxi Sample Pickup', NULL, 0, 360, DATE_SUB(NOW(), INTERVAL 17 DAY), NULL, 'COMPLETED', @d4, NULL, '{"estimate":{"service":"DRIVER_RENT","tripMode":"ONE_WAY","distKm":0,"hours":6.0,"total":700,"components":{"baseFare":700,"extraKmFare":0,"extraHourFare":0,"boundaryCharge":0},"formula":"DEMO estimate; not a live Google Routes result"},"originalService":"DRIVER_RENT","demo":true}', 700, 700, 'PAID', NULL, DATE_SUB(NOW(), INTERVAL 17 DAY), DATE_SUB(NOW(), INTERVAL 17 DAY), NULL, NULL, @admG, 'PT_DEMO_RIDE_05', '{"demo":true}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `rides` WHERE notes='PT_DEMO_RIDE_05');

SET @r5 := (SELECT `id` FROM `rides` WHERE notes='PT_DEMO_RIDE_05' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `ride_events` (`ride_id`, `actor_id`, `event`, `message`, `payload`, `created_at`, `updated_at`)
SELECT @r5, @admG, 'DEMO_IMPORTED', 'PT_DEMO_RIDE_05: imported sample event', '{"demo":true}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_events` WHERE ride_id=@r5 AND event='DEMO_IMPORTED');

INSERT INTO `ride_drivers` (`ride_id`, `driver_id`, `vehicle_id`, `status`, `created_at`, `updated_at`)
SELECT @r5, @d4, NULL, 'COMPLETED', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_drivers` WHERE ride_id=@r5 AND driver_id=@d4);

INSERT INTO `payments` (`ride_id`, `customer_id`, `collected_by`, `amount`, `method`, `status`, `provider_order_id`, `provider_payment_id`, `reconciled_at`, `notes`, `created_at`, `updated_at`)
SELECT @r5, @c3, @d4, 700, 'CASH', 'SUCCESS', NULL, NULL, DATE_SUB(NOW(), INTERVAL 17 DAY), 'DEMO_CASH_r5', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `payments` WHERE notes='DEMO_CASH_r5');

INSERT INTO `rides` (`branch_id`, `customer_id`, `guest_name`, `guest_mobile`, `service`, `trip_mode`, `package_id`, `vehicle_type`, `required_drivers`, `pickup`, `dropoff`, `pickup_address`, `dropoff_address`, `distance_km`, `duration_minutes`, `scheduled_at`, `return_at`, `status`, `assigned_driver_id`, `vehicle_id`, `quote`, `estimated_fare`, `final_fare`, `payment_status`, `start_otp_hash`, `started_at`, `ended_at`, `cancelled_at`, `cancel_reason`, `created_by`, `notes`, `metadata`, `created_at`, `updated_at`)
SELECT @bE, @c1, NULL, NULL, 'VALET', 'ONE_WAY', NULL, NULL, 2, '{"lat":11.359,"lng":77.735}', NULL, 'DEMO: Periyar Taxi Sample Pickup', NULL, 0, 240, DATE_SUB(NOW(), INTERVAL 18 DAY), NULL, 'COMPLETED', @d3, NULL, '{"estimate":{"service":"VALET","tripMode":"ONE_WAY","distKm":0,"hours":4.0,"total":1300,"components":{"baseFare":1300,"extraKmFare":0,"extraHourFare":0,"boundaryCharge":0},"formula":"DEMO estimate; not a live Google Routes result"},"originalService":"VALET","demo":true}', 1300, 1450, 'PAID', NULL, DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY), NULL, NULL, @admE, 'PT_DEMO_RIDE_06', '{"demo":true}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `rides` WHERE notes='PT_DEMO_RIDE_06');

SET @r6 := (SELECT `id` FROM `rides` WHERE notes='PT_DEMO_RIDE_06' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `ride_events` (`ride_id`, `actor_id`, `event`, `message`, `payload`, `created_at`, `updated_at`)
SELECT @r6, @admE, 'DEMO_IMPORTED', 'PT_DEMO_RIDE_06: imported sample event', '{"demo":true}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_events` WHERE ride_id=@r6 AND event='DEMO_IMPORTED');

INSERT INTO `ride_drivers` (`ride_id`, `driver_id`, `vehicle_id`, `status`, `created_at`, `updated_at`)
SELECT @r6, @d3, NULL, 'COMPLETED', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_drivers` WHERE ride_id=@r6 AND driver_id=@d3);

INSERT INTO `payments` (`ride_id`, `customer_id`, `collected_by`, `amount`, `method`, `status`, `provider_order_id`, `provider_payment_id`, `reconciled_at`, `notes`, `created_at`, `updated_at`)
SELECT @r6, @c1, @d3, 1450, 'CASH', 'SUCCESS', NULL, NULL, DATE_SUB(NOW(), INTERVAL 18 DAY), 'DEMO_CASH_r6', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `payments` WHERE notes='DEMO_CASH_r6');

INSERT INTO `rides` (`branch_id`, `customer_id`, `guest_name`, `guest_mobile`, `service`, `trip_mode`, `package_id`, `vehicle_type`, `required_drivers`, `pickup`, `dropoff`, `pickup_address`, `dropoff_address`, `distance_km`, `duration_minutes`, `scheduled_at`, `return_at`, `status`, `assigned_driver_id`, `vehicle_id`, `quote`, `estimated_fare`, `final_fare`, `payment_status`, `start_otp_hash`, `started_at`, `ended_at`, `cancelled_at`, `cancel_reason`, `created_by`, `notes`, `metadata`, `created_at`, `updated_at`)
SELECT @bE, @c2, NULL, NULL, 'LOCAL', 'ONE_WAY', NULL, 'MINI', 1, '{"lat":11.362,"lng":77.738}', '{"lat":11.376000000000001,"lng":77.754}', 'DEMO: Periyar Taxi Sample Pickup', 'DEMO: Sample Destination, Erode', 5, 20, DATE_SUB(NOW(), INTERVAL 19 DAY), NULL, 'CANCELLED', NULL, NULL, '{"estimate":{"service":"LOCAL","tripMode":"ONE_WAY","distKm":5,"hours":0.33,"total":142,"components":{"baseFare":142,"extraKmFare":0,"extraHourFare":0,"boundaryCharge":0},"formula":"DEMO estimate; not a live Google Routes result"},"originalService":"LOCAL","demo":true}', 142, NULL, 'UNPAID', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 19 DAY), 'DEMO - Customer cancelled', @admE, 'PT_DEMO_RIDE_07', '{"demo":true}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `rides` WHERE notes='PT_DEMO_RIDE_07');

SET @r7 := (SELECT `id` FROM `rides` WHERE notes='PT_DEMO_RIDE_07' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `ride_events` (`ride_id`, `actor_id`, `event`, `message`, `payload`, `created_at`, `updated_at`)
SELECT @r7, @admE, 'DEMO_IMPORTED', 'PT_DEMO_RIDE_07: imported sample event', '{"demo":true}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_events` WHERE ride_id=@r7 AND event='DEMO_IMPORTED');

INSERT INTO `rides` (`branch_id`, `customer_id`, `guest_name`, `guest_mobile`, `service`, `trip_mode`, `package_id`, `vehicle_type`, `required_drivers`, `pickup`, `dropoff`, `pickup_address`, `dropoff_address`, `distance_km`, `duration_minutes`, `scheduled_at`, `return_at`, `status`, `assigned_driver_id`, `vehicle_id`, `quote`, `estimated_fare`, `final_fare`, `payment_status`, `start_otp_hash`, `started_at`, `ended_at`, `cancelled_at`, `cancel_reason`, `created_by`, `notes`, `metadata`, `created_at`, `updated_at`)
SELECT @bG, @c3, NULL, NULL, 'LOCAL_PACKAGE', 'ONE_WAY', @pkg3, 'SEDAN', 1, '{"lat":11.364999999999998,"lng":77.741}', '{"lat":11.379,"lng":77.757}', 'DEMO: Periyar Taxi Sample Pickup', 'DEMO: Sample Destination, Erode', 28, 160, DATE_SUB(NOW(), INTERVAL 20 DAY), NULL, 'COMPLETED', @d4, @v4, '{"estimate":{"service":"LOCAL_PACKAGE","tripMode":"ONE_WAY","distKm":28,"hours":2.67,"total":792,"components":{"baseFare":792,"extraKmFare":0,"extraHourFare":0,"boundaryCharge":0},"formula":"DEMO estimate; not a live Google Routes result"},"originalService":"LOCAL_PACKAGE","demo":true}', 792, 792, 'PAID', NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY), NULL, NULL, @admG, 'PT_DEMO_RIDE_08', '{"demo":true}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `rides` WHERE notes='PT_DEMO_RIDE_08');

SET @r8 := (SELECT `id` FROM `rides` WHERE notes='PT_DEMO_RIDE_08' ORDER BY `id` ASC LIMIT 1);
INSERT INTO `ride_events` (`ride_id`, `actor_id`, `event`, `message`, `payload`, `created_at`, `updated_at`)
SELECT @r8, @admG, 'DEMO_IMPORTED', 'PT_DEMO_RIDE_08: imported sample event', '{"demo":true}', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_events` WHERE ride_id=@r8 AND event='DEMO_IMPORTED');

INSERT INTO `ride_drivers` (`ride_id`, `driver_id`, `vehicle_id`, `status`, `created_at`, `updated_at`)
SELECT @r8, @d4, @v4, 'COMPLETED', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_drivers` WHERE ride_id=@r8 AND driver_id=@d4);

INSERT INTO `payments` (`ride_id`, `customer_id`, `collected_by`, `amount`, `method`, `status`, `provider_order_id`, `provider_payment_id`, `reconciled_at`, `notes`, `created_at`, `updated_at`)
SELECT @r8, @c3, @d4, 792, 'CASH', 'SUCCESS', NULL, NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), 'DEMO_CASH_r8', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `payments` WHERE notes='DEMO_CASH_r8');

INSERT INTO `payments` (`ride_id`, `customer_id`, `collected_by`, `amount`, `method`, `status`, `provider_order_id`, `provider_payment_id`, `reconciled_at`, `notes`, `created_at`, `updated_at`)
SELECT @r7, @c2, NULL, 142, 'RAZORPAY', 'FAILED', 'DEMO_INVALID_NEVER_SEND', NULL, NULL, 'DEMO_FAILED_RAZORPAY_NOT_REAL', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `payments` WHERE notes='DEMO_FAILED_RAZORPAY_NOT_REAL');

INSERT INTO `ride_charges` (`ride_id`, `type`, `amount`, `note`, `created_by`, `approved_by`, `status`, `created_at`, `updated_at`)
SELECT @r1, 'PARKING', 20, 'DEMO_CHARGE_1', @admE, @admE, 'APPROVED', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_charges` WHERE note='DEMO_CHARGE_1');

INSERT INTO `ride_charges` (`ride_id`, `type`, `amount`, `note`, `created_by`, `approved_by`, `status`, `created_at`, `updated_at`)
SELECT @r3, 'TOLL', 188, 'DEMO_CHARGE_2', @admE, @admE, 'APPROVED', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_charges` WHERE note='DEMO_CHARGE_2');

INSERT INTO `ride_charges` (`ride_id`, `type`, `amount`, `note`, `created_by`, `approved_by`, `status`, `created_at`, `updated_at`)
SELECT @r4, 'DRIVER_BETA', 125, 'DEMO_CHARGE_3', @admE, @admE, 'APPROVED', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_charges` WHERE note='DEMO_CHARGE_3');

INSERT INTO `ride_charges` (`ride_id`, `type`, `amount`, `note`, `created_by`, `approved_by`, `status`, `created_at`, `updated_at`)
SELECT @r6, 'FOOD', 150, 'DEMO_CHARGE_4', @admE, @admE, 'APPROVED', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `ride_charges` WHERE note='DEMO_CHARGE_4');

INSERT INTO `attendance` (`user_id`, `branch_id`, `day`, `check_in_at`, `check_out_at`, `status`, `notes`, `created_at`, `updated_at`)
SELECT @d1, @bE, DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 'PRESENT', 'DEMO_ATTEND_d1_1', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `attendance` WHERE user_id=@d1 AND notes='DEMO_ATTEND_d1_1');

INSERT INTO `attendance` (`user_id`, `branch_id`, `day`, `check_in_at`, `check_out_at`, `status`, `notes`, `created_at`, `updated_at`)
SELECT @d1, @bE, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), 'PRESENT', 'DEMO_ATTEND_d1_2', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `attendance` WHERE user_id=@d1 AND notes='DEMO_ATTEND_d1_2');

INSERT INTO `attendance` (`user_id`, `branch_id`, `day`, `check_in_at`, `check_out_at`, `status`, `notes`, `created_at`, `updated_at`)
SELECT @d2, @bE, DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 'PRESENT', 'DEMO_ATTEND_d2_1', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `attendance` WHERE user_id=@d2 AND notes='DEMO_ATTEND_d2_1');

INSERT INTO `attendance` (`user_id`, `branch_id`, `day`, `check_in_at`, `check_out_at`, `status`, `notes`, `created_at`, `updated_at`)
SELECT @d2, @bE, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), 'PRESENT', 'DEMO_ATTEND_d2_2', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `attendance` WHERE user_id=@d2 AND notes='DEMO_ATTEND_d2_2');

INSERT INTO `attendance` (`user_id`, `branch_id`, `day`, `check_in_at`, `check_out_at`, `status`, `notes`, `created_at`, `updated_at`)
SELECT @d3, @bE, DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 'PRESENT', 'DEMO_ATTEND_d3_1', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `attendance` WHERE user_id=@d3 AND notes='DEMO_ATTEND_d3_1');

INSERT INTO `attendance` (`user_id`, `branch_id`, `day`, `check_in_at`, `check_out_at`, `status`, `notes`, `created_at`, `updated_at`)
SELECT @d3, @bE, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), 'PRESENT', 'DEMO_ATTEND_d3_2', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `attendance` WHERE user_id=@d3 AND notes='DEMO_ATTEND_d3_2');

INSERT INTO `attendance` (`user_id`, `branch_id`, `day`, `check_in_at`, `check_out_at`, `status`, `notes`, `created_at`, `updated_at`)
SELECT @d4, @bG, DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 'PRESENT', 'DEMO_ATTEND_d4_1', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `attendance` WHERE user_id=@d4 AND notes='DEMO_ATTEND_d4_1');

INSERT INTO `attendance` (`user_id`, `branch_id`, `day`, `check_in_at`, `check_out_at`, `status`, `notes`, `created_at`, `updated_at`)
SELECT @d4, @bG, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), 'PRESENT', 'DEMO_ATTEND_d4_2', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `attendance` WHERE user_id=@d4 AND notes='DEMO_ATTEND_d4_2');

INSERT INTO `attendance` (`user_id`, `branch_id`, `day`, `check_in_at`, `check_out_at`, `status`, `notes`, `created_at`, `updated_at`)
SELECT @admE, @bE, DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 'PRESENT', 'DEMO_ATTEND_admE_1', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `attendance` WHERE user_id=@admE AND notes='DEMO_ATTEND_admE_1');

INSERT INTO `attendance` (`user_id`, `branch_id`, `day`, `check_in_at`, `check_out_at`, `status`, `notes`, `created_at`, `updated_at`)
SELECT @admE, @bE, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), 'PRESENT', 'DEMO_ATTEND_admE_2', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `attendance` WHERE user_id=@admE AND notes='DEMO_ATTEND_admE_2');

INSERT INTO `attendance` (`user_id`, `branch_id`, `day`, `check_in_at`, `check_out_at`, `status`, `notes`, `created_at`, `updated_at`)
SELECT @admG, @bG, DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 'PRESENT', 'DEMO_ATTEND_admG_1', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `attendance` WHERE user_id=@admG AND notes='DEMO_ATTEND_admG_1');

INSERT INTO `attendance` (`user_id`, `branch_id`, `day`, `check_in_at`, `check_out_at`, `status`, `notes`, `created_at`, `updated_at`)
SELECT @admG, @bG, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), 'PRESENT', 'DEMO_ATTEND_admG_2', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `attendance` WHERE user_id=@admG AND notes='DEMO_ATTEND_admG_2');

INSERT INTO `payroll` (`user_id`, `branch_id`, `period`, `base_amount`, `incentives`, `deductions`, `net_amount`, `status`, `paid_at`, `notes`, `created_at`, `updated_at`)
SELECT @d1, @bE, '2026-10', 18000, 300, 0, 18300, 'DRAFT', NULL, 'DEMO_PAYROLL_d1', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `payroll` WHERE user_id=@d1 AND notes='DEMO_PAYROLL_d1');

INSERT INTO `payroll` (`user_id`, `branch_id`, `period`, `base_amount`, `incentives`, `deductions`, `net_amount`, `status`, `paid_at`, `notes`, `created_at`, `updated_at`)
SELECT @d2, @bE, '2026-10', 8500, 300, 0, 8800, 'DRAFT', NULL, 'DEMO_PAYROLL_d2', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `payroll` WHERE user_id=@d2 AND notes='DEMO_PAYROLL_d2');

INSERT INTO `payroll` (`user_id`, `branch_id`, `period`, `base_amount`, `incentives`, `deductions`, `net_amount`, `status`, `paid_at`, `notes`, `created_at`, `updated_at`)
SELECT @d3, @bE, '2026-10', 20500, 300, 0, 20800, 'DRAFT', NULL, 'DEMO_PAYROLL_d3', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `payroll` WHERE user_id=@d3 AND notes='DEMO_PAYROLL_d3');

INSERT INTO `payroll` (`user_id`, `branch_id`, `period`, `base_amount`, `incentives`, `deductions`, `net_amount`, `status`, `paid_at`, `notes`, `created_at`, `updated_at`)
SELECT @d4, @bG, '2026-10', 19000, 300, 0, 19300, 'DRAFT', NULL, 'DEMO_PAYROLL_d4', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `payroll` WHERE user_id=@d4 AND notes='DEMO_PAYROLL_d4');

INSERT INTO `payroll` (`user_id`, `branch_id`, `period`, `base_amount`, `incentives`, `deductions`, `net_amount`, `status`, `paid_at`, `notes`, `created_at`, `updated_at`)
SELECT @admE, @bE, '2026-10', 26000, 300, 0, 26300, 'DRAFT', NULL, 'DEMO_PAYROLL_admE', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `payroll` WHERE user_id=@admE AND notes='DEMO_PAYROLL_admE');

INSERT INTO `payroll` (`user_id`, `branch_id`, `period`, `base_amount`, `incentives`, `deductions`, `net_amount`, `status`, `paid_at`, `notes`, `created_at`, `updated_at`)
SELECT @admG, @bG, '2026-10', 25000, 300, 0, 25300, 'DRAFT', NULL, 'DEMO_PAYROLL_admG', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `payroll` WHERE user_id=@admG AND notes='DEMO_PAYROLL_admG');

INSERT INTO `expenses` (`branch_id`, `vehicle_id`, `driver_id`, `category`, `description`, `amount`, `expense_date`, `created_by`, `created_at`, `updated_at`)
SELECT @bE, @v1, @d1, 'FUEL', 'DEMO_EXPENSE_1 (sample)', 1800, DATE_SUB(CURDATE(), INTERVAL 4 DAY), @admE, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `expenses` WHERE description LIKE 'DEMO_EXPENSE_1%');

INSERT INTO `expenses` (`branch_id`, `vehicle_id`, `driver_id`, `category`, `description`, `amount`, `expense_date`, `created_by`, `created_at`, `updated_at`)
SELECT @bE, @v2, @d2, 'VEHICLE_SERVICE', 'DEMO_EXPENSE_2 (sample)', 2200, DATE_SUB(CURDATE(), INTERVAL 5 DAY), @admE, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `expenses` WHERE description LIKE 'DEMO_EXPENSE_2%');

INSERT INTO `expenses` (`branch_id`, `vehicle_id`, `driver_id`, `category`, `description`, `amount`, `expense_date`, `created_by`, `created_at`, `updated_at`)
SELECT @bE, @v3, @d3, 'INSURANCE', 'DEMO_EXPENSE_3 (sample)', 4000, DATE_SUB(CURDATE(), INTERVAL 6 DAY), @admE, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `expenses` WHERE description LIKE 'DEMO_EXPENSE_3%');

INSERT INTO `expenses` (`branch_id`, `vehicle_id`, `driver_id`, `category`, `description`, `amount`, `expense_date`, `created_by`, `created_at`, `updated_at`)
SELECT @bG, @v4, @d4, 'CLEANING', 'DEMO_EXPENSE_4 (sample)', 500, DATE_SUB(CURDATE(), INTERVAL 7 DAY), @admG, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `expenses` WHERE description LIKE 'DEMO_EXPENSE_4%');

INSERT INTO `audit_logs` (`actor_id`, `action`, `entity`, `entity_id`, `before`, `after`, `ip`, `created_at`, `updated_at`)
SELECT @admE, 'DEMO_DATA_CREATED', 'Branch', 'DEMO_1', NULL, '{"code":"DEMO_ERODE"}', '127.0.0.1', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `audit_logs` WHERE action='DEMO_DATA_CREATED' AND entity_id='DEMO_1');

INSERT INTO `audit_logs` (`actor_id`, `action`, `entity`, `entity_id`, `before`, `after`, `ip`, `created_at`, `updated_at`)
SELECT @admE, 'DEMO_VEHICLE_SAMPLE', 'Vehicle', 'DEMO_2', NULL, '{"registration":"DEMO-TN33-SEDAN"}', '127.0.0.1', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `audit_logs` WHERE action='DEMO_VEHICLE_SAMPLE' AND entity_id='DEMO_2');

INSERT INTO `audit_logs` (`actor_id`, `action`, `entity`, `entity_id`, `before`, `after`, `ip`, `created_at`, `updated_at`)
SELECT @admG, 'DEMO_DATA_CREATED', 'Branch', 'DEMO_3', NULL, '{"code":"DEMO_GOBI"}', '127.0.0.1', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `audit_logs` WHERE action='DEMO_DATA_CREATED' AND entity_id='DEMO_3');

INSERT INTO `notifications` (`user_id`, `title`, `body`, `data`, `read_at`, `created_at`, `updated_at`)
SELECT @admE, 'DEMO: Fleet certificate check', 'Synthetic example notification', '{"demo":true}', NULL, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `notifications` WHERE user_id=@admE AND title='DEMO: Fleet certificate check');

INSERT INTO `notifications` (`user_id`, `title`, `body`, `data`, `read_at`, `created_at`, `updated_at`)
SELECT @d1, 'DEMO: Duty reminder', 'Test-only, no real dispatch', '{"demo":true}', NULL, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `notifications` WHERE user_id=@d1 AND title='DEMO: Duty reminder');

INSERT INTO `notifications` (`user_id`, `title`, `body`, `data`, `read_at`, `created_at`, `updated_at`)
SELECT @c1, 'DEMO: Sample completed booking', 'Demonstration message', '{"demo":true}', NULL, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `notifications` WHERE user_id=@c1 AND title='DEMO: Sample completed booking');

INSERT INTO `fcm_devices` (`user_id`, `token`, `platform`, `created_at`, `updated_at`)
SELECT @c1, 'DEMO_INERT_NOT_REAL_FCM_TOKEN_0000000000', 'DEMO', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `fcm_devices` WHERE token='DEMO_INERT_NOT_REAL_FCM_TOKEN_0000000000');

INSERT INTO `otps` (`mobile`, `code_hash`, `expires_at`, `attempts`, `used_at`, `created_at`, `updated_at`)
SELECT '0000000000', 'DEMO_DISABLED_EXPIRED_NO_AUTH', DATE_SUB(NOW(), INTERVAL 20 DAY), 99, DATE_SUB(NOW(), INTERVAL 19 DAY), NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `otps` WHERE mobile='0000000000' AND code_hash='DEMO_DISABLED_EXPIRED_NO_AUTH');

INSERT INTO `saved_places` (`user_id`, `label`, `address`, `lat`, `lng`, `created_at`, `updated_at`)
SELECT @c1, 'DEMO Home', 'DEMO Home, sample Tamil Nadu address', 11.341, 77.717, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `saved_places` WHERE user_id=@c1 AND label='DEMO Home');

INSERT INTO `saved_places` (`user_id`, `label`, `address`, `lat`, `lng`, `created_at`, `updated_at`)
SELECT @c2, 'DEMO Office', 'DEMO Office, sample Tamil Nadu address', 11.351, 77.725, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `saved_places` WHERE user_id=@c2 AND label='DEMO Office');

INSERT INTO `saved_places` (`user_id`, `label`, `address`, `lat`, `lng`, `created_at`, `updated_at`)
SELECT @c3, 'DEMO Bus Stand', 'DEMO Bus Stand, sample Tamil Nadu address', 11.455, 77.444, NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `saved_places` WHERE user_id=@c3 AND label='DEMO Bus Stand');

COMMIT;
-- Result counts (every model table can now have at least one row):
-- SELECT 'demo_branches' label,COUNT(*) cnt FROM branches WHERE code LIKE 'DEMO_%';
-- SELECT 'demo_pricing' label,COUNT(*) cnt FROM pricing_rules WHERE branch_id IN (SELECT id FROM branches WHERE code LIKE 'DEMO_%');
-- SELECT 'demo_vehicles' label,COUNT(*) cnt FROM vehicles WHERE registration LIKE 'DEMO-%';
-- SELECT 'demo_rides' label,COUNT(*) cnt FROM rides WHERE notes LIKE 'PT_DEMO_RIDE_%';
