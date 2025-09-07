# 🔍 Debug Wednesday 11:00 AM Issue

## Step 1: Check Current Working Hours Configuration

```bash
curl "http://localhost:3000/api/company/working-hours"
```

This should show you the current working hours configuration. Look for the `wednesday` entry.

## Step 2: Debug the Specific Time Slot

```bash
# Debug Wednesday 11:00 AM specifically
curl "http://localhost:3000/api/booking/debug-availability?datetime=2025-09-10T11:00:00.000Z"
```

This will show you:
- Whether advance hours check passes
- Whether shop open check passes  
- Day schedule for Wednesday
- Exact time validation

## Step 3: Check Company Config Directly

```bash
curl "http://localhost:3000/api/company/config"
```

## Step 4: Test the Database RPC Function

Let me add a test to see if the RPC function exists and works:

```bash
# Check if the RPC function exists in your database
# Run this in Supabase SQL Editor:
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'is_shop_open';
```

## Step 5: Expected vs Actual Results

### Expected Working Hours (Default):
```json
{
  "wednesday": {
    "isOpen": true,
    "shifts": [
      {"start": "09:00", "end": "12:00"},
      {"start": "16:00", "end": "20:00"}
    ]
  }
}
```

### 11:00 AM Should Pass Because:
- 11:00 is between 09:00 and 12:00 ✅
- Wednesday should be open ✅
- It's more than 1 hour from now ✅

## Possible Issues:

### Issue 1: RPC Function Missing
If the `is_shop_open` RPC function doesn't exist, add it to your database:

```sql
-- Run this in Supabase SQL Editor
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
    
    -- Get day name
    day_name := LOWER(TO_CHAR(check_datetime, 'Day'));
    day_name := TRIM(day_name);
    
    -- Get day configuration
    day_config := config_row.working_hours->day_name;
    
    -- If day config doesn't exist or shop is closed, return false
    IF day_config IS NULL OR (day_config->>'isOpen')::BOOLEAN = false THEN
        RETURN false;
    END IF;
    
    -- Get time part
    check_time := check_datetime::TIME;
    
    -- Check if time falls within any shift
    FOR shift IN SELECT * FROM jsonb_array_elements(day_config->'shifts')
    LOOP
        IF check_time >= (shift->>'start')::TIME AND check_time <= (shift->>'end')::TIME THEN
            RETURN true;
        END IF;
    END LOOP;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Issue 2: Timezone Conversion Problem
The issue might be timezone-related. Let's check:

```bash
# Check what day/time the system thinks it is
curl "http://localhost:3000/api/booking/debug-availability?datetime=2025-09-10T11:00:00.000Z" | jq '.data.debug_info'
```

### Issue 3: Working Hours Not Set Correctly
If working hours are wrong, fix them:

```bash
curl -X PUT "http://localhost:3000/api/company/working-hours" \
  -H "Content-Type: application/json" \
  -d '{
    "working_hours": {
      "monday": {"isOpen": true, "shifts": [{"start": "09:00", "end": "12:00"}, {"start": "16:00", "end": "20:00"}]},
      "tuesday": {"isOpen": true, "shifts": [{"start": "09:00", "end": "12:00"}, {"start": "16:00", "end": "20:00"}]},
      "wednesday": {"isOpen": true, "shifts": [{"start": "09:00", "end": "12:00"}, {"start": "16:00", "end": "20:00"}]},
      "thursday": {"isOpen": true, "shifts": [{"start": "09:00", "end": "12:00"}, {"start": "16:00", "end": "20:00"}]},
      "friday": {"isOpen": true, "shifts": [{"start": "09:00", "end": "12:00"}, {"start": "16:00", "end": "20:00"}]},
      "saturday": {"isOpen": true, "shifts": [{"start": "09:00", "end": "18:00"}]},
      "sunday": {"isOpen": false, "shifts": []}
    }
  }'
```

## Quick Test Commands:

```bash
# 1. Check working hours
curl "http://localhost:3000/api/company/working-hours"

# 2. Debug Wednesday 11 AM
curl "http://localhost:3000/api/booking/debug-availability?datetime=2025-09-10T11:00:00.000Z"

# 3. Try a valid booking after confirming it should work
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "service_id": "your-service-id",
    "barber_id": "your-barber-id", 
    "appointment_date": "2025-09-10",
    "appointment_time": "11:00",
    "notes": "Test Wednesday 11 AM"
  }'
```

Run these commands and share the output - this will help us identify exactly what's going wrong! 🔍
