import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  return corsResponse({
    message: 'Verify OTP endpoint - use POST method',
    method: 'POST',
    endpoint: '/api/auth/verify-otp',
    body: {
      phone: '+1234567890',
      token: '123456',
      role: 'customer|barber|admin'
    },
    description: 'Verify OTP token and login/register user with specified role',
    roles: {
      customer: 'Default role for booking appointments',
      barber: 'Staff role for managing appointments',
      admin: 'Full system access'
    },
    flow: 'Same endpoint handles both registration and login automatically'
  });
}

export async function POST(request: NextRequest) {
  try {
    let phone, token, role;
    try {
      const body = await request.json();
      phone = '973' + body.phone;
      token = body.token;
      role = body.role || 'customer'; // Default to customer if no role specified
    } catch {
      return corsResponse(
        { error: 'Invalid JSON body. Please send a POST request with {"phone": "+1234567890", "token": "123456", "role": "customer|barber|admin"}' },
        400
      );
    }

    if (!phone || !token) {
      return corsResponse(
        { error: 'Phone number and OTP token are required' },
        400
      );
    }

    // Validate role
    if (!['customer', 'barber', 'admin'].includes(role)) {
      return corsResponse(
        { error: 'Invalid role. Must be: customer, barber, or admin' },
        400
      );
    }

    // Verify OTP token
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: token,
      type: 'sms'
    });

    if (error) {
      console.error('Supabase verify OTP error:', error);
      return corsResponse(
        { error: error.message },
        400
      );
    }

    if (!data.user) {
      return corsResponse(
        { error: 'User data not available' },
        400
      );
    }

    // Check if user exists in our system
    let dbUser = await DatabaseService.getUserByAuthId(data.user.id);
    
    if (!dbUser) {
      // NEW USER: Create user with specified role
      console.log(`🆕 Creating new ${role} user for phone: ${phone}`);
      
      dbUser = await DatabaseService.createOrUpdateUser({
        auth_user_id: data.user.id,
        name: data.user.user_metadata?.name || `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
        phone: phone,
        email: data.user.email,
        role: role
      });

      // Create role-specific profile
      if (role === 'customer') {
        // Check if customer already exists by phone (to handle duplicate phone issue)
        let customer = await DatabaseService.getCustomerByPhone(phone);
        if (!customer) {
          customer = await DatabaseService.createCustomer({
            name: dbUser.name,
            phone: dbUser.phone,
            email: dbUser.email,
            user_id: dbUser.id
          });
          console.log(`👤 Created customer profile for: ${phone}`);
        } else {
          console.log(`👤 Found existing customer profile for: ${phone}`);
        }
      }
      // TODO: Add barber profile creation when needed
      // TODO: Add admin profile creation when needed
      
    } else {
      // EXISTING USER: Just login
      console.log(`🔑 Existing ${dbUser.role} user logging in: ${phone}`);
      
      // Optional: Update user info if needed
      if (dbUser.phone !== phone) {
        dbUser = await DatabaseService.createOrUpdateUser({
          auth_user_id: data.user.id,
          name: dbUser.name,
          phone: phone,
          email: data.user.email || dbUser.email,
          role: dbUser.role // Keep existing role
        });
      }
    }

    // Get role permissions
    const getRolePermissions = (userRole: string) => {
      switch (userRole) {
        case 'admin':
          return ['manage_users', 'manage_barbers', 'manage_customers', 'manage_services', 'view_reports', 'system_admin'];
        case 'barber':
          return ['manage_appointments', 'view_customer_data', 'update_profile', 'manage_schedule'];
        case 'customer':
          return ['view_profile', 'book_appointments', 'view_history', 'update_profile'];
        default:
          return [];
      }
    };

    return corsResponse({
      message: `${dbUser.role === role ? 'Login' : 'Registration'} successful`,
      user: {
        id: data.user.id,
        phone: data.user.phone,
        email: data.user.email,
        role: dbUser.role,
        db_user_id: dbUser.id,
        name: dbUser.name
      },
      session: data.session,
      role_info: {
        role: dbUser.role,
        permissions: getRolePermissions(dbUser.role),
        is_new_user: !dbUser // This will be true for newly created users
      },
      auth_type: dbUser ? 'login' : 'registration'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return corsResponse(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
