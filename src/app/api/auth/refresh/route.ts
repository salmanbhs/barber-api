import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { supabase } from '@/lib/supabase';

export async function OPTIONS() {
  return corsOptions();
}

// POST - Refresh access token using refresh token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.refresh_token) {
      return corsResponse(
        { error: 'Refresh token is required' },
        400
      );
    }

    // Use Supabase's refresh session method
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: body.refresh_token
    });

    if (error) {
      console.error('Supabase refresh error:', error);
      return corsResponse(
        { error: 'Invalid or expired refresh token' },
        401
      );
    }

    return corsResponse({
      message: 'Token refreshed successfully',
      session: data.session,
      user: data.user,
      token_info: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
        expires_in: data.session?.expires_in,
        token_type: 'bearer'
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return corsResponse(
      { error: 'Token refresh failed' },
      500
    );
  }
}
