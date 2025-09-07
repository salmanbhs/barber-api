import { NextRequest } from 'next/server';
import { corsOptions, corsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(request: NextRequest) {
  return corsResponse({ error: 'Register endpoint not implemented' }, 501);
}