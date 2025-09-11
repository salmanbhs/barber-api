# 🚀 Barber Shop API Documentation

Complete API reference for the Barber Shop management system with role-based authentication and comprehensive booking functionality.

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication & Roles](#authentication--roles)
- [API Endpoints](#api-endpoints)
  - [Authentication Endpoints](#authentication-endpoints)
  - [User Management](#user-management)
  - [Services](#services)
  - [Bookings](#bookings)
  - [Barbers](#barbers)
  - [Customers](#customers)
  - [Company Configuration](#company-configuration)
  - [System & Debug](#system--debug)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## 🏗️ Overview

The Barber Shop API is a Next.js-based REST API that provides complete barbershop management functionality including:

- **OTP-based Authentication** (no passwords needed)
- **Role-based Access Control** (Admin, Barber, Customer)
- **Multi-service Bookings** (book multiple services in one appointment)
- **Real-time Availability** checking with business hours validation
- **Company Configuration** management
- **Automated SMS/Email** notifications

**Base URL:** `https://your-domain.com/api`

---

## 🔐 Authentication & Roles

### Authentication System

The API uses **OTP (One-Time Password)** authentication via phone numbers. No passwords required!

**Flow:**
1. Send OTP to phone number
2. Verify OTP with desired role
3. Receive JWT token for API access
4. Use token in `Authorization: Bearer <token>` header

### User Roles

| Role | Permissions | Description |
|------|------------|-------------|
| **Customer** | - View services<br>- Create bookings<br>- View own bookings<br>- Update profile | Regular customers who book appointments |
| **Barber** | - All Customer permissions<br>- View assigned bookings<br>- Update booking status<br>- View customer details | Staff members who provide services |
| **Admin** | - All permissions<br>- Manage users & barbers<br>- Company configuration<br>- View all bookings<br>- System management | Full system access |

### Authentication Headers

All protected endpoints require:
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

---

## 🛡️ API Endpoints

### 🔑 Authentication Endpoints

#### Send OTP
**`POST /api/auth/send-otp`**

Send OTP to phone number for login/registration.

**Request:**
```json
{
  "phone": "36304442"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "phone": "36304442",
  "expires_in": 300
}
```

**Role Required:** None (Public)

---

#### Verify OTP
**`POST /api/auth/verify-otp`**

Verify OTP and complete login/registration.

**Request:**
```json
{
  "phone": "36304442",
  "token": "123456",
  "role": "customer",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "Authentication successful",
  "session": {
    "access_token": "jwt-token-here",
    "refresh_token": "refresh-token-here",
    "expires_at": 1694234567,
    "user": {
      "id": "uuid",
      "phone": "36304442",
      "email": "john@example.com"
    }
  },
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "phone": "36304442",
    "role": "customer"
  },
  "role_info": {
    "role": "customer",
    "permissions": ["view_services", "create_bookings"]
  }
}
```

**Role Required:** None (Public)

---

#### Get Current User
**`GET /api/auth/me`**

Get current authenticated user information.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "phone": "36304442",
    "email": "john@example.com",
    "role": "customer",
    "created_at": "2025-09-09T10:00:00Z"
  }
}
```

**Role Required:** Any authenticated user

---

#### Refresh Token
**`POST /api/auth/refresh`**

Refresh expired access token.

**Request:**
```json
{
  "refresh_token": "your-refresh-token"
}
```

**Role Required:** Any authenticated user

---

#### Logout
**`POST /api/auth/logout`**

Logout and invalidate tokens.

**Role Required:** Any authenticated user

---

### 👥 User Management

#### Get All Users (Admin)
**`GET /api/admin/users`**

Get all users in the system.

**Query Parameters:**
- `role` (optional): Filter by role (`admin`, `barber`, `customer`)
- `page` (optional): Page number for pagination
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "phone": "36304442",
      "role": "customer",
      "is_active": true,
      "created_at": "2025-09-09T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100
  }
}
```

**Role Required:** Admin

---

#### Update User (Admin)
**`PUT /api/admin/users/[id]`**

Update user information.

**Request:**
```json
{
  "name": "Updated Name",
  "role": "barber",
  "is_active": true
}
```

**Role Required:** Admin

---

### 🛠️ Services

#### Get All Services
**`GET /api/services`**

Get all available services (Public endpoint).

**Response:**
```json
{
  "message": "Services retrieved successfully",
  "data": {
    "services": [
      {
        "id": "uuid",
        "name": "Classic Haircut",
        "description": "Traditional men's haircut",
        "price": 25.00,
        "duration_minutes": 45,
        "category": "haircut",
        "is_active": true
      }
    ],
    "servicesByCategory": {
      "haircut": [...],
      "beard": [...],
      "styling": [...]
    },
    "count": 10,
    "categories": ["haircut", "beard", "styling"]
  }
}
```

**Role Required:** None (Public)

---

#### Get Service by ID
**`GET /api/services/[id]`**

Get specific service details.

**Role Required:** None (Public)

---

#### Get Services by Category
**`GET /api/services/category/[category]`**

Get services filtered by category.

**Example:** `/api/services/category/haircut`

**Role Required:** None (Public)

---

#### Create Service (Admin)
**`POST /api/services`**

Create new service.

**Request:**
```json
{
  "name": "Premium Haircut",
  "description": "Luxury haircut with styling",
  "price": 45.00,
  "duration_minutes": 60,
  "category": "haircut"
}
```

**Role Required:** Admin

---

#### Update Service (Admin)
**`PUT /api/services/[id]`**

Update existing service.

**Role Required:** Admin

---

#### Delete Service (Admin)
**`DELETE /api/services/[id]`**

Soft delete service (sets is_active to false).

**Role Required:** Admin

---

### 📅 Bookings

#### Create Booking
**`POST /api/bookings`**

Create new appointment booking. Customer information is automatically extracted from the authenticated user's token.

**Request:**
```json
{
  "appointment_date": "2025-09-15",
  "appointment_time": "14:30",
  "services": ["uuid1", "uuid2", "uuid3"],
  "barber_id": "uuid",
  "notes": "Please use scissors only"
}
```

**Required Fields:**
- `appointment_date`: Date in YYYY-MM-DD format
- `appointment_time`: Time in HH:MM format (24-hour)
- `services`: Array of service ID strings
- `barber_id`: ID of the selected barber

**Optional Fields:**
- `notes`: Special notes for the appointment
- `special_requests`: Any special requests from customer
```

**Response:**
```json
{
  "message": "Booking created successfully",
  "booking": {
    "id": "uuid",
    "confirmation_code": "ABC123",
    "customer_name": "John Doe",
    "customer_phone": "36304442",
    "customer_email": "john@example.com",
    "appointment_datetime": "2025-09-15T14:30:00Z",
    "total_amount": 40.00,
    "total_duration": 75,
    "services_summary": "Classic Haircut, Beard Trim",
    "status": "pending"
  }
}
```

**Role Required:** Customer, Barber, Admin

**Note:** Customer information (name, phone, email) is automatically retrieved from the authenticated user's profile. No need to include customer details in the request body.

---

#### Get All Bookings
**`GET /api/bookings`**

Get bookings based on user role.

**Query Parameters:**
- `date` (optional): Filter by date (YYYY-MM-DD)
- `status` (optional): Filter by status
- `barber_id` (optional): Filter by barber (Admin/Barber only)
- `page`, `limit`: Pagination

**Response:**
```json
{
  "bookings": [
    {
      "id": "uuid",
      "customer_name": "John Doe",
      "appointment_datetime": "2025-09-15T14:30:00Z",
      "services_summary": "Classic Haircut, Beard Trim",
      "total_amount": 40.00,
      "status": "confirmed",
      "barber_name": "Mike Johnson"
    }
  ],
  "total": 25
}
```

**Role Required:** 
- **Customer**: Only their own bookings
- **Barber**: Only their assigned bookings
- **Admin**: All bookings

---

#### Get My Bookings
**`GET /api/bookings/my`**

Get current user's bookings (customers only).

**Role Required:** Customer

---

#### Get Booking by ID
**`GET /api/bookings/[id]`**

Get specific booking details.

**Role Required:** 
- **Customer**: Only their own booking
- **Barber**: Only if assigned to them
- **Admin**: Any booking

---

#### Update Booking Status
**`PUT /api/bookings/[id]`**

Update booking status and details.

**Request:**
```json
{
  "status": "confirmed",
  "barber_id": "uuid",
  "notes": "Updated notes"
}
```

**Role Required:** Barber (assigned bookings), Admin (all bookings)

---

#### Cancel Booking
**`DELETE /api/bookings/[id]`**

Cancel booking (sets status to 'cancelled').

**Role Required:** Customer (own booking), Barber (assigned), Admin (all)

---

### 📊 Booking Availability

#### Check Availability
**`GET /api/booking/availability`**

Check available time slots for booking.

**Query Parameters:**
- `date`: Date to check (YYYY-MM-DD)
- `services`: Comma-separated service IDs
- `barber_id` (optional): Specific barber

**Response:**
```json
{
  "date": "2025-09-15",
  "available_slots": [
    {
      "time": "09:00",
      "available": true,
      "barbers_available": ["uuid1", "uuid2"]
    },
    {
      "time": "14:30",
      "available": false,
      "reason": "Fully booked"
    }
  ],
  "shop_info": {
    "is_open": true,
    "working_hours": "09:00-20:00"
  }
}
```

**Role Required:** None (Public)

---

#### Get Barber Occupied Slots
**`GET /api/booking/barber-occupied-slots`**

Get occupied time slots for a specific barber on a specific date to avoid booking conflicts.

**Query Parameters:**
- `date`: Date to check (YYYY-MM-DD) - Required
- `barber_id`: Barber's user ID (not barber table ID) - Required

**Example:** `/api/booking/barber-occupied-slots?date=2025-09-15&barber_id=uuid`

**Important:** The `barber_id` parameter should be the **user ID** of the barber (from the users table), not the ID from the barbers table. This is the same ID used when creating bookings.

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-09-15",
    "barber_id": "uuid",
    "barber_name": "Mike Johnson",
    "occupied_slots": [
      {
        "booking_id": "uuid",
        "confirmation_code": "ABC123",
        "start_time": "10:00",
        "end_time": "11:30",
        "start_datetime": "2025-09-15T10:00:00Z",
        "end_datetime": "2025-09-15T11:30:00Z",
        "duration_minutes": 90,
        "status": "confirmed",
        "services": "Haircut, Beard Trim",
        "customer_name": "John Doe",
        "cannot_book_before": "10:00",
        "cannot_book_after": "11:30"
      }
    ],
    "total_occupied": 1,
    "shop_info": {
      "is_open": true,
      "working_hours": {
        "isOpen": true,
        "shifts": [
          {"start": "09:00", "end": "12:00"},
          {"start": "16:00", "end": "20:00"}
        ]
      },
      "advance_hours": 1,
      "slot_interval": 15,
      "min_booking_time": "2025-09-15T15:30:00Z",
      "currency": "BHD"
    },
    "booking_constraints": {
      "min_advance_hours": 1,
      "earliest_booking_today": "15:30",
      "can_book_today": true
    }
  }
}
```

**Use Case:** This endpoint helps frontend applications show which time slots are already booked for a specific barber, allowing users to see available times and avoid booking conflicts. It respects the minimum advance booking hours from company configuration.

**Role Required:** None (Public)

---

### 👨‍💼 Barbers

#### Get All Barbers
**`GET /api/barbers`**

Get all active barbers.

**Response:**
```json
{
  "barbers": [
    {
      "id": "uuid",
      "name": "Mike Johnson",
      "specialties": ["haircut", "beard", "styling"],
      "experience_years": 7,
      "rating": 4.9,
      "bio": "Master of fade cuts",
      "profile_image_url": "https://...",
      "is_available": true
    }
  ]
}
```

**Role Required:** None (Public)

---

#### Get Barber Profile
**`GET /api/barbers/[id]`**

Get specific barber details.

**Role Required:** None (Public)

---

#### Get Barber Bookings
**`GET /api/barbers/[id]/bookings`**

Get bookings for specific barber.

**Query Parameters:**
- `date`: Filter by date
- `status`: Filter by status

**Role Required:** 
- **Barber**: Only their own bookings
- **Admin**: Any barber's bookings

---

#### Update Barber Profile
**`PUT /api/barbers/profile`**

Update barber's own profile.

**Request:**
```json
{
  "bio": "Updated bio",
  "specialties": ["haircut", "beard", "styling", "coloring"],
  "profile_image_url": "https://new-image.jpg"
}
```

**Role Required:** Barber (own profile), Admin (any profile)

---

### 👥 Customers

#### Get All Customers (Admin)
**`GET /api/customers`**

Get all customers.

**Query Parameters:**
- `search`: Search by name, phone, or email
- `page`, `limit`: Pagination

**Role Required:** Admin, Barber

---

#### Update Customer Profile
**`PUT /api/customers/profile`**

Update customer's own profile.

**Request:**
```json
{
  "name": "Updated Name",
  "email": "new@example.com",
  "date_of_birth": "1990-01-01",
  "address": "New address"
}
```

**Role Required:** Customer (own profile), Admin (any profile)

---

### 🏢 Company Configuration

#### Get Company Config
**`GET /api/company/config`**

Get company configuration and settings.

**Response:**
```json
{
  "company_name": "Barber Shop Pro",
  "company_description": "Professional barber services",
  "company_phone": "+973-1234-5678",
  "working_hours": {
    "monday": {"isOpen": true, "shifts": [...]},
    "tuesday": {"isOpen": true, "shifts": [...]}
  },
  "booking_advance_hours": 1,
  "time_slot_interval": 15,
  "currency": "BHD",
  "primary_color": "#2563eb",
  "maintenance_mode": false
}
```

**Role Required:** None (Public - limited fields), Admin (full config)

---

#### Update Company Config (Admin)
**`PUT /api/company/config`**

Update company configuration.

**Role Required:** Admin

---

#### Get Working Hours
**`GET /api/company/working-hours`**

Get business working hours.

**Role Required:** None (Public)

---

#### Update Working Hours (Admin)
**`PUT /api/company/working-hours`**

Update business working hours.

**Role Required:** Admin

---

#### Get Company Status
**`GET /api/company/status`**

Check if company is open/closed, maintenance mode.

**Response:**
```json
{
  "is_open": true,
  "maintenance_mode": false,
  "current_time": "2025-09-09T14:30:00Z",
  "message": "We are currently open"
}
```

**Role Required:** None (Public)

---

### 🔧 System & Debug

#### API Info
**`GET /api/info`**

Get API version and system information.

**Role Required:** None (Public)

---

#### Health Check
**`GET /api/status`**

API health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-09T14:30:00Z",
  "version": "1.0.0"
}
```

**Role Required:** None (Public)

---

#### Cache Revalidation (Admin)
**`POST /api/revalidate`**

Trigger cache revalidation.

**Request:**
```json
{
  "paths": ["/api/services", "/api/barbers"]
}
```

**Role Required:** Admin

---

## ⚠️ Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": "Additional error details",
  "timestamp": "2025-09-09T14:30:00Z"
}
```

### Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required or invalid token |
| 403 | Forbidden | Insufficient permissions for this action |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists or conflict |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Codes

- `INVALID_CREDENTIALS` - Wrong OTP or expired token
- `INSUFFICIENT_PERMISSIONS` - User role doesn't have required permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `VALIDATION_ERROR` - Request data validation failed
- `BOOKING_CONFLICT` - Time slot already booked
- `SHOP_CLOSED` - Trying to book when shop is closed
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

## 🚦 Rate Limiting

API endpoints have rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **Booking creation**: 10 requests per hour per user
- **General API**: 100 requests per minute per user
- **Public endpoints**: 200 requests per minute per IP

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1694234567
```

---

## 📱 Mobile App Integration

The API is designed to work seamlessly with mobile applications:

```javascript
// Example: React Native integration
const API_BASE = 'https://your-api.com/api';

class BarberAPI {
  constructor() {
    this.token = null;
  }

  async sendOTP(phone) {
    const response = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    return response.json();
  }

  async verifyOTP(phone, token, role = 'customer') {
    const response = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, token, role })
    });
    const data = await response.json();
    if (data.session) {
      this.token = data.session.access_token;
    }
    return data;
  }

  async createBooking(bookingData) {
    // Customer info is automatically extracted from token
    // Only need appointment details and services
    const response = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        appointment_date: bookingData.date,
        appointment_time: bookingData.time,
        services: bookingData.services, // Array of service ID strings
        barber_id: bookingData.barber_id,
        notes: bookingData.notes
      })
    });
    return response.json();
  }

  async getMyBookings() {
    const response = await fetch(`${API_BASE}/bookings/my`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return response.json();
  }
}
```

---

## 🔗 Quick Links

- **Database Schema**: `/database/schema.sql` - Complete database setup
- **Authentication Flow**: OTP-based, no passwords needed
- **Postman Collection**: Import endpoints for testing
- **OpenAPI Spec**: Available at `/api/docs` (if enabled)

---

**API Version**: 1.0.0  
**Last Updated**: September 9, 2025  
**Support**: Contact your development team for API support
