# 💈 Barber API

A lightweight barbershop management API built with Next.js, featuring SMS OTP authentication, barber management, and customer profile management.

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
        ├── auth/           # SMS OTP & Token Authentication
        ├── customers/      # Customer profile management
        ├── barbers/        # Barber CRUD operations
        ├── get-available-time/  # Time availability
        ├── info/           # API information
        └── slots/          # Available time slots
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

### Mobile Login
```http
POST /api/auth/mobile-login
Content-Type: application/json

{
  "phone": "+1234567890"
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
  "email": "johnsmith@example.com"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "data": {
    "id": "customer-uuid",
    "name": "John Smith",
    "phone": "+1234567890",
    "email": "johnsmith@example.com",
    "created_at": "2025-09-01T10:00:00Z"
  }
}
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

## ⏰ Time & Availability

### Get Available Time Slots
```http
GET /api/get-available-time
```

### Get Available Slots
```http
GET /api/slots/available
```

## 📊 API Information

### Get API Info
```http
GET /api/info
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
- ✅ Refresh token support for mobile apps
- ✅ Customer profile management (authenticated)
- ✅ Customer search by phone number
- ✅ Barber management operations
- ✅ Time slot availability checking
- ✅ CORS support for frontend integration
- ✅ Data validation and error handling
- ✅ Database integration with Supabase PostgreSQL

## 🔄 Coming Soon

- 🔄 Service management
- 🔄 Booking system
- 🔄 Payment processing integration
- 🔄 Email/SMS notifications
- 🔄 Analytics and reporting

## 🚀 Deployment

The API is automatically deployed to Vercel on every push to the main branch.

**Production URL:** https://barber-api-wine.vercel.app
