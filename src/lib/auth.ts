import { NextRequest } from 'next/server';
import { supabase } from './supabase';
import { DatabaseService, UserRole, User } from './database';
import { corsResponse } from './cors';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthenticatedUser {
  authUserId: string;
  user: SupabaseUser;
  dbUser: User;
  role: UserRole;
}

// Authenticate user and check if they have the required role(s)
export async function authenticateUserWithRole(
  request: NextRequest,
  requiredRoles: UserRole | UserRole[]
): Promise<{ success: false; response: Response } | { success: true; user: AuthenticatedUser }> {
  
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        response: corsResponse({ error: 'Authorization token required' }, 401)
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return {
        success: false,
        response: corsResponse({ error: 'Invalid or expired token' }, 401)
      };
    }

    // Get user data from our database
    const dbUser = await DatabaseService.getUserByAuthId(user.id);
    
    if (!dbUser) {
      return {
        success: false,
        response: corsResponse({ error: 'User not found in system' }, 404)
      };
    }

    if (!dbUser.is_active) {
      return {
        success: false,
        response: corsResponse({ error: 'User account is deactivated' }, 403)
      };
    }

    // Check role permissions
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    if (!roles.includes(dbUser.role)) {
      return {
        success: false,
        response: corsResponse(
          { 
            error: 'Insufficient permissions',
            required_roles: roles,
            user_role: dbUser.role
          }, 
          403
        )
      };
    }

    return {
      success: true,
      user: {
        authUserId: user.id,
        user,
        dbUser,
        role: dbUser.role
      }
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      response: corsResponse({ error: 'Authentication failed' }, 500)
    };
  }
}

// Authenticate user without role checking
export async function authenticateUser(
  request: NextRequest
): Promise<{ success: false; response: Response } | { success: true; user: AuthenticatedUser }> {
  
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        response: corsResponse({ error: 'Authorization token required' }, 401)
      };
    }

    const token = authHeader.substring(7);

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return {
        success: false,
        response: corsResponse({ error: 'Invalid or expired token' }, 401)
      };
    }

    // Get user data from our database
    const dbUser = await DatabaseService.getUserByAuthId(user.id);
    
    if (!dbUser) {
      return {
        success: false,
        response: corsResponse({ error: 'User not found in system' }, 404)
      };
    }

    if (!dbUser.is_active) {
      return {
        success: false,
        response: corsResponse({ error: 'User account is deactivated' }, 403)
      };
    }

    return {
      success: true,
      user: {
        authUserId: user.id,
        user,
        dbUser,
        role: dbUser.role
      }
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      response: corsResponse({ error: 'Authentication failed' }, 500)
    };
  }
}

// Helper to check if user is admin
export async function requireAdmin(request: NextRequest) {
  return authenticateUserWithRole(request, 'admin');
}

// Helper to check if user is admin or barber
export async function requireStaff(request: NextRequest) {
  return authenticateUserWithRole(request, ['admin', 'barber']);
}

// Helper to check if user is any authenticated user
export async function requireAuthenticated(request: NextRequest) {
  return authenticateUser(request);
}
