# Updated Booking API - Customer ID Based

## 🔄 API Changes

### ✅ New Booking Request Format (with Authentication)

```json
POST /api/bookings
Authorization: Bearer YOUR_AUTH_TOKEN
{
  "service_id": "uuid-of-service",
  "barber_id": "uuid-of-barber",
  "appointment_date": "2025-09-08",
  "appointment_time": "10:00",
  "notes": "Customer preference or special request",
  "special_requests": "Additional requests"
}
```

### ❌ Removed Fields
- `customer_id` - Now automatically retrieved from authentication token

### ➕ Added/Enhanced Fields
- `notes` - Customer notes/preferences (already supported)
- `special_requests` - Additional requests (already supported)

## 🧪 Testing the Updated API

### 1. Get Customer ID
```bash
# First, get a customer ID
curl "http://localhost:3000/api/customers"
```

### 2. Get Service ID
```bash  
# Get a service ID
curl "http://localhost:3000/api/services"
```

### 3. Get Authentication Token
```bash
# Login to get auth token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+973-1234-5678", 
    "password": "your_password"
  }'
```

### 4. Create Booking with Auth Token
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PUT_AUTH_TOKEN_HERE" \
  -d '{
    "service_id": "PUT_SERVICE_UUID_HERE",
    "barber_id": "PUT_BARBER_UUID_HERE",
    "appointment_date": "2025-09-08",
    "appointment_time": "10:00",
    "notes": "Customer prefers scissors only, no electric trimmer"
  }'
```

## 📱 Frontend Implementation

```javascript
// Example: Create booking with authentication
const createBooking = async (authToken, serviceId, barberId, dateTime, notes) => {
  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      service_id: serviceId,
      barber_id: barberId,
      appointment_date: dateTime.date,
      appointment_time: dateTime.time,
      notes: notes || '',
      special_requests: additionalRequests || ''
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Booking created:', result.data.confirmation_code);
    return result.data;
  } else {
    throw new Error(result.error);
  }
};

// Usage
const booking = await createBooking(
  'your-auth-token-here',
  'service-uuid-456',
  'barber-uuid-789',
  { date: '2025-09-08', time: '10:00' },
  'Please use scissors only'
);
```

## 🔍 Benefits

1. **Secure Customer Identification**: Customer is identified through secure auth token
2. **Simplified Request**: No need to pass customer details in request body
3. **Better Security**: Prevents customers from booking for other customers
4. **Auto-validation**: Ensures customer profile exists before booking
5. **Notes Support**: Full support for customer notes and preferences
6. **Cleaner API**: Fewer required fields, better security model

## 🚨 Migration Notes

If you have existing frontend code using the old format:

```javascript
// OLD FORMAT (no longer works)
{
  "customer_name": "Ahmed",
  "customer_phone": "+973-1234-5678",
  "service_id": "uuid"
}

// NEW FORMAT (with authentication)
Authorization: Bearer auth-token
{
  "service_id": "service-uuid",
  "barber_id": "barber-uuid",
  "notes": "Optional customer notes"
}
```

Make sure to:
1. Implement user authentication in your frontend
2. Store and send auth tokens with booking requests  
3. Get barber ID from your barber selection system
4. Handle authentication errors (401/403 responses)
5. Add notes field for customer preferences
