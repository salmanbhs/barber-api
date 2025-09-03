import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';
import { requireStaff } from '@/lib/auth';

export async function OPTIONS() {
  return corsOptions();
}

// Cache individual barber pages for 1 hour, revalidate every 6 hours
export const revalidate = 21600; // 6 hours in seconds

// GET single barber (public access for basic info, staff for full details)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const includePrivateData = url.searchParams.get('private') === 'true';

    // If requesting private data, require staff authentication
    if (includePrivateData) {
      const auth = await requireStaff(request);
      if (!auth.success) return auth.response;
    }

    const barber = await DatabaseService.getBarberById(id);

    if (!barber) {
      return corsResponse(
        { error: 'Barber not found' },
        404
      );
    }

    // Filter data based on access level
    const barberData = includePrivateData ? barber : {
      id: barber.id,
      user: {
        name: barber.user?.name,
        email: barber.user?.email // Email can be public for contact
      },
      specialties: barber.specialties,
      experience_years: barber.experience_years,
      rating: barber.rating,
      bio: barber.bio,
      profile_image_url: barber.profile_image_url
    };

    return corsResponse({
      message: 'Barber retrieved successfully',
      data: barberData,
      access_level: includePrivateData ? 'staff' : 'public',
      cached: !includePrivateData,
      cache_info: includePrivateData ? undefined : {
        strategy: 'next_js_static_generation',
        revalidate: '6_hours'
      }
    });
  } catch (error) {
    console.error('Get barber error:', error);
    return corsResponse(
      { error: 'Failed to retrieve barber', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}

// PUT - Update barber (admin or own profile)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    
    // Get the barber to check ownership
    const barber = await DatabaseService.getBarberById(id);
    if (!barber) {
      return corsResponse({ error: 'Barber not found' }, 404);
    }

    // Check if user can edit this barber (admin or own profile)
    const canEdit = auth.user.role === 'admin' || barber.user_id === auth.user.dbUser.id;
    if (!canEdit) {
      return corsResponse({ error: 'You can only edit your own profile' }, 403);
    }

    const allowedUpdates = ['specialties', 'experience_years', 'bio'];
    const updates: Record<string, string | string[] | number> = {};
    
    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return corsResponse(
        { error: 'No valid fields to update' },
        400
      );
    }

    const updatedBarber = await DatabaseService.updateBarber(id, updates);

    return corsResponse({
      message: 'Barber updated successfully',
      data: updatedBarber
    });

  } catch (error) {
    console.error('Update barber error:', error);
    return corsResponse(
      { error: 'Failed to update barber', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
