import { NextRequest } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { corsOptions, corsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  try {
    // Test the exact case you're having trouble with
    const testDate = new Date('2025-09-10T11:00:00.000Z');
    
    // Get all the relevant information
    const config = await DatabaseService.getCompanyConfig();
    const canBook = await DatabaseService.canBookAtTime(testDate);
    const isOpen = await DatabaseService.isShopOpen(testDate);
    const fallbackResult = await DatabaseService.isShopOpenFallback(testDate);
    
    const dayName = testDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySchedule = config?.working_hours[dayName as keyof typeof config.working_hours];
    const targetTime = `${testDate.getUTCHours().toString().padStart(2, '0')}:${testDate.getUTCMinutes().toString().padStart(2, '0')}`;
    
    return corsResponse({
      success: true,
      data: {
        test_case: 'Wednesday September 10, 2025 at 11:00 AM',
        test_datetime: '2025-09-10T11:00:00.000Z',
        parsed_date: testDate.toISOString(),
        day_name: dayName,
        target_time: targetTime,
        
        // Results
        can_book: canBook,
        is_shop_open_rpc: isOpen,
        is_shop_open_fallback: fallbackResult,
        
        // Configuration
        has_config: !!config,
        advance_hours_required: config?.booking_advance_hours || 1,
        day_schedule: daySchedule,
        
        // All working hours for reference
        all_working_hours: config?.working_hours,
        
        // Shift check details
        shift_analysis: daySchedule?.shifts?.map(shift => ({
          shift: shift,
          time_in_range: targetTime >= shift.start && targetTime <= shift.end,
          comparison: `${shift.start} <= ${targetTime} <= ${shift.end}`
        }))
      }
    });

  } catch (error) {
    console.error('Error in Wednesday test:', error);
    return corsResponse(
      { 
        success: false, 
        error: 'Failed to test Wednesday case',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}
