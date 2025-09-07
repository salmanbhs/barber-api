import { NextRequest } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { corsOptions, corsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barber_id, service_id, appointment_date, appointment_time } = body;

    console.log('=== FINAL BOOKING TEST (NO AUTH) ===');
    console.log('Input:', { barber_id, service_id, appointment_date, appointment_time });
    
    // Test the EXACT same datetime creation as the real booking endpoint
    const appointmentDateTime = new Date(`${appointment_date}T${appointment_time}:00.000Z`);
    console.log('Parsed datetime (UTC):', appointmentDateTime.toISOString());
    console.log('Local time equivalent:', appointmentDateTime.toString());
    
    // Test availability using the same method as createBooking
    const canBook = await DatabaseService.canBookAtTime(appointmentDateTime);
    console.log('Can book result:', canBook);
    
    if (!canBook) {
      // Replicate the same error checking logic
      const config = await DatabaseService.getCompanyConfig();
      const now = new Date();
      const hoursUntilBooking = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const isAdvanceOk = hoursUntilBooking >= (config?.booking_advance_hours || 1);
      const isShopOpen = await DatabaseService.isShopOpen(appointmentDateTime);
      
      console.log('Advance hours check:', { hoursUntilBooking, required: config?.booking_advance_hours || 1, isAdvanceOk });
      console.log('Shop open check:', isShopOpen);
      
      let errorMessage = 'Selected time slot is not available';
      if (!isAdvanceOk) {
        errorMessage += ` - Must book at least ${config?.booking_advance_hours || 1} hour(s) in advance`;
      } else if (!isShopOpen) {
        const dayName = appointmentDateTime.toLocaleDateString('en-US', { weekday: 'long' });
        errorMessage += ` - Shop is closed on ${dayName} at ${appointment_time}. Check working hours.`;
      }
      
      return corsResponse({
        success: false,
        error: errorMessage,
        debug: {
          datetime_utc: appointmentDateTime.toISOString(),
          hours_until_booking: hoursUntilBooking,
          is_advance_ok: isAdvanceOk,
          is_shop_open: isShopOpen,
          advance_hours_required: config?.booking_advance_hours || 1
        }
      }, 400);
    }
    
    return corsResponse({
      success: true,
      message: 'Booking validation passed! (This is a test endpoint)',
      data: {
        datetime_utc: appointmentDateTime.toISOString(),
        can_book: canBook,
        status: 'READY_TO_BOOK'
      }
    });

  } catch (error) {
    console.error('Error in booking test:', error);
    return corsResponse(
      { 
        success: false, 
        error: 'Failed to test booking',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}
