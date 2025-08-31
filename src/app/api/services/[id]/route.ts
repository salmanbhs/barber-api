import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

// GET service by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // TODO: Replace with actual database query
    const mockServices = {
      '1': {
        id: '1',
        name: 'Classic Haircut',
        description: 'Traditional haircut with scissors and clipper',
        duration: 30,
        price: 25.00,
        category: 'haircut',
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-08-30T15:30:00Z'
      },
      '2': {
        id: '2',
        name: 'Beard Trim',
        description: 'Professional beard trimming and shaping',
        duration: 20,
        price: 15.00,
        category: 'beard',
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-08-30T15:30:00Z'
      },
      '3': {
        id: '3',
        name: 'Premium Styling',
        description: 'Complete hair styling with premium products',
        duration: 45,
        price: 40.00,
        category: 'styling',
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-08-30T15:30:00Z'
      }
    };

    const service = mockServices[id as keyof typeof mockServices];
    
    if (!service) {
      return corsResponse(
        { error: 'Service not found' },
        404
      );
    }

    return corsResponse({
      message: 'Service retrieved successfully',
      data: service
    });

  } catch (error) {
    console.error('Get service error:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}

// PUT - Update service
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
    // Check if service exists
    const mockServiceIds = ['1', '2', '3', '4', '5'];
    if (!mockServiceIds.includes(id)) {
      return corsResponse(
        { error: 'Service not found' },
        404
      );
    }

    // Validate duration and price if provided
    if (updateData.duration !== undefined) {
      if (typeof updateData.duration !== 'number' || updateData.duration <= 0) {
        return corsResponse(
          { error: 'Duration must be a positive number' },
          400
        );
      }
    }

    if (updateData.price !== undefined) {
      if (typeof updateData.price !== 'number' || updateData.price <= 0) {
        return corsResponse(
          { error: 'Price must be a positive number' },
          400
        );
      }
    }

    const updatedService = {
      id,
      name: updateData.name || 'Classic Haircut',
      description: updateData.description || 'Traditional haircut with scissors and clipper',
      duration: updateData.duration || 30,
      price: updateData.price ? parseFloat(updateData.price.toFixed(2)) : 25.00,
      category: updateData.category || 'haircut',
      isActive: updateData.isActive !== undefined ? updateData.isActive : true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: new Date().toISOString()
    };

    return corsResponse({
      message: 'Service updated successfully',
      data: updatedService
    });

  } catch (error) {
    console.error('Update service error:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}

// DELETE - Delete/deactivate service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // TODO: Replace with actual database deletion/deactivation
    const mockServiceIds = ['1', '2', '3', '4', '5'];
    if (!mockServiceIds.includes(id)) {
      return corsResponse(
        { error: 'Service not found' },
        404
      );
    }

    return corsResponse({
      message: 'Service deleted successfully',
      data: { id, deletedAt: new Date().toISOString() }
    });

  } catch (error) {
    console.error('Delete service error:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
