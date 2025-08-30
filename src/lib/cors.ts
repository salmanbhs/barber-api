import { NextResponse } from 'next/server';

// CORS headers for API responses
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// Create a response with CORS headers
export function corsResponse(data: any, status: number = 200) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders(),
  });
}

// Handle OPTIONS requests for CORS preflight
export function corsOptions() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}
