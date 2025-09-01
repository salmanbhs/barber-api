import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';

export async function OPTIONS() {
  return corsOptions();
}

// GET all barbers and services
export async function GET(request: NextRequest) {
  try {
    // Get all barbers from database
    const barbers = await DatabaseService.getAllBarbers();
    
    // Get all services from database
    const services = await DatabaseService.getAllServices();

    return corsResponse({
      message: 'Barbers and services retrieved successfully',
      data: {
        barbers: barbers.map(barber => ({
          ...barber,
          profileImage: barber.profile_image_url
        })),
        services
      }
    });

  } catch (error) {
    console.error('Get barbers and services error:', error);
    return corsResponse(
      { error: 'Failed to retrieve barbers and services', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
