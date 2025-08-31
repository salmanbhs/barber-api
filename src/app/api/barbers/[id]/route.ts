import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

// GET barber by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // TODO: Replace with actual database query
    const mockBarber = {
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
    };

    if (id !== '1' && id !== '2') {
      return corsResponse(
        { error: 'Barber not found' },
        404
      );
    }

    return corsResponse({
      message: 'Barber retrieved successfully',
      data: mockBarber
    });

  } catch (error) {
    console.error('Get barber error:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}

// PUT - Update barber
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    let updateData;
    try {
      updateData = await request.json();
    } catch {
      return corsResponse(
        { error: 'Invalid JSON body' },
        400
      );
    }

    // TODO: Replace with actual database update
    if (id !== '1' && id !== '2') {
      return corsResponse(
        { error: 'Barber not found' },
        404
      );
    }

    const updatedBarber = {
      id,
      name: updateData.name || 'John Smith',
      email: updateData.email || 'john@barbershop.com',
      phone: updateData.phone || '+1234567890',
      specialties: updateData.specialties || ['haircut', 'beard', 'styling'],
      experience: updateData.experience || 5,
      rating: updateData.rating || 4.8,
      availability: updateData.availability || {},
      profileImage: updateData.profileImage || null,
      isActive: updateData.isActive !== undefined ? updateData.isActive : true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: new Date().toISOString()
    };

    return corsResponse({
      message: 'Barber updated successfully',
      data: updatedBarber
    });

  } catch (error) {
    console.error('Update barber error:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}

// DELETE - Delete/deactivate barber
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // TODO: Replace with actual database deletion/deactivation
    if (id !== '1' && id !== '2') {
      return corsResponse(
        { error: 'Barber not found' },
        404
      );
    }

    return corsResponse({
      message: 'Barber deleted successfully',
      data: { id, deletedAt: new Date().toISOString() }
    });

  } catch (error) {
    console.error('Delete barber error:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
