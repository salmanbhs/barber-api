# 🚀 Complete Booking System Setup Guide

This guide will help you set up the complete booking system for your barber API.

## 📋 Prerequisites

1. **Supabase Project**: Active Supabase project
2. **Database Access**: Access to Supabase SQL Editor
3. **API Setup**: Next.js API running

## 🗄️ Database Setup (Run in Order)

### Step 1: Company Configuration
```sql
-- Run: database/add-company-config-table.sql
-- This creates the company_config table with business settings
```

### Step 2: Services Table
```sql
-- Run: database/add-services-table.sql
-- This creates the services table with sample services
```

### Step 3: Customers Table
```sql
-- Run: database/add-customers-table.sql
-- This creates the customers table for customer management
```

### Step 4: Bookings Table
```sql
-- Run: database/add-bookings-table.sql (UPDATED VERSION)
-- This creates the complete booking system
```

### Step 5: Verify Setup
```sql
-- Run: test-database-setup.sql
-- This tests all functions and tables
```

## 🔧 Fixed Issues

### ✅ Immutable Generation Expression Error
**Problem**: `generation expression is not immutable`

**Solution**: 
- Removed generated column for `appointment_datetime`
- Added trigger to automatically calculate the field
- Removed `NOW()` constraint that caused immutability issues

## 🎯 System Features

### Booking Management
- ✅ Create bookings with automatic validation
- ✅ Conflict prevention (no double bookings)
- ✅ Time slot generation based on working hours
- ✅ Customer auto-creation or linking
- ✅ Confirmation code generation
- ✅ Status tracking (pending → confirmed → completed)

### Business Rules
- ✅ 1-hour minimum advance booking
- ✅ Working hours validation
- ✅ Holiday support
- ✅ Maximum daily bookings limit
- ✅ BHD currency default

### Customer Experience
- ✅ Phone-based customer identification
- ✅ Automatic statistics tracking (visits, spending)
- ✅ Special requests and notes
- ✅ Email notifications support

## 🌐 API Endpoints

### Booking Operations
```bash
# Get available time slots
GET /api/booking/options?date=2025-09-08

# Check specific time availability  
GET /api/booking/availability?datetime=2025-09-08T10:00:00.000Z

# Create booking (requires authentication)
POST /api/bookings
Authorization: Bearer YOUR_AUTH_TOKEN
{
  "service_id": "service-uuid",
  "barber_id": "barber-uuid",
  "appointment_date": "2025-09-08",
  "appointment_time": "10:00",
  "notes": "Please use scissors only"
}

# Get all bookings
GET /api/bookings

# Get booking by ID
GET /api/bookings/{id}

# Update booking
PUT /api/bookings/{id}

# Cancel booking
DELETE /api/bookings/{id}?reason=Customer%20request
```

### Search & Filter
```bash
# By status
GET /api/bookings?status=pending

# By date
GET /api/bookings?date=2025-09-08

# By customer phone
GET /api/bookings?customer_phone=+973-3456-7890

# By confirmation code
GET /api/bookings?confirmation_code=ABC123
```

## 🧪 Testing Your Setup

### 1. Verify Database
Run the test SQL file to ensure all tables and functions work.

### 2. Test API Endpoints
```bash
# Start your server
npm run dev

# Test basic endpoints
curl http://localhost:3000/api/services
curl http://localhost:3000/api/company/config
curl "http://localhost:3000/api/booking/options?date=2025-09-08"
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

### 4. Create Test Booking

#### 4a. Debug Availability First
```bash
# Check if a time slot is available before booking
curl "http://localhost:3000/api/booking/debug-availability?datetime=2025-09-08T10:00:00.000Z"
```

#### 4b. Get Required IDs
```bash
# Get barber IDs first (use the barber ID, not user ID)
curl http://localhost:3000/api/barbers

# Get a service ID first
curl http://localhost:3000/api/services
```

#### 4c. Create the Booking
```bash
# Create booking (replace SERVICE_ID and BARBER_ID, get auth token first)
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "service_id": "YOUR_SERVICE_ID",
    "barber_id": "YOUR_BARBER_ID",
    "appointment_date": "2025-09-08",
    "appointment_time": "10:00",
    "notes": "Test booking with customer preference"
  }'
```

#### 4d. Troubleshooting "Time slot not available"
If you get "Selected time slot is not available" error:
1. Use the debug endpoint above to see why
2. Check if booking is at least 1 hour in advance
3. Verify the shop is open at that time (default: 9-12, 16-20 weekdays)
4. Try a different time within working hours

## 📱 Frontend Integration Example

```javascript
// Check available time slots
const slotsResponse = await fetch('/api/booking/options?date=2025-09-08');
const { data } = await slotsResponse.json();

// Show available times
const availableSlots = data.time_slots.filter(slot => slot.is_available);

// Create booking (with authentication)
const bookingResponse = await fetch('/api/bookings', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    service_id: selectedServiceId,
    barber_id: selectedBarberId,
    appointment_date: '2025-09-08',
    appointment_time: '10:00',
    notes: 'Customer preference or special request'
  })
});

const booking = await bookingResponse.json();
console.log('Confirmation code:', booking.data.confirmation_code);
```

## 🔐 Security Features

- **Row Level Security (RLS)**: Customers can only see their own bookings
- **Admin Access**: Barbers and admins have full access
- **Phone Validation**: Basic phone number format checking
- **Conflict Prevention**: Database-level booking conflict prevention
- **Data Integrity**: Foreign key constraints and validation

## 🚀 Production Deployment

1. **Environment Variables**: Set up Supabase credentials
2. **Database Migrations**: Run all SQL files in production
3. **Testing**: Verify all endpoints work correctly
4. **Monitoring**: Set up logging for booking operations

## 🎉 You're Ready!

Your booking system is now complete with:
- ✅ Smart time slot management
- ✅ Customer relationship management
- ✅ Business rule enforcement
- ✅ Bahraini business standards (BHD, 1-hour advance)
- ✅ Production-ready API endpoints

Start taking bookings! 🎯
