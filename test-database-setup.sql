// Quick SQL Test for Booking System
// Copy and paste this into Supabase SQL Editor

-- Test the booking system setup
-- Run this AFTER running add-company-config-table.sql, add-services-table.sql, and add-bookings-table.sql

-- 1. Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('company_config', 'services', 'customers', 'bookings')
ORDER BY table_name;

-- 2. Check if we have company config
SELECT company_name, currency, booking_advance_hours, time_slot_interval 
FROM company_config 
WHERE is_active = true;

-- 3. Check if we have services
SELECT id, name, price, duration_minutes, category 
FROM services 
WHERE is_active = true 
ORDER BY category, name;

-- 4. Test get_available_time_slots function
SELECT slot_time, slot_datetime, is_available 
FROM get_available_time_slots('2025-09-08', 30) 
LIMIT 10;

-- 5. Test shop open function
SELECT is_shop_open(NOW()) as is_currently_open;

-- 6. Test booking conflict function (should return false for no conflict)
SELECT check_booking_conflict('2025-09-08 10:00:00+00', 30) as has_conflict;

-- If all these queries work without errors, your booking system is ready! 🎉
