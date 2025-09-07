import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { corsOptions, corsResponse } from '@/lib/cors';

interface Booking {
  id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_datetime: string;
  total_duration: number;
  status: string;
  services_summary: string;
  customer_name: string;
  customer_phone: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: barberId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const dateParam = searchParams.get('date');
    const daysAhead = parseInt(searchParams.get('days') || '7'); // Default 7 days ahead

    // Get company config for advance booking hours
    const { data: companyConfig } = await supabase
      .from('company_config')
      .select('booking_advance_hours, time_slot_interval')
      .eq('is_active', true)
      .single();

    const advanceHours = companyConfig?.booking_advance_hours || 1;
    const slotInterval = companyConfig?.time_slot_interval || 15;

    // Calculate start time (current time + advance hours)
    const now = new Date();
    const startTime = new Date(now.getTime() + (advanceHours * 60 * 60 * 1000));
    
    // If date is provided, use that date but still respect advance hours for today
    let targetDate: Date;
    if (dateParam) {
      targetDate = new Date(dateParam);
      // If target date is today, use the advance time
      if (targetDate.toDateString() === now.toDateString()) {
        targetDate = startTime;
      } else if (targetDate < now) {
        // If target date is in the past, return empty array
        return corsResponse({
          success: true,
          data: {
            barber_id: barberId,
            upcoming_bookings: [],
            advance_hours: advanceHours,
            message: 'No bookings found for past dates'
          }
        });
      }
    } else {
      targetDate = startTime;
    }

    // Calculate end time (target date + days ahead)
    const endTime = new Date(targetDate.getTime() + (daysAhead * 24 * 60 * 60 * 1000));

    // Get upcoming bookings for this barber
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        appointment_date,
        appointment_time,
        appointment_datetime,
        total_duration,
        status,
        services_summary,
        customer_name,
        customer_phone
      `)
      .eq('barber_id', barberId)
      .in('status', ['pending', 'confirmed'])
      .gte('appointment_datetime', targetDate.toISOString())
      .lte('appointment_datetime', endTime.toISOString())
      .order('appointment_datetime', { ascending: true });

    if (error) {
      console.error('Error fetching barber bookings:', error);
      return corsResponse(
        { 
          success: false, 
          error: 'Failed to fetch barber bookings',
          details: error.message 
        },
        500
      );
    }

    // Transform bookings into time slots format for easier frontend handling
    const occupiedSlots = bookings?.map((booking: Booking) => {
      const startDateTime = new Date(booking.appointment_datetime);
      const endDateTime = new Date(startDateTime.getTime() + (booking.total_duration * 60 * 1000));
      
      return {
        booking_id: booking.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        date: booking.appointment_date,
        time: booking.appointment_time,
        duration_minutes: booking.total_duration,
        status: booking.status,
        service_name: booking.services_summary,
        customer_name: booking.customer_name,
        customer_phone: booking.customer_phone?.slice(-4) // Only show last 4 digits for privacy
      };
    }) || [];

    return corsResponse({
      success: true,
      data: {
        barber_id: barberId,
        upcoming_bookings: occupiedSlots,
        query_params: {
          start_time: targetDate.toISOString(),
          end_time: endTime.toISOString(),
          advance_hours: advanceHours,
          slot_interval: slotInterval,
          days_ahead: daysAhead
        },
        total_bookings: occupiedSlots.length
      }
    });

  } catch (error) {
    console.error('Error in barber bookings endpoint:', error);
    return corsResponse(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}

export async function OPTIONS() {
  return corsOptions();
}
