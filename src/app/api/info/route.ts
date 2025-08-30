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
      }
    }
  };

  return corsResponse(info);
}
