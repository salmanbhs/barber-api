import { NextRequest } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { corsOptions, corsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const datetimeParam = searchParams.get('datetime');
    
    if (!datetimeParam) {
      return corsResponse(
        { error: 'datetime parameter is required. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)' },
        400
      );
    }

    const bookingDateTime = new Date(datetimeParam);
    if (isNaN(bookingDateTime.getTime())) {
      return corsResponse(
        { error: 'Invalid datetime format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)' },
        400
      );
    }

    const canBook = await DatabaseService.canBookAtTime(bookingDateTime);
    const isOpen = await DatabaseService.isShopOpen(bookingDateTime);
    const config = await DatabaseService.getCompanyConfig();

    const now = new Date();
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return corsResponse({
      success: true,
      data: {
        can_book: canBook,
        is_shop_open: isOpen,
        booking_datetime: bookingDateTime.toISOString(),
        hours_until_booking: Math.round(hoursUntilBooking * 100) / 100,
        min_advance_hours: config?.booking_advance_hours || 1,
        meets_advance_requirement: hoursUntilBooking >= (config?.booking_advance_hours || 1),
        currency: config?.currency || 'BHD'
      }
    });
  } catch (error) {
    console.error('Error checking booking availability:', error);
    return corsResponse(
      { error: 'Failed to check booking availability' },
      500
    );
  }
}
