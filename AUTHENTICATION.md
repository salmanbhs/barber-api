# 🔐 Unified Authentication System

## Overview
A single OTP-based authentication system that handles **registration** and **login** for all three user roles: **Customer**, **Barber**, and **Admin**.

## 🎯 Key Features
- ✅ **One Flow for All**: Same endpoints for registration and login
- ✅ **Role-Based**: Customer, Barber, Admin roles with specific permissions
- ✅ **Phone-First**: Uses phone number + OTP (no passwords)
- ✅ **Auto-Detection**: Automatically detects if user is new or existing
- ✅ **Duplicate-Safe**: Handles existing phone numbers gracefully

## � Mobile App Integration

### **Same Flow for Mobile Apps**
Mobile applications use the **exact same authentication flow** as web applications:

```javascript
// Mobile App Authentication (React Native, Flutter, etc.)

// Step 1: Send OTP
const sendOtp = async (phone) => {
  const response = await fetch('https://your-api.com/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });
  return response.json();
};

// Step 2: Verify OTP with role
const verifyOtp = async (phone, token, role = 'customer') => {
  const response = await fetch('https://your-api.com/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, token, role })
  });
  return response.json();
};

// Usage
await sendOtp('36304442');
const result = await verifyOtp('36304442', '123456', 'customer');

// Store session securely
const { session, user, role_info } = result;
await SecureStore.setItemAsync('session', JSON.stringify(session));
await SecureStore.setItemAsync('user', JSON.stringify(user));
```

### **Mobile-Specific Considerations**
- ✅ **Secure Storage**: Store JWT tokens in secure storage (Keychain/Keystore)
- ✅ **Auto-Refresh**: Implement automatic token refresh before expiry
- ✅ **Offline Handling**: Cache user data for offline access
- ✅ **Biometric Auth**: Add biometric authentication for better UX

### **Session Management**
```javascript
// Store session securely
import * as SecureStore from 'expo-secure-store';

const storeSession = async (session, user) => {
  await SecureStore.setItemAsync('access_token', session.access_token);
  await SecureStore.setItemAsync('refresh_token', session.refresh_token);
  await SecureStore.setItemAsync('user_data', JSON.stringify(user));
};

// Retrieve session
const getStoredSession = async () => {
  const accessToken = await SecureStore.getItemAsync('access_token');
  const refreshToken = await SecureStore.getItemAsync('refresh_token');
  const userData = await SecureStore.getItemAsync('user_data');
  
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: userData ? JSON.parse(userData) : null
  };
};
```

## �🚀 Authentication Flow

### Step 1: Send OTP
```bash
POST /api/auth/send-otp
Content-Type: application/json

{
  "phone": "36304442"  # Without 973 prefix
}
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "data": { ... }
}
```

### Step 2: Verify OTP & Login/Register
```bash
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "36304442",     # Without 973 prefix
  "token": "123456",       # OTP received via SMS
  "role": "customer"       # customer|barber|admin
}
```

**Success Response:**
```json
{
  "message": "Registration successful",  // or "Login successful"
  "user": {
    "id": "supabase-auth-id",
    "phone": "+97336304442",
    "email": null,
    "role": "customer",
    "db_user_id": "uuid",
    "name": "Customer User"
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token",
    "expires_at": 1693747200
  },
  "role_info": {
    "role": "customer",
    "permissions": ["view_profile", "book_appointments", "view_history", "update_profile"],
    "is_new_user": true
  },
  "auth_type": "registration"  // or "login"
}
```

## 👥 User Roles & Permissions

### 🛍️ Customer (Default)
**Permissions:**
- `view_profile` - View their own profile
- `book_appointments` - Book appointments with barbers
- `view_history` - View booking history
- `update_profile` - Update their profile information

**Profile Creation:**
- Automatically creates customer profile in database
- Links to user account for booking management

### ✂️ Barber
**Permissions:**
- `manage_appointments` - Manage their appointment schedule
- `view_customer_data` - View customer information for appointments
- `update_profile` - Update their barber profile
- `manage_schedule` - Set availability and working hours

**Profile Creation:**
- Creates barber profile (TODO: implement barber profile table)
- Links to user account for appointment management

### 👑 Admin
**Permissions:**
- `manage_users` - Create, update, delete users
- `manage_barbers` - Manage barber accounts and profiles
- `manage_customers` - Manage customer accounts
- `manage_services` - CRUD operations on services
- `view_reports` - Access system reports and analytics
- `system_admin` - Full system administration access

**Profile Creation:**
- Full system access (TODO: implement admin profile if needed)

## 🔄 How It Works

### New User (Registration)
1. User sends OTP to phone number
2. User verifies OTP with desired role
3. System creates:
   - Supabase auth user
   - Database user record with specified role
   - Role-specific profile (customer profile for customers)
4. Returns session + role info

### Existing User (Login)
1. User sends OTP to existing phone number
2. User verifies OTP (role parameter ignored)
3. System:
   - Finds existing user by Supabase auth ID
   - Uses existing role (doesn't change role)
   - Updates phone if different
4. Returns session + existing role info

### Duplicate Phone Handling
- If customer profile exists with phone, reuses existing profile
- Prevents duplicate key violations
- Maintains data integrity

## 📱 Usage Examples

### Customer Registration/Login
```javascript
// Step 1: Send OTP
const sendOtp = await fetch('/api/auth/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '36304442' })
});

// Step 2: Verify OTP (customer registration)
const verify = await fetch('/api/auth/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '36304442',
    token: '123456',
    role: 'customer'  // Will be customer permissions
  })
});

const { user, session, role_info } = await verify.json();
```

### Barber Registration
```javascript
// Same send-otp step, then:
const verify = await fetch('/api/auth/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '36304442',
    token: '123456',
    role: 'barber'  // Will be barber permissions
  })
});
```

### Admin Registration
```javascript
// Same send-otp step, then:
const verify = await fetch('/api/auth/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '36304442',
    token: '123456',
    role: 'admin'  // Will be admin permissions
  })
});
```

## 🔒 Security Features
- ✅ **Phone Verification**: SMS OTP prevents fake accounts
- ✅ **Role-Based Access**: Each role has specific permissions
- ✅ **JWT Sessions**: Secure session management via Supabase
- ✅ **CORS Protection**: Configured for your domains
- ✅ **No Passwords**: Eliminates password-based attacks

## 🚨 Error Handling

### Common Errors
```json
// Invalid OTP
{
  "error": "Invalid login credentials"
}

// Invalid role
{
  "error": "Invalid role. Must be: customer, barber, or admin"
}

// Missing fields
{
  "error": "Phone number and OTP token are required"
}

// Duplicate phone (handled gracefully)
{
  "message": "Login successful",
  "auth_type": "login"  // Uses existing account
}
```

## 🔧 Backend Architecture

### Database Tables
- `users`: Main user table with role
- `customers`: Customer-specific data (auto-created for customers)
- `barbers`: Barber-specific data (TODO: implement)
- `admins`: Admin-specific data (TODO: implement if needed)

### Authentication Flow
1. **Supabase Auth**: Handles OTP sending/verification
2. **Database Service**: Manages user records and profiles
3. **Role Assignment**: Assigns permissions based on role
4. **Session Management**: JWT tokens for API access

This system provides a clean, unified authentication experience while maintaining proper role separation and security! 🚀
