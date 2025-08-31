import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';

export async function OPTIONS() {
  return corsOptions();
}

// GET all barbers
export async function GET() {
  try {
    const barbers = await DatabaseService.getAllBarbers();
    
    return corsResponse({
      message: 'Barbers retrieved successfully',
      data: barbers,
      total: barbers.length
    });

  } catch (error) {
    console.error('Get barbers error:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}

// POST - Create new barber
export async function POST(request: NextRequest) {
  try {
    let barberData;
    try {
      barberData = await request.json();
    } catch {
      return corsResponse(
        { error: 'Invalid JSON body' },
        400
      );
    }

    // Validate required fields
    const { name, email, phone, specialties } = barberData;
    if (!name || !email || !phone || !specialties) {
      return corsResponse(
        { error: 'Missing required fields: name, email, phone, specialties' },
        400
      );
    }

    // TODO: Replace with actual database insertion
    const newBarber = {
      id: Date.now().toString(), // Generate proper ID in production
      name,
      email,
      phone,
      specialties: Array.isArray(specialties) ? specialties : [specialties],
      experience: barberData.experience || 0,
      rating: 0, // Initial rating
      availability: barberData.availability || {},
      profileImage: barberData.profileImage || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return corsResponse({
      message: 'Barber created successfully',
      data: newBarber
    }, 201);

  } catch (error) {
    console.error('Create barber error:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
