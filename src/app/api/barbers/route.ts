import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

// GET all barbers
export async function GET() {
  try {
    // TODO: Replace with actual database query
    const mockBarbers = [
      {
        id: '1',
        name: 'John Smith',
        email: 'john@barbershop.com',
        phone: '+1234567890',
        specialties: ['haircut', 'beard', 'styling'],
        experience: 5,
        rating: 4.8,
        availability: {
          monday: '9:00-18:00',
          tuesday: '9:00-18:00',
          wednesday: '9:00-18:00',
          thursday: '9:00-18:00',
          friday: '9:00-18:00',
          saturday: '10:00-16:00',
          sunday: 'closed'
        },
        profileImage: null,
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-08-30T15:30:00Z'
      },
      {
        id: '2',
        name: 'Mike Johnson',
        email: 'mike@barbershop.com',
        phone: '+1234567891',
        specialties: ['haircut', 'fade', 'beard'],
        experience: 8,
        rating: 4.9,
        availability: {
          monday: '10:00-19:00',
          tuesday: '10:00-19:00',
          wednesday: '10:00-19:00',
          thursday: '10:00-19:00',
          friday: '10:00-19:00',
          saturday: '9:00-17:00',
          sunday: '11:00-15:00'
        },
        profileImage: null,
        isActive: true,
        createdAt: '2024-02-01T09:00:00Z',
        updatedAt: '2024-08-30T14:15:00Z'
      }
    ];

    return corsResponse({
      message: 'Barbers retrieved successfully',
      data: mockBarbers,
      total: mockBarbers.length
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
