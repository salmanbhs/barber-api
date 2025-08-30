import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  return NextResponse.json({
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
      return NextResponse.json(
        { error: 'Invalid JSON body. Please send a POST request with {"phone": "+1234567890"}' },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
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
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'OTP sent successfully',
      data: data
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
