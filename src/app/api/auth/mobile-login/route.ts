import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { supabase } from '@/lib/supabase';

export async function OPTIONS() {
  return corsOptions();
}

// POST - Extended login for mobile apps
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.phone || !body.token) {
      return corsResponse(
        { error: 'Phone number and OTP token are required' },
        400
      );
    }

    const phone = '973' + body.phone;

    // Verify OTP token
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: body.token,
      type: 'sms'
    });

    if (error) {
      console.error('Supabase verify OTP error:', error);
      return corsResponse(
        { error: error.message },
        400
      );
    }

    // For mobile apps, create a longer session
    const extendedSession = {
      ...data.session,
      mobile_app: true,
      extended_expiry: true,
      // Custom expiry time for mobile (30 days from now)
      expires_at: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      expires_in: 30 * 24 * 60 * 60, // 30 days in seconds
      recommendation: 'Store securely and implement auto-refresh'
    };

    return corsResponse({
      message: 'Mobile login successful',
      session: extendedSession,
      user: data.user,
      mobile_config: {
        token_type: 'Bearer',
        expires_in_days: 30,
        auto_refresh_recommended: true,
        store_securely: true
      }
    });

  } catch (error) {
    console.error('Mobile login error:', error);
    return corsResponse(
      { error: 'Mobile login failed' },
      500
    );
  }
}
