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
        primary_color: config.primary_color,
        secondary_color: config.secondary_color,
        accent_color: config.accent_color,
        background_color: config.background_color,
        text_color: config.text_color
      }
    });
  } catch (error) {
    console.error('Error fetching theme:', error);
    return corsResponse(
      { error: 'Failed to fetch theme configuration' },
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
    
    // Validate hex color format
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    const colorFields = ['primary_color', 'secondary_color', 'accent_color', 'background_color', 'text_color'];
    
    for (const field of colorFields) {
      if (body[field] && !hexColorRegex.test(body[field])) {
        return corsResponse(
          { error: `Invalid color format for ${field}. Use hex format like #FF0000` },
          400
        );
      }
    }

    const updatedConfig = await DatabaseService.updateTheme(body);

    return corsResponse({
      success: true,
      data: {
        primary_color: updatedConfig.primary_color,
        secondary_color: updatedConfig.secondary_color,
        accent_color: updatedConfig.accent_color,
        background_color: updatedConfig.background_color,
        text_color: updatedConfig.text_color
      },
      message: 'Theme updated successfully'
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    return corsResponse(
      { error: 'Failed to update theme configuration' },
      500
    );
  }
}
