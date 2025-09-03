import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';
import { requireAdmin } from '@/lib/auth';

export async function OPTIONS() {
  return corsOptions();
}

// MAXIMUM caching with auto-revalidation on data changes
export const revalidate = 2592000; // 30 days (maximum practical cache time)

// GET all active services - Simple approach for better caching
export async function GET() {
  try {
    console.log('🔄 Fetching services...');
    
    const services = await DatabaseService.getAllServices();
    
    // Group services by category for easier consumption
    const servicesByCategory = services.reduce((acc, service) => {
      const cat = service.category || 'other';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(service);
      return acc;
    }, {} as Record<string, typeof services>);

    const response = corsResponse({
      message: 'Services retrieved successfully',
      data: {
        services,
        servicesByCategory,
        count: services.length,
        categories: Object.keys(servicesByCategory).sort(),
        access_level: 'public'
      }
    });

    // Add cache headers that Vercel should respect
    response.headers.set('Cache-Control', 'public, s-maxage=86400, max-age=3600');
    
    return response;

  } catch (error) {
    console.error('Get services error:', error);
    return corsResponse(
      { error: 'Failed to retrieve services', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}

// POST - Create new service (admin only)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.price || !body.duration_minutes) {
      return corsResponse(
        { error: 'Missing required fields: name, price, duration_minutes' },
        400
      );
    }

    // Validate price and duration are positive numbers
    if (body.price <= 0 || body.duration_minutes <= 0) {
      return corsResponse(
        { error: 'Price and duration must be positive numbers' },
        400
      );
    }

    const serviceData = {
      name: body.name.trim(),
      description: body.description?.trim(),
      price: parseFloat(body.price),
      duration_minutes: parseInt(body.duration_minutes),
      category: body.category?.trim()?.toLowerCase()
    };

    const service = await DatabaseService.createService(serviceData);

    // Automatically revalidate services cache after creating new service
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/api/services');
    console.log('✅ Cache revalidated after service creation');

    return corsResponse(
      {
        message: 'Service created successfully',
        data: service
      },
      201
    );
  } catch (error) {
    console.error('Create service error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('unique') && error.message.includes('name')) {
        return corsResponse(
          { error: 'Service with this name already exists' },
          400
        );
      }
    }

    return corsResponse(
      { error: 'Failed to create service', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
