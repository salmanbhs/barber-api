# 🔍 Step-by-Step Debug for Wednesday 11:00 Issue

## Your Request:
```json
{
    "barber_id": "75cc9f55-0e9c-4633-84ca-b503b4092219",
    "service_id": "7dbb7025-edf7-4cbf-b1d6-eb70d1d8569c", 
    "appointment_date": "2025-09-10",
    "appointment_time": "11:00"
}
```

## Error:
```json
{
    "error": "Selected time slot is not available - Shop is closed on Wednesday at 11:00. Check working hours."
}
```

## Debug Commands (Run These):

### 1. Check Current Working Hours
```bash
curl "http://localhost:3000/api/company/working-hours"
```

### 2. Debug This Specific Time
```bash
curl "http://localhost:3000/api/booking/debug-availability?datetime=2025-09-10T11:00:00.000Z"
```

### 3. Check Company Config
```bash
curl "http://localhost:3000/api/company/config"
```

## Expected Results vs Issue:

### Wednesday Should Be:
```json
{
  "wednesday": {
    "isOpen": true,
    "shifts": [
      {"start": "09:00", "end": "12:00"},  // 11:00 should be in this range!
      {"start": "16:00", "end": "20:00"}
    ]
  }
}
```

### 11:00 Should Pass Because:
- ✅ 11:00 is between 09:00 and 12:00 
- ✅ Wednesday should be open
- ✅ It's September 10, 2025 (future date)

## Possible Fixes:

### Fix 1: Database RPC Function Missing
Run this in **Supabase SQL Editor**:
```sql
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

### Fix 2: Reset Working Hours
If working hours are corrupted:
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

### Fix 3: Test Valid Booking After Fix
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "barber_id": "75cc9f55-0e9c-4633-84ca-b503b4092219",
    "service_id": "7dbb7025-edf7-4cbf-b1d6-eb70d1d8569c",
    "appointment_date": "2025-09-10",
    "appointment_time": "11:00"
  }'
```

## Next Steps:
1. Run the debug commands above
2. Share the output from the working hours and debug availability endpoints
3. Apply the appropriate fix based on what we find
4. Test the booking again

The most likely issue is that the `is_shop_open` database function is either missing or has a bug with day name parsing.
