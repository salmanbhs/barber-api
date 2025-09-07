import { NextRequest } from 'next/server';
import { corsOptions, corsResponse } from '@/lib/cors';
import { supabase } from '@/lib/supabase';

export async function OPTIONS() {
  return corsOptions();
}

export async function POST() {
  try {
    // Delete the problematic overlapping bookings, keeping only the first valid ones
    // Keep: 10:30-11:00 (valid), 11:00-11:30 (valid), 12:00-12:30 (valid)
    // Delete: duplicate 11:00-11:30 and overlapping 11:10-11:40
    const bookingsToDelete = [
      '244fd277-85a6-48a4-9cee-66506d396b06', // Duplicate 11:00-11:30 (salman 1)
      'aef17056-c1ed-431e-b9b0-adfcc4f18fc8'  // Overlapping 11:10-11:40 (salman 1)
    ];

    console.log('Attempting to delete bookings:', bookingsToDelete);

    const { data, error } = await supabase
      .from('bookings')
      .delete()
      .in('id', bookingsToDelete)
      .select();

    if (error) {
      console.error('Delete error:', error);
      return corsResponse({ success: false, error: error.message }, 500);
    }

    console.log('Deleted bookings:', data);

    return corsResponse({
      success: true,
      message: `Cleaned up ${data?.length || 0} overlapping bookings`,
      deleted_bookings: data,
      attempted_ids: bookingsToDelete
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return corsResponse(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}
