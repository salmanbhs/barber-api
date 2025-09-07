# Test Barber Bookings Endpoint

## Test the new barber bookings endpoint

# Test 1: Get upcoming bookings for a specific barber
curl -X GET "http://localhost:3000/api/barbers/[BARBER_ID]/bookings" \
  -H "Content-Type: application/json"

# Test 2: Get bookings for a specific date
curl -X GET "http://localhost:3000/api/barbers/[BARBER_ID]/bookings?date=2025-09-08" \
  -H "Content-Type: application/json"

# Test 3: Get bookings for next 3 days only
curl -X GET "http://localhost:3000/api/barbers/[BARBER_ID]/bookings?days=3" \
  -H "Content-Type: application/json"

# Test 4: Get bookings for specific date with limited days
curl -X GET "http://localhost:3000/api/barbers/[BARBER_ID]/bookings?date=2025-09-10&days=2" \
  -H "Content-Type: application/json"

## Expected Response Format:

```json
{
  "success": true,
  "data": {
    "barber_id": "uuid-here",
    "upcoming_bookings": [
      {
        "booking_id": "uuid",
        "start_time": "2025-09-08T10:00:00.000Z",
        "end_time": "2025-09-08T10:30:00.000Z", 
        "date": "2025-09-08",
        "time": "10:00:00",
        "duration_minutes": 30,
        "status": "confirmed",
        "service_name": "Haircut",
        "customer_name": "John Doe",
        "customer_phone": "1234"
      }
    ],
    "query_params": {
      "start_time": "2025-09-07T15:00:00.000Z",
      "end_time": "2025-09-14T15:00:00.000Z",
      "advance_hours": 1,
      "slot_interval": 15,
      "days_ahead": 7
    },
    "total_bookings": 1
  }
}
```

## Usage in Frontend:

This endpoint is designed to help you:

1. **Get occupied time slots** for a specific barber
2. **Remove unavailable slots** from your booking interface  
3. **Respect advance booking rules** (1 hour minimum)
4. **Show upcoming bookings** with customer privacy protection

### Frontend Integration:

```javascript
// Get barber's occupied slots for next 7 days
const getBarberOccupiedSlots = async (barberId) => {
  const response = await fetch(`/api/barbers/${barberId}/bookings`);
  const data = await response.json();
  
  if (data.success) {
    // Remove these time slots from your available slots
    const occupiedSlots = data.data.upcoming_bookings.map(booking => ({
      start: new Date(booking.start_time),
      end: new Date(booking.end_time),
      bookingId: booking.booking_id
    }));
    
    return occupiedSlots;
  }
  return [];
};

// Filter available slots
const filterAvailableSlots = (allSlots, occupiedSlots) => {
  return allSlots.filter(slot => {
    return !occupiedSlots.some(occupied => {
      const slotStart = new Date(slot.datetime);
      const slotEnd = new Date(slotStart.getTime() + (slot.duration * 60000));
      
      // Check for overlap
      return (slotStart < occupied.end && slotEnd > occupied.start);
    });
  });
};
```
