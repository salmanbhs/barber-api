import { NextRequest } from 'next/server';
import { corsOptions, corsResponse } from '@/lib/cors';
import { supabase } from '@/lib/supabase';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  try {
    // Get all bookings for barber on Sept 10, 2025
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, appointment_datetime, appointment_time, service_duration, barber_name, customer_name, status, barber_id')
      .eq('appointment_date', '2025-09-10')
      .in('status', ['pending', 'confirmed'])
      .order('appointment_datetime');

    if (error) {
      return corsResponse({ success: false, error: error.message }, 500);
    }

    // Calculate end times for each booking
    const bookingsWithEndTimes = bookings?.map(booking => {
      const start = new Date(booking.appointment_datetime);
      const end = new Date(start.getTime() + (booking.service_duration * 60 * 1000));
      return {
        ...booking,
        start_time: start.toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }),
        end_time: end.toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }),
        time_range: `${start.toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })}-${end.toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })}`
      };
    }) || [];

    return corsResponse({
      success: true,
      data: {
        date: '2025-09-10',
        total_bookings: bookingsWithEndTimes.length,
        bookings: bookingsWithEndTimes
      }
    });

  } catch (error) {
    return corsResponse(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}
