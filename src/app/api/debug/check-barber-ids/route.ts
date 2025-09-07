import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { corsOptions, corsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  try {
    // Get all barbers from barbers table
    const { data: barbers, error: barbersError } = await supabase
      .from('barbers')
      .select(`
        id,
        user_id,
        users:user_id(name, email)
      `)
      .order('id');

    // Get distinct barber IDs from bookings
    const { data: bookingBarbers, error: bookingError } = await supabase
      .from('bookings')
      .select('barber_id, barber_name')
      .order('barber_name');

    const uniqueBookingBarbers = bookingBarbers?.reduce((acc, booking) => {
      if (!acc.find(b => b.barber_id === booking.barber_id)) {
        acc.push(booking);
      }
      return acc;
    }, [] as any[]) || [];

    // Check which IDs match
    const comparison = barbers?.map(barber => {
      const matchingBooking = uniqueBookingBarbers.find(b => b.barber_id === barber.id);
      const barberUser = Array.isArray(barber.users) ? barber.users[0] : barber.users;
      return {
        barber_table_id: barber.id,
        barber_name: barberUser?.name,
        booking_barber_id: matchingBooking?.barber_id || null,
        booking_barber_name: matchingBooking?.barber_name || null,
        status: matchingBooking ? 'MATCH ✓' : 'MISMATCH ✗'
      };
    }) || [];

    return corsResponse({
      success: true,
      data: {
        barbers_table: barbers,
        booking_barbers: uniqueBookingBarbers,
        comparison: comparison,
        summary: {
          total_barbers: barbers?.length || 0,
          total_booking_barbers: uniqueBookingBarbers.length,
          matches: comparison.filter(c => c.status === 'MATCH ✓').length,
          mismatches: comparison.filter(c => c.status === 'MISMATCH ✗').length
        }
      }
    });

  } catch (error) {
    console.error('Barber ID check error:', error);
    return corsResponse(
      { 
        success: false, 
        error: 'Failed to check barber IDs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}
