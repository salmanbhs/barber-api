import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';
import { requireStaff } from '@/lib/auth';

export async function OPTIONS() {
  return corsOptions();
}

// No caching for staff data (contains inactive services)
export const dynamic = 'force-dynamic';

// GET all services including inactive (staff only)
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.success) return auth.response;

  try {
    console.log('🔒 Fetching all services including inactive (staff access)');
    
    const services = await DatabaseService.getAllServices(true); // Include inactive
    
    // Group services by category
    const servicesByCategory = services.reduce((acc, service) => {
      const cat = service.category || 'other';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(service);
      return acc;
    }, {} as Record<string, typeof services>);

    // Separate active and inactive counts
    const activeCount = services.filter(s => s.is_active).length;
    const inactiveCount = services.filter(s => !s.is_active).length;

    return corsResponse({
      message: 'All services retrieved successfully (staff access)',
      data: {
        services,
        servicesByCategory,
        count: services.length,
        activeCount,
        inactiveCount,
        categories: Object.keys(servicesByCategory).sort(),
        access_level: 'staff'
      }
    });

  } catch (error) {
    console.error('Get all services error:', error);
    return corsResponse(
      { error: 'Failed to retrieve all services', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
