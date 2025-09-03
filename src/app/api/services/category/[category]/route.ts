import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';

export async function OPTIONS() {
  return corsOptions();
}

// Cache category services for 1 hour
export const revalidate = 3600; // 1 hour in seconds

// GET services by category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;
    
    console.log(`📋 Fetching services for category: ${category}`);
    
    const services = await DatabaseService.getServicesByCategory(category);

    return corsResponse({
      message: `Services in category '${category}' retrieved successfully`,
      data: {
        services,
        count: services.length,
        category,
        access_level: 'public'
      }
    });

  } catch (error) {
    console.error('Get category services error:', error);
    return corsResponse(
      { error: 'Failed to retrieve category services', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
