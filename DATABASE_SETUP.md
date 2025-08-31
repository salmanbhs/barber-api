# Barbershop API Database Setup

## 🗄️ Database Configuration

This API now uses **Supabase PostgreSQL** for data storage instead of mock data.

### Prerequisites
- Supabase account and project
- Environment variables configured in `.env.local`

### 📋 Setup Instructions

#### 1. Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Wait for database to initialize

#### 2. Configure Environment Variables
Update your `.env.local` file with your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

#### 3. Initialize Database Schema
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database/schema.sql`
4. Click **Run** to execute the SQL

This will create:
- ✅ `barbers` table with sample data
- ✅ `services` table with sample data  
- ✅ `bookings` table (empty, ready for use)
- ✅ `business_hours` table with default hours
- ✅ `barber_availability` table for custom scheduling

#### 4. Verify Installation
Test the API endpoints:
- `GET /api/barbers` - Should return 3 sample barbers
- `GET /api/services` - Should return 6 sample services
- `GET /api/booking/options` - Should return barbers + services + available times

### 🎯 Database Features

#### Real-Time Availability
- ✅ **Conflict Prevention**: No double-booking the same barber/time
- ✅ **Dynamic Time Slots**: 15-minute intervals based on business hours
- ✅ **Service Duration**: Automatic blocking based on service length
- ✅ **Business Rules**: Configurable hours per day of week

#### Data Relationships
- ✅ **Bookings → Barbers**: Foreign key with join data
- ✅ **Bookings → Services**: Foreign key with join data  
- ✅ **Availability Checking**: Real-time slot validation
- ✅ **Status Management**: confirmed, cancelled, completed, no_show

#### Sample Data Included
**Barbers:**
- John Smith (haircut, beard, styling) - Rating: 4.8
- Mike Johnson (haircut, fade, beard) - Rating: 4.9  
- Sarah Wilson (styling, haircut, coloring) - Rating: 4.7

**Services:**
- Classic Haircut ($25, 30min)
- Beard Trim ($15, 20min)
- Premium Styling ($40, 45min)
- Fade Cut ($30, 35min)
- Hot Towel Shave ($20, 25min)
- Hair Wash & Style ($12, 20min)

### 🔧 API Changes

#### Booking Options Endpoint: `GET /api/booking/options`
**Enhanced Features:**
- Query parameters: `?date=YYYY-MM-DD&service_id=uuid`
- Real availability calculation
- Business hours integration
- Service duration consideration

#### Booking CRUD: `/api/bookings`
**Database Integration:**
- ✅ **POST**: Creates booking with availability validation
- ✅ **GET**: Retrieves bookings with barber/service details
- ✅ **PUT**: Updates with conflict checking  
- ✅ **DELETE**: Marks as cancelled (audit trail)

#### Error Handling
- ✅ **404**: Barber/Service not found
- ✅ **409**: Time slot conflict
- ✅ **400**: Invalid data/missing fields
- ✅ **500**: Database connection issues

### 🚀 Development Workflow

#### Testing the Database
```bash
# Start development server
npm run dev

# Test endpoints
curl http://localhost:3001/api/barbers
curl http://localhost:3001/api/services  
curl http://localhost:3001/api/booking/options
```

#### Creating a Booking
```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "John Doe",
    "customer_phone": "+1234567890", 
    "barber_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "service_id": "s1a2b3c4-d5e6-f789-0abc-def123456789",
    "appointment_date": "2025-09-02",
    "appointment_time": "14:00:00"
  }'
```

### 📊 Database Schema Overview

```sql
-- Main Tables
barbers (id, name, email, phone, specialties[], rating, bio, profile_image_url, is_active)
services (id, name, description, duration, price, category, is_active)  
bookings (id, customer_name, customer_phone, barber_id, service_id, appointment_date, appointment_time, duration, total_price, status)

-- Scheduling Tables  
business_hours (day_of_week, open_time, close_time, is_closed)
barber_availability (barber_id, date, start_time, end_time, is_available)
```

### 🎯 Next Steps

1. **Authentication**: Add customer accounts and barber login
2. **Payments**: Integrate Stripe for booking payments
3. **Notifications**: SMS/Email confirmations via Supabase Edge Functions
4. **Admin Panel**: Dashboard for managing barbers/services/bookings
5. **Analytics**: Booking statistics and revenue tracking

Your barbershop API is now powered by a real database! 🎉
