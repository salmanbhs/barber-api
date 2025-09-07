import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { corsOptions, corsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  try {
    const config = await DatabaseService.getCompanyConfig();
    
    if (!config) {
      return corsResponse(
        { error: 'Company configuration not found' },
        404
      );
    }

    return corsResponse({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching company config:', error);
    return corsResponse(
      { error: 'Failed to fetch company configuration' },
      500
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if user is admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return corsResponse(
        { error: 'Authorization header required' },
        401
      );
    }

    // Extract user ID from auth header (you might need to adjust this based on your auth implementation)
    const token = authHeader.replace('Bearer ', '');
    // You'll need to implement token verification here based on your auth system
    
    const body = await request.json();
    
    const updatedConfig = await DatabaseService.updateCompanyConfig(body);

    return corsResponse({
      success: true,
      data: updatedConfig,
      message: 'Company configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating company config:', error);
    return corsResponse(
      { error: 'Failed to update company configuration' },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return corsResponse(
        { error: 'Authorization header required' },
        401
      );
    }

    const body = await request.json();
    
    const newConfig = await DatabaseService.createCompanyConfig(body);

    return corsResponse({
      success: true,
      data: newConfig,
      message: 'Company configuration created successfully'
    }, 201);
  } catch (error) {
    console.error('Error creating company config:', error);
    return corsResponse(
      { error: 'Failed to create company configuration' },
      500
    );
  }
}
