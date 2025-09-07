import { NextRequest } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { corsOptions, corsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const serviceDuration = searchParams.get('service_duration');
    
    if (!date) {
      return corsResponse(
        { error: 'date parameter is required (YYYY-MM-DD format)' },
        400
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return corsResponse(
        { error: 'Date must be in YYYY-MM-DD format' },
        400
      );
    }

    // Check if date is in the future
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return corsResponse(
        { error: 'Date must be today or in the future' },
        400
      );
    }

    const duration = serviceDuration ? parseInt(serviceDuration) : undefined;
    
    // Get available time slots
    const timeSlots = await DatabaseService.getAvailableTimeSlots(date, duration);
    
    // Get services for reference
    const services = await DatabaseService.getAllServices();
    
    // Get barbers for reference
    const barbers = await DatabaseService.getUsersByRole('barber');
    
    // Get company config for business info
    const config = await DatabaseService.getCompanyConfig();

    return corsResponse({
      success: true,
      data: {
        date,
        time_slots: timeSlots,
        services: services,
        barbers: barbers,
        config: {
          currency: config?.currency || 'BHD',
          time_slot_interval: config?.time_slot_interval || 30,
          booking_advance_hours: config?.booking_advance_hours || 1,
          max_daily_bookings: config?.max_daily_bookings || 20
        }
      }
    });
  } catch (error) {
    console.error('Error fetching booking options:', error);
    return corsResponse(
      { error: 'Failed to fetch booking options' },
      500
    );
  }
}