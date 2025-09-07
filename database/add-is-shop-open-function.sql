-- Add is_shop_open RPC Function to Database
-- Run this in Supabase SQL Editor if the function doesn't exist

-- Drop existing function first if it exists
DROP FUNCTION IF EXISTS is_shop_open(timestamp with time zone);

CREATE OR REPLACE FUNCTION is_shop_open(check_datetime TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN AS $$
DECLARE
    config_row company_config%ROWTYPE;
    day_name TEXT;
    day_config JSONB;
    check_time TIME;
    shift JSONB;
BEGIN
    -- Get company config
    SELECT * INTO config_row FROM company_config WHERE is_active = true LIMIT 1;
    
    IF config_row IS NULL THEN
        RETURN false;
    END IF;
    
    -- Get day name (handle different locales)
    day_name := LOWER(TO_CHAR(check_datetime, 'Day'));
    day_name := TRIM(day_name);
    
    -- Debug log (you can remove this later)
    RAISE NOTICE 'Checking day: %, time: %', day_name, check_datetime::TIME;
    
    -- Get day configuration
    day_config := config_row.working_hours->day_name;
    
    -- Debug log
    RAISE NOTICE 'Day config: %', day_config;
    
    -- If day config doesn't exist or shop is closed, return false
    IF day_config IS NULL OR (day_config->>'isOpen')::BOOLEAN = false THEN
        RAISE NOTICE 'Shop is closed on %', day_name;
        RETURN false;
    END IF;
    
    -- Get time part
    check_time := check_datetime::TIME;
    
    -- Check if time falls within any shift
    FOR shift IN SELECT * FROM jsonb_array_elements(day_config->'shifts')
    LOOP
        RAISE NOTICE 'Checking shift: % <= % <= %', (shift->>'start')::TIME, check_time, (shift->>'end')::TIME;
        
        IF check_time >= (shift->>'start')::TIME AND check_time <= (shift->>'end')::TIME THEN
            RAISE NOTICE 'Time is within shift!';
            RETURN true;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Time is outside all shifts';
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT is_shop_open('2025-09-10T11:00:00.000Z'::TIMESTAMP WITH TIME ZONE) as wednesday_11am_result;
