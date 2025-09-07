# 🕐 Quick Valid Booking Times Test

Based on the debug logs, the issue is that you're trying to book at times when the shop is closed. Here are some valid times to test:

## ✅ Valid Booking Times (based on default config)

### Weekdays (Monday-Friday): 9:00-12:00 and 16:00-20:00
```bash
# Monday 10:00 AM (within morning shift)
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "service_id": "YOUR_SERVICE_ID",
    "barber_id": "YOUR_BARBER_ID", 
    "appointment_date": "2025-09-08",
    "appointment_time": "10:00",
    "notes": "Test booking"
  }'

# Monday 6:00 PM (within evening shift)  
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "service_id": "YOUR_SERVICE_ID",
    "barber_id": "YOUR_BARBER_ID",
    "appointment_date": "2025-09-08", 
    "appointment_time": "18:00",
    "notes": "Test booking"
  }'
```

### Saturday: 9:00-18:00
```bash
# Saturday 2:00 PM
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "service_id": "YOUR_SERVICE_ID",
    "barber_id": "YOUR_BARBER_ID",
    "appointment_date": "2025-09-13",
    "appointment_time": "14:00", 
    "notes": "Test booking"
  }'
```

## ❌ Invalid Times You Tried

- **8:00 AM on Sunday/Monday**: Shop opens at 9:00 AM
- **Sunday**: Shop is closed on Sundays by default

## 🔍 Debug Valid Times First

```bash
# Test Monday 10 AM (should work)
curl "http://localhost:3000/api/booking/debug-availability?datetime=2025-09-08T10:00:00.000Z"

# Test Monday 6 PM (should work)
curl "http://localhost:3000/api/booking/debug-availability?datetime=2025-09-08T18:00:00.000Z"

# Test Saturday 2 PM (should work)
curl "http://localhost:3000/api/booking/debug-availability?datetime=2025-09-13T14:00:00.000Z"
```

## 📅 Date Conversion Helper

Your logs show you're testing:
- `2025-09-08T08:00:00.000Z` = Monday 8:00 AM ❌ (too early)
- `2025-09-09T08:00:00.000Z` = Tuesday 8:00 AM ❌ (too early)

Try these instead:
- `2025-09-08T10:00:00.000Z` = Monday 10:00 AM ✅
- `2025-09-08T18:00:00.000Z` = Monday 6:00 PM ✅
- `2025-09-09T11:00:00.000Z` = Tuesday 11:00 AM ✅

## 🛠️ Quick Fix: Adjust Working Hours

If you want to allow 8:00 AM bookings, update the working hours:

```bash
curl -X PUT http://localhost:3000/api/company/working-hours \
  -H "Content-Type: application/json" \
  -d '{
    "monday": {"isOpen": true, "shifts": [{"start": "08:00", "end": "20:00"}]},
    "tuesday": {"isOpen": true, "shifts": [{"start": "08:00", "end": "20:00"}]}
  }'
```
