import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';
import { supabase } from '@/lib/supabase';

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

// POST - Create new booking with customer management and optional authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if user is authenticated
    const authHeader = request.headers.get('authorization');
    let authenticatedCustomerId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user && user.phone) {
        // Get or create customer for authenticated user
        let customer = await DatabaseService.getCustomerByPhone(user.phone);
        if (!customer) {
          customer = await DatabaseService.createCustomer({
            name: user.user_metadata?.name || body.customer_name || 'Customer',
            phone: user.phone,
            email: user.email
          });
        }
        authenticatedCustomerId = customer.id;
      }
    }

    // Validate required fields
    const required = ['barber_id', 'services', 'appointment_date', 'appointment_time'];
    for (const field of required) {
      if (!body[field]) {
        return corsResponse(
          { error: `Missing required field: ${field}` },
          400
        );
      }
    }

    let customerId = authenticatedCustomerId || body.customer_id;

    // If no customer_id and not authenticated, require customer data
    if (!customerId && (!body.customer_name || !body.customer_phone)) {
      return corsResponse(
        { error: 'Either authenticate with Bearer token or provide (customer_name + customer_phone) or customer_id' },
        400
      );
    }

    // Validate services array
    if (!Array.isArray(body.services) || body.services.length === 0) {
      return corsResponse(
        { error: 'Services must be a non-empty array' },
        400
      );
    }

    // If no customer_id, handle customer creation/lookup
    if (!customerId) {
      // Try to find existing customer by phone
      const existingCustomer = await DatabaseService.getCustomerByPhone(body.customer_phone);
      
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Create new customer
        const newCustomer = await DatabaseService.createCustomer({
          name: body.customer_name,
          phone: body.customer_phone,
          email: body.customer_email,
          date_of_birth: body.customer_date_of_birth,
          address: body.customer_address,
          notes: body.customer_notes
        });
        customerId = newCustomer.id;
      }
    }

    // Get barber details to verify they exist
    const barber = await DatabaseService.getBarberById(body.barber_id);
    if (!barber) {
      return corsResponse(
        { error: 'Barber not found' },
        404
      );
    }

    // Get and validate all services
    let totalDuration = 0;
    let totalPrice = 0;
    const bookingServices = [];

    for (let i = 0; i < body.services.length; i++) {
      const serviceId = body.services[i].service_id || body.services[i];
      
      const service = await DatabaseService.getServiceById(serviceId);
      if (!service) {
        return corsResponse(
          { error: `Service not found: ${serviceId}` },
          404
        );
      }

      totalDuration += service.duration;
      totalPrice += service.price;
      
      bookingServices.push({
        service_id: service.id,
        service_order: i + 1,
        service_duration: service.duration,
        service_price: service.price
      });
    }

    // Check availability for the total duration
    const isAvailable = await DatabaseService.checkBarberAvailability(
      body.barber_id,
      body.appointment_date,
      body.appointment_time,
      totalDuration
    );

    if (!isAvailable) {
      return corsResponse(
        { error: 'Time slot is not available for the selected services duration' },
        409 // Conflict
      );
    }

    // Create booking data
    const bookingData = {
      customer_id: customerId,
      barber_id: body.barber_id,
      appointment_date: body.appointment_date,
      appointment_time: body.appointment_time,
      total_duration: totalDuration,
      total_price: totalPrice,
      status: 'confirmed' as const,
      notes: body.notes || null,
      services: bookingServices
    };

    const booking = await DatabaseService.createBooking(bookingData);

    return corsResponse(
      {
        message: 'Booking created successfully',
        data: {
          booking,
          summary: {
            booking_id: booking.id,
            customer_name: booking.customer?.name,
            customer_phone: booking.customer?.phone,
            barber_name: booking.barber?.name,
            services: booking.services?.map(bs => bs.service?.name).join(', '),
            appointment_date: booking.appointment_date,
            appointment_time: booking.appointment_time,
            total_duration: booking.total_duration,
            total_price: booking.total_price,
            status: booking.status
          }
        }
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
          { error: 'Invalid customer, barber or service ID' },
          400
        );
      }
      if (error.message.includes('unique') && error.message.includes('phone')) {
        return corsResponse(
          { error: 'Phone number already registered to another customer' },
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
