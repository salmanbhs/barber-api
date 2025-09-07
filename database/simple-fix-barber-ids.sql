-- Simple Fix: Update barbers table IDs to match their user_id
-- This aligns with how bookings are referencing barbers

-- The issue is that bookings use user_id as barber_id, but the barbers table has different IDs

-- Step 1: Update barber IDs to match their user_id
UPDATE barbers SET id = user_id WHERE id != user_id;

-- Step 2: Verify the fix
SELECT 
  'After fix - barber.id should equal barber.user_id:' as info,
  id as barber_id,
  user_id,
  CASE WHEN id = user_id THEN 'MATCH ✓' ELSE 'MISMATCH ✗' END as status
FROM barbers;

-- Step 3: Check that barber IDs now match booking references
SELECT 
  'Barbers that have bookings:' as info,
  b.id as barber_table_id,
  u.name as barber_name,
  COUNT(bookings.id) as booking_count
FROM barbers b
LEFT JOIN users u ON b.user_id = u.id  
LEFT JOIN bookings ON b.id = bookings.barber_id
GROUP BY b.id, u.name
HAVING COUNT(bookings.id) > 0
ORDER BY u.name;

COMMENT ON TABLE barbers IS 'Fixed: barber.id now equals user_id to match booking references';
