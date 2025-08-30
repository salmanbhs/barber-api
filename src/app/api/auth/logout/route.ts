import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  return NextResponse.json({
    message: 'Logout endpoint - use POST method',
    method: 'POST',
    endpoint: '/api/auth/logout',
    description: 'Sign out the current user'
  });
}

export async function POST() {
  try {
    // Sign out the user
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase signout error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
