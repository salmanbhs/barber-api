import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';
import { supabase } from '@/lib/supabase';

export async function OPTIONS() {
  return corsOptions();
}

// GET - Get customer's booking history (requires authentication)
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

    const token = authHeader.substring(7);
    const url = new URL(request.url);
    const status = url.searchParams.get('status'); // Filter by status if provided

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

    // Get booking history with optional status filter
    const filters: any = { customer_id: customer.id };
    if (status) {
      filters.status = status;
    }

    const bookings = await DatabaseService.getAllBookings(filters);

    // Organize bookings by status
    const bookingsByStatus = {
      upcoming: bookings.filter(b => b.status === 'confirmed' && new Date(b.appointment_date) >= new Date()),
      past: bookings.filter(b => b.status === 'completed' || new Date(b.appointment_date) < new Date()),
      cancelled: bookings.filter(b => b.status === 'cancelled'),
      no_show: bookings.filter(b => b.status === 'no_show')
    };

    // Calculate statistics
    const stats = {
      total_bookings: bookings.length,
      upcoming_count: bookingsByStatus.upcoming.length,
      completed_count: bookingsByStatus.past.filter(b => b.status === 'completed').length,
      cancelled_count: bookingsByStatus.cancelled.length,
      no_show_count: bookingsByStatus.no_show.length,
      total_spent: customer.total_spent,
      average_booking_value: bookings.length > 0 ? customer.total_spent / customer.total_visits : 0,
      last_visit_date: customer.last_visit_date,
      member_since: customer.created_at
    };

    return corsResponse({
      message: 'Booking history retrieved successfully',
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email
        },
        bookings: status ? bookings : bookingsByStatus,
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Get booking history error:', error);
    return corsResponse(
      { error: 'Failed to retrieve booking history', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
