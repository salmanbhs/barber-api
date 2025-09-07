# Test Barber IDs for Booking

## Get Available Barbers

```bash
# Get all barbers with their IDs
curl "http://localhost:3000/api/barbers"
```

## Expected Response Format:
```json
{
  "success": true,
  "data": [
    {
      "id": "barber-uuid-here",
      "user_id": "user-uuid-here", 
      "specialties": ["Haircut", "Beard Trim"],
      "experience_years": 5,
      "rating": 4.8,
      "user": {
        "id": "user-uuid-here",
        "name": "Ahmed Al-Barber",
        "phone": "+973-1234-5678",
        "role": "barber"
      }
    }
  ]
}
```

## Use the Barber ID (not User ID) for Booking

When creating a booking, use the `id` field from the barber object, NOT the `user_id` or `user.id`.

```bash
# Example booking with correct barber ID
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "service_id": "service-uuid",
    "barber_id": "BARBER_ID_FROM_BARBERS_ENDPOINT",
    "appointment_date": "2025-09-08",
    "appointment_time": "10:00",
    "notes": "Test booking"
  }'
```

## Troubleshooting

### Error: "Barber not found"
- Make sure you're using the barber ID from `/api/barbers`, not from `/api/users`
- The barber ID should be from the `barbers` table, not the `users` table
- Double-check that the barber exists and is active

### Get Barber by Specific ID
```bash
curl "http://localhost:3000/api/barbers/BARBER_ID_HERE"
```

This should help you identify the correct barber IDs to use in your booking requests!
