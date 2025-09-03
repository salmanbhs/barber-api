import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';
import { requireStaff, requireAdmin } from '@/lib/auth';

export async function OPTIONS() {
  return corsOptions();
}

// Cache individual services for maximum time with auto-revalidation
export const revalidate = 2592000; // 30 days (auto-revalidated on updates)

// GET single service (public access)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const service = await DatabaseService.getServiceById(id);

    if (!service) {
      return corsResponse(
        { error: 'Service not found' },
        404
      );
    }

    // Hide inactive services from non-staff users
    if (!service.is_active) {
      const auth = await requireStaff(request);
      if (!auth.success) {
        return corsResponse(
          { error: 'Service not found' },
          404
        );
      }
    }

    return corsResponse({
      message: 'Service retrieved successfully',
      data: service
    });
  } catch (error) {
    console.error('Get service error:', error);
    return corsResponse(
      { error: 'Failed to retrieve service', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}

// PUT - Update service (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    
    // Check if service exists
    const service = await DatabaseService.getServiceById(id);
    if (!service) {
      return corsResponse({ error: 'Service not found' }, 404);
    }

    const allowedUpdates = ['name', 'description', 'price', 'duration_minutes', 'category', 'is_active'];
    const updates: Record<string, string | number | boolean> = {};
    
    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        if (field === 'name' || field === 'description' || field === 'category') {
          updates[field] = body[field]?.trim();
        } else if (field === 'price') {
          const price = parseFloat(body[field]);
          if (price <= 0) {
            return corsResponse({ error: 'Price must be a positive number' }, 400);
          }
          updates[field] = price;
        } else if (field === 'duration_minutes') {
          const duration = parseInt(body[field]);
          if (duration <= 0) {
            return corsResponse({ error: 'Duration must be a positive number' }, 400);
          }
          updates[field] = duration;
        } else {
          updates[field] = body[field];
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return corsResponse(
        { error: 'No valid fields to update' },
        400
      );
    }

    const updatedService = await DatabaseService.updateService(id, updates);

    // Automatically revalidate services cache after update
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/api/services');
    console.log('✅ Cache revalidated after service update');

    return corsResponse({
      message: 'Service updated successfully',
      data: updatedService
    });

  } catch (error) {
    console.error('Update service error:', error);
    return corsResponse(
      { error: 'Failed to update service', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}

// DELETE - Soft delete service (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    const url = new URL(request.url);
    const hardDelete = url.searchParams.get('hard') === 'true';
    
    // Check if service exists
    const service = await DatabaseService.getServiceById(id);
    if (!service) {
      return corsResponse({ error: 'Service not found' }, 404);
    }

    if (hardDelete) {
      await DatabaseService.hardDeleteService(id);
      
      // Revalidate cache after hard delete
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/api/services');
      console.log('✅ Cache revalidated after service hard delete');
      
      return corsResponse({
        message: 'Service permanently deleted successfully'
      });
    } else {
      await DatabaseService.deleteService(id);
      
      // Revalidate cache after soft delete
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/api/services');
      console.log('✅ Cache revalidated after service soft delete');
      
      return corsResponse({
        message: 'Service deactivated successfully'
      });
    }

  } catch (error) {
    console.error('Delete service error:', error);
    return corsResponse(
      { error: 'Failed to delete service', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
