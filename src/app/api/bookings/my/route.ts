import { NextRequest } from 'next/server';
import { DatabaseService, BookingStatus } from '@/lib/database';
import { corsOptions, corsResponse } from '@/lib/cors';
import { requireAuthenticated } from '@/lib/auth';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(request: NextRequest) {
  // Authenticate user first
  const auth = await requireAuthenticated(request);
  if (!auth.success) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    // Get customer_id from authenticated user
    const customer = await DatabaseService.getCustomerByUserId(auth.user.dbUser.id);
    if (!customer) {
      return corsResponse(
        { error: 'Customer profile not found. Please complete your customer registration first.' },
        404
      );
    }

    // Get user's bookings with optional filters
    const filters: {
      customer_id: string;
      status?: BookingStatus;
      date?: string;
    } = {
      customer_id: customer.id
    };
    if (status) filters.status = status as BookingStatus;
    if (date) filters.date = date;

    const bookings = await DatabaseService.getAllBookings(filters);

    return corsResponse({
      success: true,
      data: bookings,
      count: bookings.length,
      customer_id: customer.id,
      message: 'User bookings retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return corsResponse(
      { error: 'Failed to fetch your bookings' },
      500
    );
  }
}
