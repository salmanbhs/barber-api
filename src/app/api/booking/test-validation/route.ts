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

    // Parse the datetime
    const appointmentDateTime = new Date(`${appointment_date}T${appointment_time}:00.000Z`);
    
    console.log('=== FINAL BOOKING TEST ===');
    console.log('Input:', { barber_id, service_id, appointment_date, appointment_time });
    console.log('Parsed datetime:', appointmentDateTime.toISOString());
    
    // Test all the validation steps
    const canBook = await DatabaseService.canBookAtTime(appointmentDateTime);
    const isOpen = await DatabaseService.isShopOpen(appointmentDateTime);
    const fallbackResult = await DatabaseService.isShopOpenFallback(appointmentDateTime);
    
    // Try to get the barber (this was another issue)
    const barber = await DatabaseService.getBarberById(barber_id);
    
    return corsResponse({
      success: true,
      message: 'Validation test completed',
      data: {
        input: { barber_id, service_id, appointment_date, appointment_time },
        parsed_datetime: appointmentDateTime.toISOString(),
        validation_results: {
          can_book_at_time: canBook,
          is_shop_open_rpc: isOpen,
          is_shop_open_fallback: fallbackResult,
          barber_exists: !!barber,
          barber_name: barber?.user?.name || 'Not found'
        },
        status: canBook && isOpen && barber ? 'READY_TO_BOOK' : 'VALIDATION_FAILED'
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
