import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { corsResponse, corsOptions } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  return corsResponse({
    message: 'Send OTP endpoint - use POST method',
    method: 'POST',
    endpoint: '/api/auth/send-otp',
    body: {
      phone: '+1234567890'
    },
    description: 'Send OTP to phone number for login or registration (automatic)'
  });
}

export async function POST(request: NextRequest) {
  try {
    let phone;
    try {
      const body = await request.json();
      phone = body.phone;
    } catch {
      return corsResponse(
        { error: 'Invalid JSON body. Please send a POST request with {"phone": "+1234567890"}' },
        400
      );
    }

    if (!phone) {
      return corsResponse(
        { error: 'Phone number is required' },
        400
      );
    }

    // Send OTP to phone number (handles both login and registration automatically)
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        channel: 'sms',
      }
    });

    if (error) {
      console.error('Supabase auth error:', error);
      return corsResponse(
        { error: error.message },
        400
      );
    }

    return corsResponse({
      message: 'OTP sent successfully',
      data: data
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
