import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

// Mock bookings database (shared with main route)
let bookings = [
  {
    id: '1',
    customerId: 'customer1',
    customerName: 'Alice Johnson',
    customerPhone: '+1234567890',
    barberId: '1',
    barberName: 'John Smith',
    serviceId: '1',
    serviceName: 'Classic Haircut',
    date: '2025-09-01',
    time: '10:00',
    duration: 30,
    price: 25.00,
    status: 'confirmed',
    notes: 'Please trim the sides shorter',
    createdAt: '2025-08-31T10:00:00Z',
    updatedAt: '2025-08-31T10:00:00Z'
  },
  {
    id: '2',
    customerId: 'customer2',
    customerName: 'Bob Wilson',
    customerPhone: '+1234567891',
    barberId: '2',
    barberName: 'Mike Johnson',
    serviceId: '2',
    serviceName: 'Beard Trim',
    date: '2025-09-01',
    time: '14:30',
    duration: 20,
    price: 15.00,
    status: 'pending',
    notes: '',
    createdAt: '2025-08-31T11:00:00Z',
    updatedAt: '2025-08-31T11:00:00Z'
  }
];

// GET specific booking by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const booking = bookings.find(b => b.id === id);

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
      { error: 'Internal server error' },
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
    const { id } = params;
    const data = await request.json();

    const bookingIndex = bookings.findIndex(b => b.id === id);

    if (bookingIndex === -1) {
      return corsResponse(
        { error: 'Booking not found' },
        404
      );
    }

    const existingBooking = bookings[bookingIndex];

    // Validate status if provided
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (data.status && !validStatuses.includes(data.status)) {
      return corsResponse(
        { error: 'Invalid status. Must be: pending, confirmed, completed, or cancelled' },
        400
      );
    }

    // Validate date format if provided
    if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      return corsResponse(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        400
      );
    }

    // Validate time format if provided
    if (data.time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.time)) {
      return corsResponse(
        { error: 'Invalid time format. Use HH:MM' },
        400
      );
    }

    // Check for conflicting bookings if date/time/barber is being changed
    if ((data.barberId || data.date || data.time) && data.status !== 'cancelled') {
      const newBarberId = data.barberId || existingBooking.barberId;
      const newDate = data.date || existingBooking.date;
      const newTime = data.time || existingBooking.time;

      const conflictingBooking = bookings.find(booking => 
        booking.id !== id &&
        booking.barberId === newBarberId &&
        booking.date === newDate &&
        booking.time === newTime &&
        booking.status !== 'cancelled'
      );

      if (conflictingBooking) {
        return corsResponse(
          { error: 'Time slot is already booked' },
          409
        );
      }
    }

    // Update booking
    const updatedBooking = {
      ...existingBooking,
      ...data,
      id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString()
    };

    bookings[bookingIndex] = updatedBooking;

    return corsResponse({
      message: 'Booking updated successfully',
      data: updatedBooking
    });

  } catch (error) {
    console.error('Update booking error:', error);
    return corsResponse(
      { error: 'Internal server error' },
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
    const { id } = params;

    const bookingIndex = bookings.findIndex(b => b.id === id);

    if (bookingIndex === -1) {
      return corsResponse(
        { error: 'Booking not found' },
        404
      );
    }

    const booking = bookings[bookingIndex];

    // Mark as cancelled instead of deleting (for audit trail)
    booking.status = 'cancelled';
    booking.updatedAt = new Date().toISOString();

    return corsResponse({
      message: 'Booking cancelled successfully',
      data: booking
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
