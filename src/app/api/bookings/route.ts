import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';

export async function OPTIONS() {
  return corsOptions();
}

// GET all bookings
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const barber_id = url.searchParams.get('barber_id');
    const date = url.searchParams.get('date');
    const status = url.searchParams.get('status');

    const filters: any = {};
    if (barber_id) filters.barber_id = barber_id;
    if (date) filters.date = date;
    if (status) filters.status = status;

    const bookings = await DatabaseService.getAllBookings(filters);

    return corsResponse({
      message: 'Bookings retrieved successfully',
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    return corsResponse(
      { error: 'Failed to retrieve bookings', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}

// POST - Create new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const required = ['customer_name', 'customer_phone', 'barber_id', 'service_id', 'appointment_date', 'appointment_time'];
    for (const field of required) {
      if (!body[field]) {
        return corsResponse(
          { error: `Missing required field: ${field}` },
          400
        );
      }
    }

    // Get service details to calculate price and duration
    const service = await DatabaseService.getServiceById(body.service_id);
    if (!service) {
      return corsResponse(
        { error: 'Service not found' },
        404
      );
    }

    // Get barber details to verify they exist
    const barber = await DatabaseService.getBarberById(body.barber_id);
    if (!barber) {
      return corsResponse(
        { error: 'Barber not found' },
        404
      );
    }

    // Check availability
    const isAvailable = await DatabaseService.checkBarberAvailability(
      body.barber_id,
      body.appointment_date,
      body.appointment_time,
      service.duration
    );

    if (!isAvailable) {
      return corsResponse(
        { error: 'Time slot is not available' },
        409 // Conflict
      );
    }

    // Create booking data
    const bookingData = {
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      customer_email: body.customer_email || null,
      barber_id: body.barber_id,
      service_id: body.service_id,
      appointment_date: body.appointment_date,
      appointment_time: body.appointment_time,
      duration: service.duration,
      total_price: service.price,
      status: 'confirmed' as const,
      notes: body.notes || null
    };

    const booking = await DatabaseService.createBooking(bookingData);

    return corsResponse(
      {
        message: 'Booking created successfully',
        data: booking
      },
      201
    );
  } catch (error) {
    console.error('Create booking error:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('unique_barber_time')) {
        return corsResponse(
          { error: 'Time slot is already booked' },
          409
        );
      }
      if (error.message.includes('foreign key')) {
        return corsResponse(
          { error: 'Invalid barber or service ID' },
          400
        );
      }
    }

    return corsResponse(
      { error: 'Failed to create booking', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
