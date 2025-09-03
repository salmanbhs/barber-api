import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService, UserRole } from '@/lib/database';
import { requireAdmin } from '@/lib/auth';

export async function OPTIONS() {
  return corsOptions();
}

// GET all users (admin only)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const url = new URL(request.url);
    const role = url.searchParams.get('role') as UserRole;

    let users;
    if (role) {
      users = await DatabaseService.getUsersByRole(role);
    } else {
      users = await DatabaseService.getAllUsers();
    }

    return corsResponse({
      message: 'Users retrieved successfully',
      data: {
        users,
        count: users.length,
        filter: role ? { role } : 'all'
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return corsResponse(
      { error: 'Failed to retrieve users', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}

// POST - Create new user (admin only)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.phone || !body.role) {
      return corsResponse(
        { error: 'Missing required fields: name, phone, role' },
        400
      );
    }

    // Validate role
    if (!['admin', 'barber', 'customer'].includes(body.role)) {
      return corsResponse(
        { error: 'Invalid role. Must be: admin, barber, or customer' },
        400
      );
    }

    const userData = {
      name: body.name,
      phone: body.phone,
      email: body.email,
      role: body.role as UserRole
    };

    const user = await DatabaseService.createOrUpdateUser(userData);

    // If creating a barber, also create barber profile
    if (body.role === 'barber' && body.barber_data) {
      const barberData = {
        user_id: user.id,
        specialties: body.barber_data.specialties || [],
        experience_years: body.barber_data.experience_years || 0,
        bio: body.barber_data.bio
      };

      await DatabaseService.createBarber(barberData);
    }

    return corsResponse(
      {
        message: 'User created successfully',
        data: user
      },
      201
    );
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('unique') && error.message.includes('phone')) {
        return corsResponse(
          { error: 'Phone number already registered' },
          400
        );
      }
      if (error.message.includes('unique') && error.message.includes('email')) {
        return corsResponse(
          { error: 'Email address already registered' },
          400
        );
      }
    }

    return corsResponse(
      { error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
