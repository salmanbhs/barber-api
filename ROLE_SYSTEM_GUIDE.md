# 🎯 Role-Based Authentication System

## Overview

Your Barber API now has a complete role-based authentication system with three user roles:
- **👑 Admin**: Full system access and user management
- **💈 Barber**: Staff access to customer data and own profile management
- **👤 Customer**: Access to own profile and booking features

## 🗄️ Database Setup

### 1. Run Database Migration
Copy and run the SQL script in your **Supabase SQL Editor**:
```sql
-- File: /database/add-user-roles.sql
```

This creates:
- `users` table with role management
- `barbers` table for barber profiles
- Updates `customers` table with user relationships
- Sample test users for each role

### 2. Test Users Created
```
📱 Admin: +973admin (role: admin)
💈 Barber 1: +973barber1 (role: barber)
💈 Barber 2: +973barber2 (role: barber)
💈 Barber 3: +973barber3 (role: barber)
```
*Any new phone number automatically gets 'customer' role*

## 🔐 Authentication Flow

### 1. Login Process
```http
# Send OTP
POST /api/auth/send-otp
{
  "phone": "+973admin"
}

# Verify OTP (returns role info)
POST /api/auth/verify-otp
{
  "phone": "+973admin",
  "token": "123456"
}
```

**Response includes role information:**
```json
{
  "message": "OTP verified successfully",
  "user": {
    "id": "auth-user-id",
    "phone": "+973admin",
    "role": "admin",
    "db_user_id": "user-uuid"
  },
  "session": { /* session data */ },
  "role_info": {
    "role": "admin",
    "permissions": ["manage_users", "manage_barbers", "manage_customers", "view_reports", "system_admin"]
  }
}
```

### 2. Get Current User Info
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

## � Public Access Endpoints

### View Active Barbers (No Authentication Required)
Anyone can view the list of active barbers and their public information. This is perfect for:
- Website visitors browsing barbers
- Customers choosing a barber before booking
- Public barber directory

```http
# Get all active barbers (public data)
GET /api/barbers

# Get specific barber (public data)
GET /api/barbers/{id}
```

**Public Data Includes:**
- Barber name
- Specialties
- Experience years
- Rating
- Bio
- Profile image
- Email (for contact)

**Private Data (Staff Only):**
- Phone number
- Hourly rate
- Commission rate
- Hire date
- Full user details

```http
# Get barbers with private data (requires staff authentication)
GET /api/barbers?private=true
Authorization: Bearer <access_token>

# Get barber with private data (requires staff authentication)
GET /api/barbers/{id}?private=true
Authorization: Bearer <access_token>
```

## �🎭 Role Permissions

### Admin (👑)
**Permissions:**
- Manage all users and roles
- Create/update/deactivate any user
- View all customer and barber data
- Access admin endpoints
- System administration

**Endpoints:**
```http
GET /api/admin/users              # List all users
POST /api/admin/users             # Create new user
PUT /api/admin/users/{id}         # Update user role
DELETE /api/admin/users/{id}      # Deactivate user
GET /api/customers                # View all customers
POST /api/customers               # Create customers
GET /api/barbers?private=true     # View all barbers (private data)
POST /api/barbers                 # Create barbers
```

### Barber (💈)
**Permissions:**
- View customer data
- Manage own profile
- Access barber endpoints

**Endpoints:**
```http
GET /api/customers                # View all customers (staff access)
POST /api/customers               # Create customers
GET /api/barbers                  # View all barbers (public access)
GET /api/barbers?private=true     # View barbers with private data (staff access)
GET /api/barbers/profile          # Own profile
PUT /api/barbers/profile          # Update own profile
PUT /api/barbers/{id}             # Update own profile (if ID matches)
```

### Customer (👤)
**Permissions:**
- View/update own profile
- Book appointments (when implemented)
- View own history

**Endpoints:**
```http
GET /api/customers/profile        # Own profile only
PUT /api/customers/profile        # Update own profile
GET /api/auth/me                  # User info
GET /api/barbers                  # View active barbers (public access)
GET /api/barbers/{id}             # View barber details (public access)
```

