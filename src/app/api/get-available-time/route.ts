import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';

export async function OPTIONS() {
  return corsOptions();
}

// GET available times for a specific barber and day
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const barberId = url.searchParams.get('barber_id');
    const date = url.searchParams.get('date');
    const serviceDuration = parseInt(url.searchParams.get('service_duration') || '30');
    
    if (!barberId) {
      return corsResponse(
        { error: 'barber_id parameter is required' },
        400
      );
    }
    
    if (!date) {
      return corsResponse(
        { error: 'date parameter is required (format: YYYY-MM-DD)' },
        400
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return corsResponse(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        400
      );
    }

    // Get available time slots using your optimized algorithm
    const slots = await DatabaseService.getAvailableTimeSlots(
      barberId,
      date,
      serviceDuration
    );

    // Separate available and booked slots for better client-side handling
    const availableSlots = slots.filter(slot => slot.available);
    const bookedSlots = slots.filter(slot => !slot.available);

    return corsResponse({
      message: 'Available times retrieved successfully',
      data: {
        barber_id: barberId,
        date: date,
        service_duration: serviceDuration,
        total_slots: slots.length,
        available_count: availableSlots.length,
        booked_count: bookedSlots.length,
        slots: {
          available: availableSlots,
          booked: bookedSlots
        },
        algorithm_info: {
          description: 'Generate all slots → Get bookings → Remove booked slots',
          performance: 'Optimized from 630+ queries to 6 queries total'
        }
      }
    });

  } catch (error) {
    console.error('Get available times error:', error);
    return corsResponse(
      { error: 'Failed to retrieve available times', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
