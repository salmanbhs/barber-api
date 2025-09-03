import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';
import { requireStaff } from '@/lib/auth';

export async function OPTIONS() {
  return corsOptions();
}

// Cache for 24 hours, revalidate when data changes
export const revalidate = 86400; // 24 hours in seconds
export const dynamic = 'force-cache'; // Enable static generation with caching

// GET all barbers (public access for basic info, staff for full details)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const includePrivateData = url.searchParams.get('private') === 'true';

    // If requesting private data, require staff authentication
    if (includePrivateData) {
      const auth = await requireStaff(request);
      if (!auth.success) return auth.response;
      
      // Don't cache private data - fetch fresh
      const barbersWithPrivateData = await DatabaseService.getAllBarbers();
      return corsResponse({
        message: 'Barbers retrieved successfully',
        data: {
          barbers: barbersWithPrivateData,
          count: barbersWithPrivateData.length,
          access_level: 'staff'
        },
        cached: false,
        cache_info: {
          strategy: 'no_cache_for_private_data',
          reason: 'Contains sensitive information'
        }
      });
    }

    // For public data, use cached version
    const cachedBarbers = await getCachedPublicBarbers();
    
    return corsResponse({
      message: 'Barbers retrieved successfully',
      data: {
        barbers: cachedBarbers,
        count: cachedBarbers.length,
        access_level: 'public'
      },
      cached: true,
      cache_info: {
        strategy: 'next_js_static_generation',
        revalidate: '24_hours',
        last_generated: new Date().toISOString()
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

// Cached function for public barber data
async function getCachedPublicBarbers() {
  console.log('Fetching barbers data for static generation...');
  const barbers = await DatabaseService.getAllBarbers();
  
  // Filter to public data only and sort by rating
  return barbers
    .map(barber => ({
      id: barber.id,
      user: {
        name: barber.user?.name,
        email: barber.user?.email // Email can be public for contact
      },
      specialties: barber.specialties,
      experience_years: barber.experience_years,
      rating: barber.rating,
      bio: barber.bio,
      profile_image_url: barber.profile_image_url,
      hire_date: barber.hire_date
    }))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // Sort by rating descending
    .filter(barber => barber.user?.name); // Only include barbers with names
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
