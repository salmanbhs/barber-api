import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { corsResponse, corsOptions } from '@/lib/cors';
import { requireAdmin } from '@/lib/auth';

export async function OPTIONS() {
  return corsOptions();
}

// POST /api/revalidate - Revalidate cached paths (admin only)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const body = await request.json();
    const { path } = body;

    if (!path) {
      return corsResponse({ error: 'Path is required' }, 400);
    }

    // Revalidate the specified path
    revalidatePath(path);
    
    console.log(`✅ Revalidated cache for: ${path} by admin: ${auth.user.dbUser.name}`);

    return corsResponse({
      message: `Cache revalidated successfully for ${path}`,
      revalidated: true,
      path,
      revalidated_by: auth.user.dbUser.name,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Revalidation error:', error);
    return corsResponse(
      { 
        error: 'Failed to revalidate cache', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      500
    );
  }
}

// GET /api/revalidate - Support GET requests with query params (admin only)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const url = new URL(request.url);
    const path = url.searchParams.get('path');

    if (!path) {
      return corsResponse({ error: 'Path parameter is required' }, 400);
    }

    // Revalidate the specified path
    revalidatePath(path);
    
    console.log(`✅ Revalidated cache for: ${path} by admin: ${auth.user.dbUser.name}`);

    return corsResponse({
      message: `Cache revalidated successfully for ${path}`,
      revalidated: true,
      path,
      revalidated_by: auth.user.dbUser.name,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Revalidation error:', error);
    return corsResponse(
      { 
        error: 'Failed to revalidate cache', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      500
    );
  }
}


