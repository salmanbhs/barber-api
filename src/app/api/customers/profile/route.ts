import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';
import { supabase } from '@/lib/supabase';

export async function OPTIONS() {
  return corsOptions();
}

// GET - Get customer profile (requires authentication)
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return corsResponse(
        { error: 'Authorization token required' },
        401
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return corsResponse(
        { error: 'Invalid or expired token' },
        401
      );
    }

    // Get customer data from our database using phone number
    const customerPhone = user.phone;
    if (!customerPhone) {
      return corsResponse(
        { error: 'Phone number not found in user data' },
        400
      );
    }

    let customer = await DatabaseService.getCustomerByPhone(customerPhone);
    
    // If customer doesn't exist in our database, create them
    if (!customer) {
      customer = await DatabaseService.createCustomer({
        name: user.user_metadata?.name || 'Customer',
        phone: customerPhone,
        email: user.email
      });
    }

    return corsResponse({
      message: 'Customer profile retrieved successfully',
      data: {
        customer,
        auth_user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          created_at: user.created_at,
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
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return corsResponse(
        { error: 'Authorization token required' },
        401
      );
    }

    const token = authHeader.substring(7);
    const body = await request.json();

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return corsResponse(
        { error: 'Invalid or expired token' },
        401
      );
    }

    // Get customer from our database
    const customerPhone = user.phone;
    if (!customerPhone) {
      return corsResponse(
        { error: 'Phone number not found in user data' },
        400
      );
    }

    const customer = await DatabaseService.getCustomerByPhone(customerPhone);
    if (!customer) {
      return corsResponse(
        { error: 'Customer not found' },
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
