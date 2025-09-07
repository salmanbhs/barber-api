import { NextRequest } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { corsOptions, corsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    let checkDate = new Date();
    if (dateParam) {
      checkDate = new Date(dateParam);
      if (isNaN(checkDate.getTime())) {
        return corsResponse(
          { error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)' },
          400
        );
      }
    }

    const isOpen = await DatabaseService.isShopOpen(checkDate);
    const workingHours = await DatabaseService.getWorkingHoursForDate(checkDate);

    return corsResponse({
      success: true,
      data: {
        is_open: isOpen,
        check_date: checkDate.toISOString(),
        day_schedule: workingHours
      }
    });
  } catch (error) {
    console.error('Error checking shop status:', error);
    return corsResponse(
      { error: 'Failed to check shop status' },
      500
    );
  }
}
