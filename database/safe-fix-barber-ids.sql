-- Safe Fix for Barber ID Inconsistency
-- Run this in Supabase SQL Editor

-- Option 1: If the UPDATE approach fails, use this insert/delete approach

-- Step 1: Insert new barber records with the correct IDs from bookings
-- Mike Johnson
INSERT INTO barbers (
  id, 
  user_id, 
  specialties, 
  experience_years, 
  rating, 
  bio, 
  profile_image_url, 
  hire_date,
  is_active,
  created_at,
  updated_at
) 
SELECT 
  'b03fadaf-f6f0-4177-90ee-1565c82dbc07' as id,
  user_id,
  specialties,
  experience_years,
  rating,
  bio,
  profile_image_url,
  hire_date,
  is_active,
  created_at,
  NOW() as updated_at
FROM barbers 
WHERE id = '0114c122-1cd6-4ce5-9d8c-e67cd6201c6d'
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  specialties = EXCLUDED.specialties,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  bio = EXCLUDED.bio,
  updated_at = NOW();

-- John Smith  
INSERT INTO barbers (
  id, 
  user_id, 
  specialties, 
  experience_years, 
  rating, 
  bio, 
  profile_image_url, 
  hire_date,
  is_active,
  created_at,
  updated_at
) 
SELECT 
  'ce429eea-9bc9-43b2-9874-44783da7dc18' as id,
  user_id,
  specialties,
  experience_years,
  rating,
  bio,
  profile_image_url,
  hire_date,
  is_active,
  created_at,
  NOW() as updated_at
FROM barbers 
WHERE id = '75cc9f55-0e9c-4633-84ca-b503b4092219'
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  specialties = EXCLUDED.specialties,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  bio = EXCLUDED.bio,
  updated_at = NOW();

-- Sarah Wilson
INSERT INTO barbers (
  id, 
  user_id, 
  specialties, 
  experience_years, 
  rating, 
  bio, 
  profile_image_url, 
  hire_date,
  is_active,
  created_at,
  updated_at
) 
SELECT 
  '81223f5c-0bf0-4181-9f53-45f2245513d3' as id,
  user_id,
  specialties,
  experience_years,
  rating,
  bio,
  profile_image_url,
  hire_date,
  is_active,
  created_at,
  NOW() as updated_at
FROM barbers 
WHERE id = '96660363-7019-48d9-9b9b-c82b519dca2a'
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  specialties = EXCLUDED.specialties,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  bio = EXCLUDED.bio,
  updated_at = NOW();

-- Step 2: Delete the old barber records (after verifying the new ones work)
-- DELETE FROM barbers WHERE id = '0114c122-1cd6-4ce5-9d8c-e67cd6201c6d';
-- DELETE FROM barbers WHERE id = '75cc9f55-0e9c-4633-84ca-b503b4092219';  
-- DELETE FROM barbers WHERE id = '96660363-7019-48d9-9b9b-c82b519dca2a';

-- Step 3: Verify the fix
SELECT 'Verification - Barber IDs now match bookings:' as info;
SELECT 
  b.id as barber_id,
  u.name as barber_name,
  COUNT(bookings.id) as booking_count
FROM barbers b
LEFT JOIN users u ON b.user_id = u.id
LEFT JOIN bookings ON b.id = bookings.barber_id
GROUP BY b.id, u.name
ORDER BY u.name;

COMMENT ON TABLE barbers IS 'Barber IDs now consistent with booking references';
