-- 🔍 DATABASE CHECK SCRIPT
-- Run this to verify your database setup

-- Check if tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('barbers', 'services', 'bookings', 'business_hours', 'barber_availability')
ORDER BY table_name;

-- Check sample data counts
SELECT 'barbers' as table_name, COUNT(*) as record_count FROM barbers
UNION ALL
SELECT 'services' as table_name, COUNT(*) as record_count FROM services  
UNION ALL
SELECT 'bookings' as table_name, COUNT(*) as record_count FROM bookings
UNION ALL
SELECT 'business_hours' as table_name, COUNT(*) as record_count FROM business_hours
UNION ALL
SELECT 'barber_availability' as table_name, COUNT(*) as record_count FROM barber_availability;

-- Show sample barbers
SELECT id, name, specialties, rating FROM barbers LIMIT 3;

-- Show sample services  
SELECT id, name, duration, price, category FROM services LIMIT 6;
