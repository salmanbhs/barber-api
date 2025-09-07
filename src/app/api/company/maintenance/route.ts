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
        maintenance_mode: config.maintenance_mode,
        maintenance_message: config.maintenance_message
      }
    });
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    return corsResponse(
      { error: 'Failed to fetch maintenance status' },
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
    const { maintenance_mode, maintenance_message } = body;
    
    if (typeof maintenance_mode !== 'boolean') {
      return corsResponse(
        { error: 'maintenance_mode must be a boolean value' },
        400
      );
    }

    const updatedConfig = await DatabaseService.setMaintenanceMode(
      maintenance_mode, 
      maintenance_message
    );

    return corsResponse({
      success: true,
      data: {
        maintenance_mode: updatedConfig.maintenance_mode,
        maintenance_message: updatedConfig.maintenance_message
      },
      message: `Maintenance mode ${maintenance_mode ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error updating maintenance mode:', error);
    return corsResponse(
      { error: 'Failed to update maintenance mode' },
      500
    );
  }
}
