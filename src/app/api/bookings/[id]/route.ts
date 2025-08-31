import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';

export async function OPTIONS() {
  return corsOptions();
}

// GET booking by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const booking = await DatabaseService.getBookingById(params.id);
    
    if (!booking) {
      return corsResponse(
        { error: 'Booking not found' },
        404
      );
    }

    return corsResponse({
      message: 'Booking retrieved successfully',
      data: booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    return corsResponse(
      { error: 'Failed to retrieve booking', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}

// PUT - Update booking
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Check if booking exists
    const existingBooking = await DatabaseService.getBookingById(params.id);
    if (!existingBooking) {
      return corsResponse(
        { error: 'Booking not found' },
        404
      );
    }

    // If updating time/date/barber/service, validate availability
    if (body.appointment_date || body.appointment_time || body.barber_id || body.service_id) {
      const barberId = body.barber_id || existingBooking.barber_id;
      const date = body.appointment_date || existingBooking.appointment_date;
      const time = body.appointment_time || existingBooking.appointment_time;
      
      // Get service duration
      let duration = existingBooking.duration;
      if (body.service_id && body.service_id !== existingBooking.service_id) {
        const service = await DatabaseService.getServiceById(body.service_id);
        if (!service) {
          return corsResponse(
            { error: 'Service not found' },
            404
          );
        }
        duration = service.duration;
        body.duration = duration;
        body.total_price = service.price;
      }

      // Check availability (excluding current booking)
      const isAvailable = await DatabaseService.checkBarberAvailability(
        barberId,
        date,
        time,
        duration
      );

      if (!isAvailable) {
        // Double check if it's just this booking occupying the slot
        const conflictingBookings = await DatabaseService.getAllBookings({
          barber_id: barberId,
          date: date
        });
        
        const hasConflict = conflictingBookings.some(booking => 
          booking.id !== params.id && 
          booking.appointment_time === time &&
          booking.status !== 'cancelled'
        );

        if (hasConflict) {
          return corsResponse(
            { error: 'Time slot is not available' },
            409
          );
        }
      }
    }

    const updatedBooking = await DatabaseService.updateBooking(params.id, body);

    return corsResponse({
      message: 'Booking updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    return corsResponse(
      { error: 'Failed to update booking', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}

// DELETE - Cancel booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if booking exists
    const existingBooking = await DatabaseService.getBookingById(params.id);
    if (!existingBooking) {
      return corsResponse(
        { error: 'Booking not found' },
        404
      );
    }

    await DatabaseService.deleteBooking(params.id);

    return corsResponse({
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Delete booking error:', error);
    return corsResponse(
      { error: 'Failed to cancel booking', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
