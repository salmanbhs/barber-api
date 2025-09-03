import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';
import { requireStaff } from '@/lib/auth';

export async function OPTIONS() {
  return corsOptions();
}

// GET - Get barber's own profile (barber only)
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.success) return auth.response;

  // Only barbers can access this endpoint
  if (auth.user.role !== 'barber') {
    return corsResponse(
      { error: 'This endpoint is for barbers only' },
      403
    );
  }

  try {
    const barber = await DatabaseService.getBarberByUserId(auth.user.dbUser.id);
    
    if (!barber) {
      return corsResponse(
        { error: 'Barber profile not found' },
        404
      );
    }

    return corsResponse({
      message: 'Barber profile retrieved successfully',
      data: {
        barber,
        user: auth.user.dbUser
      }
    });

  } catch (error) {
    console.error('Get barber profile error:', error);
    return corsResponse(
      { error: 'Failed to retrieve barber profile', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}

// PUT - Update barber's own profile (barber only)
export async function PUT(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.success) return auth.response;

  // Only barbers can update their own profile
  if (auth.user.role !== 'barber') {
    return corsResponse(
      { error: 'This endpoint is for barbers only' },
      403
    );
  }

  try {
    const body = await request.json();

    const barber = await DatabaseService.getBarberByUserId(auth.user.dbUser.id);
    if (!barber) {
      return corsResponse(
        { error: 'Barber profile not found' },
        404
      );
    }

    // Update barber data
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

    const updatedBarber = await DatabaseService.updateBarber(barber.id, updates);

    return corsResponse({
      message: 'Barber profile updated successfully',
      data: updatedBarber
    });

  } catch (error) {
    console.error('Update barber profile error:', error);
    return corsResponse(
      { error: 'Failed to update barber profile', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
