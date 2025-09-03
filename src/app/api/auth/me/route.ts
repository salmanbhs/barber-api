import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { requireAuthenticated } from '@/lib/auth';

export async function OPTIONS() {
  return corsOptions();
}

// GET - Get current user info
export async function GET(request: NextRequest) {
  const auth = await requireAuthenticated(request);
  if (!auth.success) return auth.response;

  try {
    return corsResponse({
      message: 'User info retrieved successfully',
      data: {
        user: auth.user.dbUser,
        auth_user: {
          id: auth.user.user.id,
          phone: auth.user.user.phone,
          email: auth.user.user.email,
          created_at: auth.user.user.created_at
        },
        role_info: {
          role: auth.user.role,
          permissions: getRolePermissions(auth.user.role)
        }
      }
    });

  } catch (error) {
    console.error('Get user info error:', error);
    return corsResponse(
      { error: 'Failed to retrieve user info', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}

// Helper function to get role permissions
function getRolePermissions(role: string): string[] {
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
}
