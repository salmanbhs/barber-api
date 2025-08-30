import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { corsResponse, corsOptions } from '@/lib/cors';

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

    return corsResponse({
      message: 'OTP verified successfully',
      user: data.user,
      session: data.session
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
