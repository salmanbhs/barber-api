import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';

export async function OPTIONS() {
  return corsOptions();
}

// GET all booking options (barbers, services, available times)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const selectedDate = url.searchParams.get('date');
    const selectedService = url.searchParams.get('service_id');

    // Get all barbers from database
    const barbers = await DatabaseService.getAllBarbers();
    
    // Get all services from database
    const services = await DatabaseService.getAllServices();
    
    // Get business hours from database
    const businessHoursData = await DatabaseService.getBusinessHours();
    
    // Convert business hours to the expected format
    const businessHours: Record<string, { open: string; close: string }> = {};
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    businessHoursData.forEach(hours => {
      const dayName = dayNames[hours.day_of_week];
      if (!hours.is_closed) {
        businessHours[dayName] = {
          open: hours.open_time.substring(0, 5), // HH:MM format
          close: hours.close_time.substring(0, 5)
        };
      }
    });

    // If specific date and service are provided, get detailed availability
    let barbersWithAvailability = barbers;
    
    if (selectedDate && selectedService) {
      // Find the selected service to get duration
      const service = services.find(s => s.id === selectedService);
      const serviceDuration = service?.duration || 30;

      // Get availability for each barber on the selected date
      barbersWithAvailability = await Promise.all(
        barbers.map(async (barber) => {
          const availability = await DatabaseService.getAvailableTimeSlots(
            barber.id,
            selectedDate,
            serviceDuration
          );

          return {
            ...barber,
            availability: [{
              date: selectedDate,
              dayOfWeek: new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }),
              slots: availability
            }]
          };
        })
      );
    } else {
      // Generate availability for the next 7 days for all barbers
      const generateAvailableDates = async (barberId: string) => {
        const dates = [];
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          const dateString = date.toISOString().split('T')[0];
          
          // Get availability for this date
          const slots = await DatabaseService.getAvailableTimeSlots(barberId, dateString, 30);
          
          dates.push({
            date: dateString,
            dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
            slots: slots
          });
        }
        return dates;
      };

      // Add availability to each barber
      barbersWithAvailability = await Promise.all(
        barbers.map(async (barber) => ({
          ...barber,
          profileImage: barber.profile_image_url,
          availability: await generateAvailableDates(barber.id)
        }))
      );
    }

    return corsResponse({
      message: 'Booking options retrieved successfully',
      data: {
        barbers: barbersWithAvailability,
        services,
        businessHours,
        bookingRules: {
          minAdvanceHours: 1, // Must book at least 1 hour in advance
          maxAdvanceDays: 7,  // Can book up to 7 days in advance
          slotDuration: 15     // 15-minute time slots
        }
      }
    });

  } catch (error) {
    console.error('Get booking options error:', error);
    return corsResponse(
      { error: 'Failed to retrieve booking options', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
