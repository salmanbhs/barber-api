import { corsResponse, corsOptions } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  const info = {
    name: 'Barber API',
    version: '0.1.0',
    description: 'A barbershop management API',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      info: '/api/info',
      auth: {
        sendOtp: '/api/auth/send-otp',
        verifyOtp: '/api/auth/verify-otp',
        logout: '/api/auth/logout'
      },
      barbers: {
        list: 'GET /api/barbers',
        create: 'POST /api/barbers',
        getById: 'GET /api/barbers/{id}',
        update: 'PUT /api/barbers/{id}',
        delete: 'DELETE /api/barbers/{id}'
      },
      services: {
        list: 'GET /api/services',
        create: 'POST /api/services',
        getById: 'GET /api/services/{id}',
        update: 'PUT /api/services/{id}',
        delete: 'DELETE /api/services/{id}'
      }
    }
  };

  return corsResponse(info);
}
