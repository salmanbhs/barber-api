import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService, UserRole } from '@/lib/database';
import { requireAdmin } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function OPTIONS() {
  return corsOptions();
}

// PUT - Update user role (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!body.role) {
      return corsResponse(
        { error: 'Role is required' },
        400
      );
    }

    // Validate role
    if (!['admin', 'barber', 'customer'].includes(body.role)) {
      return corsResponse(
        { error: 'Invalid role. Must be: admin, barber, or customer' },
        400
      );
    }

    const updatedUser = await DatabaseService.updateUserRole(id, body.role as UserRole);

    return corsResponse({
      message: 'User role updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update user role error:', error);
    return corsResponse(
      { error: 'Failed to update user role', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}

// DELETE - Deactivate user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    
    // Don't allow admin to deactivate themselves
    if (auth.user.dbUser.id === id) {
      return corsResponse(
        { error: 'Cannot deactivate your own account' },
        400
      );
    }

    const { data, error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return corsResponse({
      message: 'User deactivated successfully',
      data: data
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    return corsResponse(
      { error: 'Failed to deactivate user', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
