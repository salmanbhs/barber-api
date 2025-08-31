import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';

export async function OPTIONS() {
  return corsOptions();
}

// GET detailed availability for a specific barber
export async function GET(
  request: NextRequest,
  { params }: { params: { barberId: string } }
) {
  try {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '7');
    const serviceDuration = parseInt(url.searchParams.get('duration') || '30');

    // Validate barber exists
    const barber = await DatabaseService.getBarberById(params.barberId);
    if (!barber) {
      return corsResponse(
        { error: 'Barber not found' },
        404
      );
    }

    // Generate availability for requested number of days
    const availability = [];
    const today = new Date();
    
    for (let i = 0; i < Math.min(days, 14); i++) { // Max 14 days
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      const slots = await DatabaseService.getAvailableTimeSlots(
        params.barberId, 
        dateString, 
        serviceDuration
      );
      
      availability.push({
        date: dateString,
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
        slots: slots
      });
    }

    return corsResponse({
      message: 'Barber availability retrieved successfully',
      data: {
        barber,
        availability,
        serviceDuration,
        totalDays: availability.length
      }
    });

  } catch (error) {
    console.error('Get barber availability error:', error);
    return corsResponse(
      { error: 'Failed to retrieve availability', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
