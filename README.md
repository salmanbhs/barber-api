# 💈 Barber Shop Booking API

A comprehensive barber shop management API built with Next.js, featuring OTP authentication, role-based access control, multi-service bookings, and complete barbershop management.

## 🚀 Live Demo

**Production API:** [https://barber-api-wine.vercel.app](https://barber-api-wine.vercel.app)

## 📚 Documentation

**📖 Complete API Documentation:** [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md)

This comprehensive guide includes:
- All API endpoints with examples
- Authentication & role-based access control
- Request/response formats
- Error handling
- Mobile app integration examples

**🗄️ Database Setup:** [`database/schema.sql`](./database/schema.sql)

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5.2 with App Router
- **Database:** Supabase PostgreSQL 
- **Authentication:** OTP-based (SMS) with JWT tokens
- **Deployment:** Vercel
- **Language:** TypeScript
- **CORS:** Enabled for cross-origin requests

## ⭐ Key Features

- 🔐 **OTP Authentication** - No passwords, just phone + OTP
- 👥 **Role-Based Access** - Admin, Barber, Customer roles
- 📅 **Multi-Service Bookings** - Book multiple services in one appointment
- ⏰ **Real-time Availability** - Smart scheduling with business hours
- 🏢 **Company Management** - Configurable working hours, holidays, themes
- 📱 **Mobile Ready** - Designed for mobile app integration
- 🔄 **Auto-calculations** - Automatic booking totals, duration, confirmations

## 📁 API Structure

```
/api/
├── auth/              # OTP Authentication System
├── admin/             # Admin user management  
├── barbers/           # Barber profiles & schedules
├── bookings/          # Appointment booking system
├── customers/         # Customer management
├── services/          # Service catalog management
├── company/           # Business configuration
└── booking/           # Availability & booking options
```

## 🗄️ Database Schema

The API uses multiple tables for complete barber shop management:

### Core Tables:
- `users` - Authentication and user roles
- `customers` - Customer profiles and statistics  
- `barbers` - Barber profiles and specialties
- `services` - Service catalog with pricing
- `bookings` - Appointment booking system
- `company_config` - Business settings and working hours

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

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "your_refresh_token_here"
}
```

## 👤 Customer Management

### Get All Customers
```http
GET /api/customers
```

**Optional Query Parameters:**
- `phone` - Search by phone number

### Get Customer Profile
Get the authenticated customer's profile information.

```http
GET /api/customers/profile
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Customer profile retrieved successfully",
  "data": {
    "id": "customer-uuid",
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "date_of_birth": "1990-01-01",
    "address": "123 Main St",
    "notes": "Regular customer",
    "total_visits": 5,
    "total_spent": 125.00,
    "last_visit_date": "2025-08-15",
    "created_at": "2025-09-01T10:00:00Z"
  }
}
```

### Update Customer Profile
Update the authenticated customer's profile information.

```http
PUT /api/customers/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "address": "456 Oak Ave",
  "date_of_birth": "1990-01-01"
}
```

### Create Customer
```http
POST /api/customers
Content-Type: application/json

{
  "name": "Jane Doe",
  "phone": "+1234567891",
  "email": "jane@example.com",
  "date_of_birth": "1985-05-15",
  "address": "789 Pine St"
}
```

## � API Information

### Get API Info
```http
GET /api/info
```

**Response:**
```json
{
  "name": "Barber API",
  "version": "0.1.0",
  "description": "A simple customer management API",
  "status": "running",
  "timestamp": "2025-09-02T12:00:00.000Z",
  "environment": "development",
  "endpoints": {
    "info": "/api/info",
    "auth": {
      "sendOtp": "/api/auth/send-otp",
      "verifyOtp": "/api/auth/verify-otp",
      "logout": "/api/auth/logout"
    },
    "customers": {
      "list": "GET /api/customers",
      "create": "POST /api/customers",
      "profile": "GET /api/customers/profile"
    }
  }
}
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
- `409` - Conflict
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

4. **Set up database**
   Run the SQL script in `/database/add-customers-table.sql` in your Supabase SQL editor.

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open API**
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
- ✅ Refresh token support for mobile apps
- ✅ Customer profile management (authenticated)
- ✅ Customer search by phone number
- ✅ Customer creation and updates
- ✅ CORS support for frontend integration
- ✅ Data validation and error handling
- ✅ Database integration with Supabase PostgreSQL

##  Deployment

The API is automatically deployed to Vercel on every push to the main branch.

**Production URL:** https://barber-api-wine.vercel.app

---

## 📝 Notes

This is a simplified customer management API. The complex barbershop features (barbers, services, bookings) have been removed to focus on core customer management functionality.
