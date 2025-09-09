import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DatabaseService } from '@/lib/database';
import { corsOptions, corsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // YYYY-MM-DD
    const barberId = searchParams.get('barber_id');
    
    // Validate required parameters
    if (!date) {
      return corsResponse(
        { error: 'date parameter is required (YYYY-MM-DD format)' },
        400
      );
    }
    
    if (!barberId) {
      return corsResponse(
        { error: 'barber_id parameter is required' },
        400
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return corsResponse(
        { error: 'Invalid date format. Use YYYY-MM-DD format' },
        400
      );
    }

    // Validate if barber exists
    const barber = await DatabaseService.getBarberById(barberId);
    if (!barber) {
      return corsResponse(
        { error: 'Barber not found' },
        404
      );
    }

    // Get company config for advance booking settings
    const config = await DatabaseService.getCompanyConfig();
    const advanceHours = config?.booking_advance_hours || 1;
    const slotInterval = config?.time_slot_interval || 15;

    // Calculate minimum booking time (current time + advance hours)
    const now = new Date();
    const minBookingTime = new Date(now.getTime() + (advanceHours * 60 * 60 * 1000));
    
    // Get start and end of the requested date
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    // Check if the requested date is in the past
    if (endOfDay < now) {
      return corsResponse({
        success: true,
        data: {
          date,
          barber_id: barberId,
          barber_name: barber.user?.name || 'Unknown',
          occupied_slots: [],
          advance_hours: advanceHours,
          slot_interval: slotInterval,
          message: 'Cannot book appointments in the past'
        }
      });
    }

    // Get all bookings for this barber on this date
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        appointment_time,
        appointment_datetime,
        total_duration,
        status,
        services_summary,
        customer_name,
        confirmation_code
      `)
      .eq('barber_id', barberId)
      .eq('appointment_date', date)
      .in('status', ['pending', 'confirmed']) // Only active bookings
      .order('appointment_time', { ascending: true });

    if (error) {
      console.error('Error fetching barber bookings:', error);
      return corsResponse(
        { error: 'Failed to fetch barber bookings' },
        500
      );
    }

    // Transform bookings into occupied time slots
    const occupiedSlots = bookings?.map(booking => {
      const startDateTime = new Date(booking.appointment_datetime);
      const endDateTime = new Date(startDateTime.getTime() + (booking.total_duration * 60 * 1000));
      
      return {
        booking_id: booking.id,
        confirmation_code: booking.confirmation_code,
        start_time: booking.appointment_time,
        end_time: endDateTime.toTimeString().slice(0, 5), // HH:MM format
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        duration_minutes: booking.total_duration,
        status: booking.status,
        services: booking.services_summary,
        customer_name: booking.customer_name,
        // Add buffer information for UI
        cannot_book_before: startDateTime.toTimeString().slice(0, 5),
        cannot_book_after: endDateTime.toTimeString().slice(0, 5)
      };
    }) || [];

    // Check if shop is open on this date
    const isShopOpen = await DatabaseService.isShopOpen(startOfDay);
    
    // Get working hours for this date
    const workingHours = config?.working_hours;
    const dayName = startOfDay.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayConfig = workingHours && typeof workingHours === 'object' ? (workingHours as any)[dayName] : null;

    return corsResponse({
      success: true,
      data: {
        date,
        barber_id: barberId,
        barber_name: barber.user?.name || 'Unknown',
        occupied_slots: occupiedSlots,
        total_occupied: occupiedSlots.length,
        shop_info: {
          is_open: isShopOpen,
          working_hours: dayConfig,
          advance_hours: advanceHours,
          slot_interval: slotInterval,
          min_booking_time: minBookingTime.toISOString(),
          currency: config?.currency || 'BHD'
        },
        booking_constraints: {
          min_advance_hours: advanceHours,
          earliest_booking_today: startOfDay <= minBookingTime ? minBookingTime.toTimeString().slice(0, 5) : '00:00',
          can_book_today: startOfDay.toDateString() !== now.toDateString() || minBookingTime < endOfDay
        }
      }
    });

  } catch (error) {
    console.error('Error fetching barber occupied slots:', error);
    return corsResponse(
      { 
        error: 'Failed to fetch barber availability',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}
