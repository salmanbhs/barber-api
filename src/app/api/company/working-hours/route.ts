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
        working_hours: config.working_hours,
        holidays: config.holidays
      }
    });
  } catch (error) {
    console.error('Error fetching working hours:', error);
    return corsResponse(
      { error: 'Failed to fetch working hours' },
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

    const body = await request.json();
    const { working_hours } = body;
    
    if (!working_hours) {
      return corsResponse(
        { error: 'Working hours data is required' },
        400
      );
    }

    const updatedConfig = await DatabaseService.updateWorkingHours(working_hours);

    return corsResponse({
      success: true,
      data: {
        working_hours: updatedConfig.working_hours,
        holidays: updatedConfig.holidays
      },
      message: 'Working hours updated successfully'
    });
  } catch (error) {
    console.error('Error updating working hours:', error);
    return corsResponse(
      { error: 'Failed to update working hours' },
      500
    );
  }
}
