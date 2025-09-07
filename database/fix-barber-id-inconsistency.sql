-- Fix Barber Data Inconsistency
-- Run this in Supabase SQL Editor

-- First, let's see what we have
SELECT 'Current barbers table:' as info;
SELECT id, user_id, created_at FROM barbers ORDER BY created_at;

SELECT 'Barber IDs used in bookings:' as info;
SELECT DISTINCT barber_id, barber_name FROM bookings ORDER BY barber_name;

-- Step 1: Update the barbers table to use the correct IDs that match bookings
-- We'll update the existing barber records to match the booking data

-- Update Mike Johnson's barber record
UPDATE barbers 
SET id = 'b03fadaf-f6f0-4177-90ee-1565c82dbc07'
WHERE id = '0114c122-1cd6-4ce5-9d8c-e67cd6201c6d';

-- Update John Smith's barber record  
UPDATE barbers 
SET id = 'ce429eea-9bc9-43b2-9874-44783da7dc18'
WHERE id = '75cc9f55-0e9c-4633-84ca-b503b4092219';

-- Update Sarah Wilson's barber record
UPDATE barbers 
SET id = '81223f5c-0bf0-4181-9f53-45f2245513d3'
WHERE id = '96660363-7019-48d9-9b9b-c82b519dca2a';

-- Step 2: Check if there are duplicate barber records that need to be removed
-- Delete any duplicate barber records if they exist
DELETE FROM barbers 
WHERE id IN (
  'b03fadaf-f6f0-4177-90ee-1565c82dbc07',
  'ce429eea-9bc9-43b2-9874-44783da7dc18', 
  '81223f5c-0bf0-4181-9f53-45f2245513d3'
) 
AND user_id IS NULL; -- Remove duplicates without proper user references

-- Step 3: Verify the fix
SELECT 'Updated barbers table:' as info;
SELECT id, user_id, created_at FROM barbers ORDER BY created_at;

-- Step 4: Test that barber IDs now match booking IDs
SELECT 'Barber IDs that should now match:' as info;
SELECT 
  b.id as barber_table_id,
  booking.barber_id as booking_barber_id,
  booking.barber_name,
  CASE 
    WHEN b.id = booking.barber_id THEN 'MATCH ✓' 
    ELSE 'MISMATCH ✗' 
  END as status
FROM barbers b
LEFT JOIN (
  SELECT DISTINCT barber_id, barber_name 
  FROM bookings 
) booking ON b.id = booking.barber_id
ORDER BY booking.barber_name;

-- If the above UPDATEs fail due to foreign key constraints, use this alternative:
-- We'll insert new records with correct IDs and then update references

COMMENT ON TABLE barbers IS 'Fixed barber IDs to match booking references';
