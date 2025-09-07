import { NextRequest } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { corsOptions, corsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const datetime = searchParams.get('datetime');
    
    if (!datetime) {
      return corsResponse(
        { error: 'datetime parameter is required. Format: YYYY-MM-DDTHH:MM:SS.sssZ' },
        400
      );
    }

    const checkDate = new Date(datetime);
    if (isNaN(checkDate.getTime())) {
      return corsResponse(
        { error: 'Invalid datetime format. Use ISO format: YYYY-MM-DDTHH:MM:SS.sssZ' },
        400
      );
    }

    // Test availability
    const canBook = await DatabaseService.canBookAtTime(checkDate);
    const isOpen = await DatabaseService.isShopOpen(checkDate);
    const config = await DatabaseService.getCompanyConfig();
    
    const now = new Date();
    const hoursUntilBooking = (checkDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySchedule = config?.working_hours[dayName as keyof typeof config.working_hours];

    return corsResponse({
      success: true,
      data: {
        requested_datetime: datetime,
        parsed_datetime: checkDate.toISOString(),
        current_datetime: now.toISOString(),
        hours_until_booking: hoursUntilBooking,
        advance_hours_required: config?.booking_advance_hours || 1,
        advance_hours_check: hoursUntilBooking >= (config?.booking_advance_hours || 1),
        day_name: dayName,
        day_schedule: daySchedule,
        is_shop_open: isOpen,
        can_book: canBook,
        debug_info: {
          has_config: !!config,
          booking_advance_hours: config?.booking_advance_hours,
          target_time: checkDate.toTimeString().slice(0, 5)
        }
      }
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    return corsResponse(
      { 
        success: false, 
        error: 'Failed to check availability',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}
