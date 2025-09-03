import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';
import { requireAuthenticated } from '@/lib/auth';

export async function OPTIONS() {
  return corsOptions();
}

// GET - Get customer profile (requires authentication)
export async function GET(request: NextRequest) {
  const auth = await requireAuthenticated(request);
  if (!auth.success) return auth.response;

  try {
    let customer;
    
    // If user is a customer, get their customer profile
    if (auth.user.role === 'customer') {
      customer = await DatabaseService.getCustomerByUserId(auth.user.dbUser.id);
      
      // If customer profile doesn't exist, create it
      if (!customer) {
        customer = await DatabaseService.createCustomer({
          name: auth.user.dbUser.name,
          phone: auth.user.dbUser.phone,
          email: auth.user.dbUser.email,
          user_id: auth.user.dbUser.id
        });
      }
    } else {
      // For admin/barber viewing customer profiles, this endpoint shouldn't be used
      return corsResponse(
        { error: 'This endpoint is for customers only. Use /api/admin/users for user management.' },
        403
      );
    }

    return corsResponse({
      message: 'Customer profile retrieved successfully',
      data: {
        customer,
        user: auth.user.dbUser,
        auth_user: {
          id: auth.user.user.id,
          phone: auth.user.user.phone,
          email: auth.user.user.email,
          created_at: auth.user.user.created_at,
        },
        stats: {
          total_visits: customer.total_visits,
          total_spent: customer.total_spent,
          last_visit_date: customer.last_visit_date
        }
      }
    });

  } catch (error) {
    console.error('Get customer profile error:', error);
    return corsResponse(
      { error: 'Failed to retrieve customer profile', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}

// PUT - Update customer profile (requires authentication)
export async function PUT(request: NextRequest) {
  const auth = await requireAuthenticated(request);
  if (!auth.success) return auth.response;

  try {
    const body = await request.json();

    // Only customers can update their own profile
    if (auth.user.role !== 'customer') {
      return corsResponse(
        { error: 'Only customers can update their profile' },
        403
      );
    }

    // Get customer from our database
    const customer = await DatabaseService.getCustomerByUserId(auth.user.dbUser.id);
    if (!customer) {
      return corsResponse(
        { error: 'Customer profile not found' },
        404
      );
    }

    // Update customer data
    const allowedUpdates = ['name', 'email', 'date_of_birth', 'address', 'notes'];
    const updates: Record<string, string> = {};
    
    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return corsResponse(
        { error: 'No valid fields to update' },
        400
      );
    }

    const updatedCustomer = await DatabaseService.updateCustomer(customer.id, updates);

    return corsResponse({
      message: 'Customer profile updated successfully',
      data: updatedCustomer
    });

  } catch (error) {
    console.error('Update customer profile error:', error);
    return corsResponse(
      { error: 'Failed to update customer profile', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
