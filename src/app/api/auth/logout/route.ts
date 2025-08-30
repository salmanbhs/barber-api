import { supabase } from '@/lib/supabase';
import { corsResponse, corsOptions } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  return corsResponse({
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
      return corsResponse(
        { error: error.message },
        400
      );
    }

    return corsResponse({
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
