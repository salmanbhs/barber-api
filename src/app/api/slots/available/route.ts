import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';

export async function OPTIONS() {
  return corsOptions();
}

// GET available slots starting 1 hour from now
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const barberId = url.searchParams.get('barber_id');
    const serviceDuration = parseInt(url.searchParams.get('duration') || '30');
    
    if (!barberId) {
      return corsResponse(
        { error: 'barber_id parameter is required' },
        400
      );
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Your algorithm in action:
    console.log('🕐 Step 1: Generate all possible slots (assume available)');
    console.log('📅 Step 2: Get all bookings (single query)');
    console.log('❌ Step 3: Remove booked slots');
    
    const slots = await DatabaseService.getAvailableTimeSlots(
      barberId,
      today,
      serviceDuration
    );

    // Filter to show only available slots for cleaner output
    const availableSlots = slots.filter(slot => slot.available);
    const bookedSlots = slots.filter(slot => !slot.available);

    return corsResponse({
      message: 'Available slots starting 1 hour from now',
      data: {
        algorithm: {
          step1: 'Generate all possible time slots (assume available)',
          step2: 'Get all barber bookings in single query',
          step3: 'Remove booked time slots from available slots'
        },
        barber_id: barberId,
        date: today,
        service_duration: serviceDuration,
        total_slots: slots.length,
        available_count: availableSlots.length,
        booked_count: bookedSlots.length,
        available_slots: availableSlots,
        booked_slots: bookedSlots.map(slot => slot.display)
      }
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    return corsResponse(
      { error: 'Failed to get available slots', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
