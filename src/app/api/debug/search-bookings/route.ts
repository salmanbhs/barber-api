import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { corsOptions, corsResponse } from '@/lib/cors';

export async function GET() {
  try {
    // Get ALL bookings without any filters
    const { data: allBookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return corsResponse({ success: false, error: error.message }, 500);
    }

    // Filter for our specific barber
    const sarahBookings = allBookings?.filter(booking => 
      booking.barber_id === '96660363-7019-48d9-9b9b-c82b519dca2a'
    ) || [];

    // Filter for bookings around 11:00 (10:00-12:00 range)
    const elevenOClockBookings = allBookings?.filter(booking => {
      const time = booking.appointment_time;
      return time && (time.startsWith('11:') || time.startsWith('10:') || time.startsWith('12:'));
    }) || [];

    return corsResponse({
      success: true,
      data: {
        total_bookings: allBookings?.length || 0,
        sarah_bookings: {
          count: sarahBookings.length,
          bookings: sarahBookings
        },
        eleven_oclock_bookings: {
          count: elevenOClockBookings.length,
          bookings: elevenOClockBookings
        },
        all_barber_ids: [...new Set(allBookings?.map(b => b.barber_id) || [])],
        all_dates: [...new Set(allBookings?.map(b => b.appointment_date) || [])],
        all_times: [...new Set(allBookings?.map(b => b.appointment_time) || [])]
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return corsResponse(
      { 
        success: false, 
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}
