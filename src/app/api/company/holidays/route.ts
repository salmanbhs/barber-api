import { NextRequest } from 'next/server';
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
      data: {
        holidays: config.holidays
      }
    });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return corsResponse(
      { error: 'Failed to fetch holidays' },
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
    const { date, name, isRecurring, customHours } = body;
    
    if (!date || !name) {
      return corsResponse(
        { error: 'Date and name are required fields' },
        400
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return corsResponse(
        { error: 'Date must be in YYYY-MM-DD format' },
        400
      );
    }

    const holiday = {
      date,
      name,
      isRecurring: isRecurring || false,
      customHours: customHours || []
    };

    const updatedConfig = await DatabaseService.addHoliday(holiday);

    return corsResponse({
      success: true,
      data: {
        holidays: updatedConfig.holidays
      },
      message: 'Holiday added successfully'
    }, 201);
  } catch (error) {
    console.error('Error adding holiday:', error);
    return corsResponse(
      { error: 'Failed to add holiday' },
      500
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if user is admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return corsResponse(
        { error: 'Authorization header required' },
        401
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return corsResponse(
        { error: 'Date parameter is required' },
        400
      );
    }

    const updatedConfig = await DatabaseService.removeHoliday(date);

    return corsResponse({
      success: true,
      data: {
        holidays: updatedConfig.holidays
      },
      message: 'Holiday removed successfully'
    });
  } catch (error) {
    console.error('Error removing holiday:', error);
    return corsResponse(
      { error: 'Failed to remove holiday' },
      500
    );
  }
}
