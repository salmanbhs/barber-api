import { NextRequest } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { corsOptions, corsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await DatabaseService.getBookingById(id);
    
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
  } catch (error) {
    console.error('Error fetching booking:', error);
    return corsResponse(
      { error: 'Failed to fetch booking' },
      500
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate date format if provided
    if (body.appointment_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(body.appointment_date)) {
        return corsResponse(
          { error: 'appointment_date must be in YYYY-MM-DD format' },
          400
        );
      }
    }

    // Validate time format if provided
    if (body.appointment_time) {
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(body.appointment_time)) {
        return corsResponse(
          { error: 'appointment_time must be in HH:MM format' },
          400
        );
      }
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
      if (!validStatuses.includes(body.status)) {
        return corsResponse(
          { error: `Status must be one of: ${validStatuses.join(', ')}` },
          400
        );
      }
    }

    // Check if appointment is in the future (if changing date/time)
    if (body.appointment_date || body.appointment_time) {
      const currentBooking = await DatabaseService.getBookingById(id);
      if (!currentBooking) {
        return corsResponse(
          { error: 'Booking not found' },
          404
        );
      }

      const newDate = body.appointment_date || currentBooking.appointment_date;
      const newTime = body.appointment_time || currentBooking.appointment_time;
      const appointmentDateTime = new Date(`${newDate}T${newTime}`);
      const now = new Date();
      
      if (appointmentDateTime <= now) {
        return corsResponse(
          { error: 'Appointment must be in the future' },
          400
        );
      }
    }

    const updatedBooking = await DatabaseService.updateBooking(id, body);

    return corsResponse({
      success: true,
      data: updatedBooking,
      message: 'Booking updated successfully'
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to update booking';
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason');

    const cancelledBooking = await DatabaseService.cancelBooking(id, reason || undefined);

    return corsResponse({
      success: true,
      data: cancelledBooking,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel booking';
    
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
