import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

// GET all services
export async function GET() {
  try {
    // TODO: Replace with actual database query
    const mockServices = [
      {
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
      {
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
      {
        id: '3',
        name: 'Premium Styling',
        description: 'Complete hair styling with premium products',
        duration: 45,
        price: 40.00,
        category: 'styling',
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-08-30T15:30:00Z'
      },
      {
        id: '4',
        name: 'Fade Cut',
        description: 'Modern fade haircut with precise blending',
        duration: 35,
        price: 30.00,
        category: 'haircut',
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-08-30T15:30:00Z'
      },
      {
        id: '5',
        name: 'Hot Towel Shave',
        description: 'Traditional hot towel shave experience',
        duration: 25,
        price: 20.00,
        category: 'shave',
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-08-30T15:30:00Z'
      }
    ];

    return corsResponse({
      message: 'Services retrieved successfully',
      data: mockServices,
      total: mockServices.length
    });

  } catch (error) {
    console.error('Get services error:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}

// POST - Create new service
export async function POST(request: NextRequest) {
  try {
    let serviceData;
    try {
      serviceData = await request.json();
    } catch {
      return corsResponse(
        { error: 'Invalid JSON body' },
        400
      );
    }

    // Validate required fields
    const { name, duration, price, category } = serviceData;
    if (!name || !duration || !price || !category) {
      return corsResponse(
        { error: 'Missing required fields: name, duration, price, category' },
        400
      );
    }

    // Validate duration and price are numbers
    if (typeof duration !== 'number' || typeof price !== 'number') {
      return corsResponse(
        { error: 'Duration and price must be numbers' },
        400
      );
    }

    // Validate price is positive
    if (price <= 0) {
      return corsResponse(
        { error: 'Price must be greater than 0' },
        400
      );
    }

    // Validate duration is positive
    if (duration <= 0) {
      return corsResponse(
        { error: 'Duration must be greater than 0' },
        400
      );
    }

    // TODO: Replace with actual database insertion
    const newService = {
      id: Date.now().toString(), // Generate proper ID in production
      name,
      description: serviceData.description || '',
      duration,
      price: parseFloat(price.toFixed(2)), // Ensure 2 decimal places
      category,
      isActive: serviceData.isActive !== undefined ? serviceData.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return corsResponse({
      message: 'Service created successfully',
      data: newService
    }, 201);

  } catch (error) {
    console.error('Create service error:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
