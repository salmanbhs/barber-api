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
      token: '123456'
    },
    description: 'Verify OTP token received via SMS'
  });
}

export async function POST(request: NextRequest) {
  try {
    let phone, token;
    try {
      const body = await request.json();
      phone = '973' + body.phone;
      token = body.token;
    } catch {
      return corsResponse(
        { error: 'Invalid JSON body. Please send a POST request with {"phone": "+1234567890", "token": "123456"}' },
        400
      );
    }

    if (!phone || !token) {
      return corsResponse(
        { error: 'Phone number and OTP token are required' },
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

    // Get or create user in our system
    let dbUser = await DatabaseService.getUserByAuthId(data.user.id);
    
    if (!dbUser) {
      // Create new user in our system
      dbUser = await DatabaseService.createOrUpdateUser({
        auth_user_id: data.user.id,
        name: data.user.user_metadata?.name || 'User',
        phone: phone,
        email: data.user.email,
        role: 'customer' // Default role
      });
    }

    // Create customer profile if needed and user is customer
    if (dbUser.role === 'customer') {
      let customer = await DatabaseService.getCustomerByUserId(dbUser.id);
      
      if (!customer) {
        customer = await DatabaseService.createCustomer({
          name: dbUser.name,
          phone: dbUser.phone,
          email: dbUser.email,
          user_id: dbUser.id
        });
      }
    }

    // Get role permissions
    const getRolePermissions = (role: string) => {
      switch (role) {
        case 'admin':
          return ['manage_users', 'manage_barbers', 'manage_customers', 'view_reports', 'system_admin'];
        case 'barber':
          return ['manage_appointments', 'view_customer_data', 'update_profile'];
        case 'customer':
          return ['view_profile', 'book_appointments', 'view_history'];
        default:
          return [];
      }
    };

    return corsResponse({
      message: 'OTP verified successfully',
      user: {
        ...data.user,
        role: dbUser.role,
        db_user_id: dbUser.id
      },
      session: data.session,
      role_info: {
        role: dbUser.role,
        permissions: getRolePermissions(dbUser.role)
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
