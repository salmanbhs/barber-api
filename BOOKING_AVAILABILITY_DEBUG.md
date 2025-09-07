# 🔍 Booking Availability Troubleshooting Guide

## Error: "Selected time slot is not available"

This error occurs when the `canBookAtTime` function returns false. Here's how to debug it:

## 🧪 Step 1: Debug the Availability Check

Use the debug endpoint to see exactly why the booking is failing:

```bash
# Test availability for a specific datetime
curl "http://localhost:3000/api/booking/debug-availability?datetime=2025-09-08T10:00:00.000Z"
```

This will return detailed information about:
- Advance booking hours check
- Shop opening hours
- Day schedule configuration
- All validation steps

## 🕐 Step 2: Common Issues

### Issue 1: Advance Booking Hours
**Problem**: Booking too close to current time
**Solution**: Book at least 1 hour in advance (configurable)

```bash
# Check current time vs booking time
curl "http://localhost:3000/api/booking/debug-availability?datetime=2025-09-07T15:30:00.000Z"
```

### Issue 2: Shop Closed
**Problem**: Booking outside working hours
**Default Hours**: 9:00-12:00, 16:00-20:00 (Mon-Fri), 9:00-18:00 (Sat), Closed (Sun)

```bash
# Check working hours
curl "http://localhost:3000/api/company/config"
```

### Issue 3: Wrong Date Format
**Problem**: Invalid datetime string
**Correct Format**: `2025-09-08T10:00:00.000Z` (ISO 8601)

### Issue 4: Missing Database Function
**Problem**: `is_shop_open` RPC function doesn't exist in database
**Solution**: The code now has a fallback method

## 🔧 Step 3: Fix Common Issues

### Fix 1: Update Advance Booking Hours
```bash
curl -X PUT "http://localhost:3000/api/company/config" \
  -H "Content-Type: application/json" \
  -d '{"booking_advance_hours": 0.5}'  # 30 minutes instead of 1 hour
```

### Fix 2: Check Working Hours
```bash
# Get current working hours
curl "http://localhost:3000/api/company/working-hours"

# Update working hours if needed
curl -X PUT "http://localhost:3000/api/company/working-hours" \
  -H "Content-Type: application/json" \
  -d '{
    "monday": {"isOpen": true, "shifts": [{"start": "09:00", "end": "18:00"}]},
    "tuesday": {"isOpen": true, "shifts": [{"start": "09:00", "end": "18:00"}]}
  }'
```

## 📝 Step 4: Test Valid Booking Times

### Example Valid Times (assuming default config):
```bash
# Monday 10:00 AM (within 9:00-12:00 shift)
curl "http://localhost:3000/api/booking/debug-availability?datetime=2025-09-08T10:00:00.000Z"

# Monday 6:00 PM (within 16:00-20:00 shift)  
curl "http://localhost:3000/api/booking/debug-availability?datetime=2025-09-08T18:00:00.000Z"

# Saturday 2:00 PM (within 9:00-18:00 shift)
curl "http://localhost:3000/api/booking/debug-availability?datetime=2025-09-13T14:00:00.000Z"
```

### Example Invalid Times:
```bash
# Sunday (shop closed)
curl "http://localhost:3000/api/booking/debug-availability?datetime=2025-09-14T10:00:00.000Z"

# Monday 1:00 PM (between shifts - closed)
curl "http://localhost:3000/api/booking/debug-availability?datetime=2025-09-08T13:00:00.000Z"

# Monday 9:00 PM (after closing)
curl "http://localhost:3000/api/booking/debug-availability?datetime=2025-09-08T21:00:00.000Z"
```

## 🚀 Step 5: Create Valid Booking

Once you find a valid time slot:

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "service_id": "your-service-id",
    "barber_id": "your-barber-id",
    "appointment_date": "2025-09-08",
    "appointment_time": "10:00",
    "notes": "Test booking"
  }'
```

## 📊 Debug Output Example

The debug endpoint will show something like this:

```json
{
  "success": true,
  "data": {
    "requested_datetime": "2025-09-08T10:00:00.000Z",
    "current_datetime": "2025-09-07T14:30:00.000Z",
    "hours_until_booking": 19.5,
    "advance_hours_required": 1,
    "advance_hours_check": true,
    "day_name": "monday",
    "day_schedule": {
      "isOpen": true,
      "shifts": [
        {"start": "09:00", "end": "12:00"},
        {"start": "16:00", "end": "20:00"}
      ]
    },
    "is_shop_open": true,
    "can_book": true
  }
}
```

Use this information to identify exactly why your booking is failing! 🎯
