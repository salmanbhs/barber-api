import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  return NextResponse.json({
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
      phone = body.phone;
      token = body.token;
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body. Please send a POST request with {"phone": "+1234567890", "token": "123456"}' },
        { status: 400 }
      );
    }

    if (!phone || !token) {
      return NextResponse.json(
        { error: 'Phone number and OTP token are required' },
        { status: 400 }
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
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'OTP verified successfully',
      user: data.user,
      session: data.session
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
