# 💈 Barber API

A comprehensive barbershop management API built with Next.js, featuring SMS OTP authentication, barber management, service management, and booking system.

## 🚀 Live Demo

**Production API:** [https://barber-api-wine.vercel.app](https://barber-api-wine.vercel.app)

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5.2 with App Router
- **Authentication:** Supabase SMS OTP
- **Deployment:** Vercel
- **Language:** TypeScript
- **CORS:** Enabled for localhost:8081 frontend integration

## 📁 Project Structure

```
src/
└── app/
    └── api/
        ├── auth/           # SMS OTP Authentication
        ├── barbers/        # Barber CRUD operations
        ├── services/       # Service CRUD operations
        ├── booking/        # Booking data & options
        └── bookings/       # Booking CRUD operations
```

## 🔐 Authentication Endpoints

### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "phone": "+1234567890"
}
```

### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "+1234567890",
  "token": "123456"
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

## 👨‍💼 Barber Management

### Get All Barbers
```http
GET /api/barbers
```

### Get Barber by ID
```http
GET /api/barbers/{id}
```

### Create Barber
```http
POST /api/barbers
Content-Type: application/json

{
  "name": "John Smith",
  "email": "john@barbershop.com",
  "phone": "+1234567890",
  "specialties": ["haircut", "beard", "styling"],
  "experience": 5,
  "rating": 4.8
}
```

### Update Barber
```http
PUT /api/barbers/{id}
Content-Type: application/json

{
  "name": "John Smith Jr.",
  "specialties": ["haircut", "beard", "styling", "coloring"]
}
```

### Delete Barber
```http
DELETE /api/barbers/{id}
```

## ✂️ Service Management

### Get All Services
```http
GET /api/services
```

### Get Service by ID
```http
GET /api/services/{id}
```

### Create Service
```http
POST /api/services
Content-Type: application/json

{
  "name": "Premium Haircut",
  "description": "Full service haircut with styling",
  "duration": 45,
  "price": 35.00,
  "category": "haircut"
}
```

### Update Service
```http
PUT /api/services/{id}
Content-Type: application/json

{
  "price": 40.00,
  "duration": 50
}
```

### Delete Service
```http
DELETE /api/services/{id}
```

## 📅 Booking System

### Get Booking Options
Get all data needed to create a booking (barbers, services, available times)
```http
GET /api/booking/options
```

**Response includes:**
- Available barbers with their schedules
- All services with pricing
- Business hours
- Available time slots for next 7 days
- Booking rules (advance notice, etc.)

### Get All Bookings
```http
GET /api/bookings

# Optional filters:
GET /api/bookings?barberId=1&date=2025-09-01&status=confirmed
```

### Get Booking by ID
```http
GET /api/bookings/{id}
```

### Create Booking
```http
POST /api/bookings
Content-Type: application/json

{
  "customerName": "Alice Johnson",
  "customerPhone": "+1234567890",
  "barberId": "1",
  "barberName": "John Smith",
  "serviceId": "1",
  "serviceName": "Classic Haircut",
  "date": "2025-09-01",
  "time": "10:00",
  "duration": 30,
  "price": 25.00,
  "notes": "Please trim the sides shorter"
}
```

### Update Booking
```http
PUT /api/bookings/{id}
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Updated customer request"
}
```

### Cancel Booking
```http
DELETE /api/bookings/{id}
```

## 📊 Response Format

All endpoints return JSON responses in this format:

```json
{
  "message": "Operation successful",
  "data": { /* response data */ },
  "meta": { /* optional metadata */ }
}
```

**Error responses:**
```json
{
  "error": "Error description"
}
```

## 🔄 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (e.g., time slot already booked)
- `500` - Internal Server Error

## 🌐 CORS Support

The API includes CORS support for cross-origin requests from `localhost:8081` (frontend development).

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/salmanbhs/barber-api.git
   cd barber-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Add your Supabase credentials
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open API**
   ```
   http://localhost:3000
   ```

## 🌍 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📚 API Features

- ✅ SMS OTP Authentication with Supabase
- ✅ Complete Barber CRUD operations
- ✅ Complete Service CRUD operations  
- ✅ Complete Booking CRUD operations
- ✅ Booking options endpoint (barbers + services + available times)
- ✅ CORS support for frontend integration
- ✅ Data validation and error handling
- ✅ Conflict detection for booking overlaps
- ✅ Business logic (operating hours, advance booking rules)

## 🔄 Coming Soon

- 🔄 Database integration (currently using mock data)
- 🔄 Customer management system
- 🔄 Payment processing integration
- 🔄 Email/SMS notifications
- 🔄 Analytics and reporting

## 🚀 Deployment

The API is automatically deployed to Vercel on every push to the main branch.

**Production URL:** https://barber-api-wine.vercel.app
