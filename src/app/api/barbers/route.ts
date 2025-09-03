import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';
import { requireStaff } from '@/lib/auth';

export async function OPTIONS() {
  return corsOptions();
}

// GET all barbers (public access - anyone can view active barbers)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const includePrivateData = url.searchParams.get('private') === 'true';

    // If requesting private data, require staff authentication
    if (includePrivateData) {
      const auth = await requireStaff(request);
      if (!auth.success) return auth.response;
    }

    const barbers = await DatabaseService.getAllBarbers();

    // Filter data based on access level
    const publicBarbers = barbers.map(barber => {
      if (includePrivateData) {
        // Return full data for authenticated staff
        return barber;
      } else {
        // Return only public information for unauthenticated users
        return {
          id: barber.id,
          user: {
            name: barber.user?.name
          },
          specialties: barber.specialties,
          experience_years: barber.experience_years,
          rating: barber.rating,
          bio: barber.bio,
          profile_image_url: barber.profile_image_url
        };
      }
    });

    return corsResponse({
      message: 'Barbers retrieved successfully',
      data: {
        barbers: publicBarbers,
        count: publicBarbers.length,
        access_level: includePrivateData ? 'staff' : 'public'
      }
    });
  } catch (error) {
    console.error('Get barbers error:', error);
    return corsResponse(
      { error: 'Failed to retrieve barbers', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}

// POST - Create new barber (admin only)
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.success) return auth.response;

  // Only admin can create barbers
  if (auth.user.role !== 'admin') {
    return corsResponse({ error: 'Only admins can create barbers' }, 403);
  }

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.user_id) {
      return corsResponse(
        { error: 'Missing required field: user_id' },
        400
      );
    }

    const barberData = {
      user_id: body.user_id,
      specialties: body.specialties || [],
      experience_years: body.experience_years || 0,
      bio: body.bio
    };

    const barber = await DatabaseService.createBarber(barberData);

    return corsResponse(
      {
        message: 'Barber created successfully',
        data: barber
      },
      201
    );
  } catch (error) {
    console.error('Create barber error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('unique') && error.message.includes('user_id')) {
        return corsResponse(
          { error: 'User is already a barber' },
          400
        );
      }
    }

    return corsResponse(
      { error: 'Failed to create barber', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
