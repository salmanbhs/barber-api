import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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
        register: '/api/auth/register',
        login: '/api/auth/login',
        verifyOtp: '/api/auth/verify-otp',
        logout: '/api/auth/logout'
      }
    }
  };

  return NextResponse.json(info, { status: 200 });
}