## 📋 API Endpoints

### Authentication
```http
POST /api/auth/send-otp           # Send OTP (public)
POST /api/auth/verify-otp         # Verify OTP (public)
POST /api/auth/logout             # Logout (authenticated)
GET /api/auth/me                  # Current user info (authenticated)
```

### Admin Management (Admin Only)
```http
GET /api/admin/users              # List all users
GET /api/admin/users?role=barber  # Filter by role
POST /api/admin/users             # Create user with role
PUT /api/admin/users/{id}         # Update user role
DELETE /api/admin/users/{id}      # Deactivate user
```

### Barber Management
```http
GET /api/barbers                  # List barbers (public access)
GET /api/barbers?private=true     # List barbers with private data (staff only)
GET /api/barbers/{id}             # View barber (public access)
GET /api/barbers/{id}?private=true # View barber with private data (staff only)
POST /api/barbers                 # Create barber (admin only)
GET /api/barbers/profile          # Own profile (barber only)
PUT /api/barbers/profile          # Update own profile (barber only)
PUT /api/barbers/{id}             # Update barber (admin or own)
```

### Customer Management
```http
GET /api/customers                # List customers (staff only)
POST /api/customers               # Create customer (staff only)
GET /api/customers/profile        # Own profile (customer only)
PUT /api/customers/profile        # Update own profile (customer only)
```

## 🧪 Testing the System

### 1. Test Admin Login
```bash
# Send OTP to admin
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "admin"}'

# Verify OTP (use actual code from SMS)
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "admin", "token": "123456"}'
```

### 2. Test Admin User Management
```bash
# Get all users (admin only)
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <admin_token>"

# Create new barber user
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Barber",
    "phone": "+973newbarber",
    "email": "newbarber@barbershop.com",
    "role": "barber",
    "barber_data": {
      "specialties": ["haircut", "beard"],
      "experience_years": 3,
      "hourly_rate": 25.00
    }
  }'
```

### 3. Test Barber Login
```bash
# Login as barber
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "barber1", "token": "123456"}'

# Get own barber profile
curl -X GET http://localhost:3000/api/barbers/profile \
  -H "Authorization: Bearer <barber_token>"

# View customers (staff access)
curl -X GET http://localhost:3000/api/customers \
  -H "Authorization: Bearer <barber_token>"
```

### 4. Test Customer Login
```bash
# Login as customer (any new number)
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "12345678"}'

curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "12345678", "token": "123456"}'

# Get own profile
curl -X GET http://localhost:3000/api/customers/profile \
  -H "Authorization: Bearer <customer_token>"
```

## 🔒 Security Features

### Role-Based Access Control
- Every endpoint checks user role
- Automatic user creation with default 'customer' role
- Secure token validation
- Proper error messages without exposing sensitive data

### Database Security
- Foreign key constraints
- User deactivation instead of deletion (audit trail)
- Automatic timestamp updates
- Role validation at database level

### Authentication Security
- Token-based authentication via Supabase
- Role information stored in database
- Secure middleware for role checking
- Proper CORS configuration

## 🚀 Next Steps

1. **Test the system** with different roles
2. **Implement booking system** with role-based permissions
3. **Add email notifications** for admin actions
4. **Create admin dashboard** for user management
5. **Add audit logging** for sensitive operations

## 📝 Example Usage Scenarios

### Admin Creates New Barber
1. Admin logs in with `+973admin`
2. Admin creates user with barber role
3. New barber receives SMS with credentials
4. Barber logs in and sets up profile

### Customer Self-Registration
1. Customer sends OTP to any new number
2. System automatically creates customer role
3. Customer profile created automatically
4. Customer can immediately use the system

### Barber Daily Workflow
1. Barber logs in with staff credentials
2. Views customer list for appointments
3. Updates own profile/availability
4. Manages customer interactions

Your role-based authentication system is now complete and ready for production! 🎉
