import { NextRequest } from 'next/server';
import { DatabaseService, BookingStatus } from '@/lib/database';
import { corsOptions, corsResponse } from '@/lib/cors';
import { requireAuthenticated } from '@/lib/auth';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const customer_phone = searchParams.get('customer_phone');
    const service_id = searchParams.get('service_id');
    const barber_id = searchParams.get('barber_id');
    const confirmation_code = searchParams.get('confirmation_code');

    // Check if user wants their own bookings via token
    const authHeader = request.headers.get('authorization');
    let customer_id: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      // Try to get customer ID from token
      try {
        const auth = await requireAuthenticated(request);
        if (auth.success) {
          const customer = await DatabaseService.getCustomerByUserId(auth.user.dbUser.id);
          if (customer) {
            customer_id = customer.id;
          }
        }
      } catch (error) {
        // If token is invalid, continue without customer_id filter
        console.log('Invalid token provided, continuing with public access');
      }
    }

    // If searching by confirmation code
    if (confirmation_code) {
      const booking = await DatabaseService.getBookingByConfirmationCode(confirmation_code);
      if (!booking) {
        return corsResponse(
          { error: 'Booking not found' },
          404
        );
      }
      return corsResponse({
        success: true,
        data: booking
      });
    }

    // Get all bookings with filters
    const filters: {
      status?: BookingStatus;
      date?: string;
      customer_phone?: string;
      service_id?: string;
      barber_id?: string;
      customer_id?: string;
    } = {};
    if (status) filters.status = status as BookingStatus;
    if (date) filters.date = date;
    if (customer_phone) filters.customer_phone = customer_phone;
    if (service_id) filters.service_id = service_id;
    if (barber_id) filters.barber_id = barber_id;
    if (customer_id) filters.customer_id = customer_id; // Add customer_id filter from token

    const bookings = await DatabaseService.getAllBookings(filters);

    return corsResponse({
      success: true,
      data: bookings,
      count: bookings.length,
      filters_applied: filters, // Show what filters were applied
      user_bookings: !!customer_id // Indicate if these are user-specific bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return corsResponse(
      { error: 'Failed to fetch bookings' },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  // Authenticate user first
  const auth = await requireAuthenticated(request);
  if (!auth.success) return auth.response;

  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      return corsResponse(
        { error: 'Invalid JSON in request body. Please provide valid JSON data.' },
        400
      );
    }
    
    // Get customer_id from authenticated user
    const customer = await DatabaseService.getCustomerByUserId(auth.user.dbUser.id);
    if (!customer) {
      return corsResponse(
        { error: 'Customer profile not found. Please complete your customer registration first.' },
        404
      );
    }

    // Validate required fields
    const requiredFields = ['services', 'appointment_date', 'appointment_time'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return corsResponse(
          { error: `${field} is required` },
          400
        );
      }
    }

    // Validate services array
    if (!Array.isArray(body.services) || body.services.length === 0) {
      return corsResponse(
        { error: 'services must be a non-empty array of service IDs' },
        400
      );
    }

    // Validate each service ID
    for (let i = 0; i < body.services.length; i++) {
      const serviceId = body.services[i];
      if (!serviceId || typeof serviceId !== 'string' || !serviceId.trim()) {
        return corsResponse(
          { error: `services[${i}] must be a valid service ID string` },
          400
        );
      }
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.appointment_date)) {
      return corsResponse(
        { error: 'appointment_date must be in YYYY-MM-DD format' },
        400
      );
    }

    // Validate time format
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(body.appointment_time)) {
      return corsResponse(
        { error: 'appointment_time must be in HH:MM format' },
        400
      );
    }

    // Check if appointment is in the future
    const appointmentDateTime = new Date(`${body.appointment_date}T${body.appointment_time}:00.000Z`);
    const now = new Date();
    if (appointmentDateTime <= now) {
      return corsResponse(
        { error: 'Appointment must be in the future' },
        400
      );
    }

    // Handle optional barber_id - if not provided, we could auto-assign or require it
    if (!body.barber_id) {
      return corsResponse(
        { error: 'barber_id is required. Please select a barber for your appointment.' },
        400
      );
    }

    // Create booking using customer_id from auth token and service IDs
    const booking = await DatabaseService.createBooking({
      customer_id: customer.id,
      service_ids: body.services, // Use services array directly as it's now just IDs
      barber_id: body.barber_id,
      appointment_date: body.appointment_date,
      appointment_time: body.appointment_time,
      notes: body.notes,
      special_requests: body.special_requests
    });

    return corsResponse({
      success: true,
      data: booking,
      message: `Booking created successfully. Confirmation code: ${booking.confirmation_code}`
    }, 201);
  } catch (error) {
    console.error('Error creating booking:', error);
    
    // Handle specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
    
    if (errorMessage.includes('not available') || errorMessage.includes('conflict')) {
      return corsResponse(
        { error: errorMessage },
        409
      );
    }
    
    if (errorMessage.includes('not found')) {
      return corsResponse(
        { error: errorMessage },
        404
      );
    }

    return corsResponse(
      { error: errorMessage },
      500
    );
  }
}
