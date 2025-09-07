import { corsOptions, corsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  return corsResponse({
    message: 'Barber API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      services: '/api/services',
      bookings: '/api/bookings',
      barbers: '/api/barbers'
    }
  });
}
