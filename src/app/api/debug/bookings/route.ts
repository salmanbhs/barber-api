import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { corsOptions, corsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barberId = searchParams.get('barber_id');
    const date = searchParams.get('date');

    // Get all bookings first
    let query = supabase
      .from('bookings')
      .select('*')
      .order('appointment_datetime', { ascending: true });

    if (barberId) {
      query = query.eq('barber_id', barberId);
    }

    if (date) {
      query = query.eq('appointment_date', date);
    }

    const { data: allBookings, error: allError } = await query;

    // Also get specific barber bookings for the date
    const { data: specificBookings, error: specificError } = await supabase
      .from('bookings')
      .select('*')
      .eq('barber_id', barberId || '96660363-7019-48d9-9b9b-c82b519dca2a')
      .eq('appointment_date', date || '2025-09-08');

    // Get schema info
    const { data: tableInfo, error: schemaError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);

    return corsResponse({
      success: true,
      data: {
        query_params: {
          barber_id: barberId,
          date: date
        },
        all_bookings_count: allBookings?.length || 0,
        all_bookings: allBookings || [],
        specific_bookings_count: specificBookings?.length || 0,
        specific_bookings: specificBookings || [],
        sample_schema: tableInfo?.[0] || null,
        errors: {
          all_error: allError?.message,
          specific_error: specificError?.message,
          schema_error: schemaError?.message
        }
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return corsResponse(
      { 
        success: false, 
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}
