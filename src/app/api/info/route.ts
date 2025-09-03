import { corsResponse, corsOptions } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  const info = {
    name: 'Barber API',
    version: '0.2.0',
    description: 'A barbershop management API with role-based authentication',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      roles: ['admin', 'barber', 'customer'],
      authentication: 'SMS OTP + Role-based',
      database: 'Supabase PostgreSQL'
    },
    endpoints: {
      info: '/api/info',
      auth: {
        sendOtp: '/api/auth/send-otp',
        verifyOtp: '/api/auth/verify-otp',
        logout: '/api/auth/logout',
        userInfo: 'GET /api/auth/me'
      },
      customers: {
        list: 'GET /api/customers (staff only)',
        create: 'POST /api/customers (staff only)',
        profile: 'GET /api/customers/profile (customer only)'
      },
      barbers: {
        list: 'GET /api/barbers (public access)',
        listPrivate: 'GET /api/barbers?private=true (staff only)',
        view: 'GET /api/barbers/{id} (public access)',
        viewPrivate: 'GET /api/barbers/{id}?private=true (staff only)',
        create: 'POST /api/barbers (admin only)',
        profile: 'GET /api/barbers/profile (barber only)',
        update: 'PUT /api/barbers/{id} (admin or own profile)'
      },
      admin: {
        users: 'GET /api/admin/users (admin only)',
        createUser: 'POST /api/admin/users (admin only)',
        updateRole: 'PUT /api/admin/users/{id} (admin only)',
        deactivateUser: 'DELETE /api/admin/users/{id} (admin only)'
      }
    },
    sampleUsers: {
      admin: '+973admin',
      barbers: ['+973barber1', '+973barber2', '+973barber3'],
      note: 'Any new phone number gets customer role by default'
    }
  };

  return corsResponse(info);
}
