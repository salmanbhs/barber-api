import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function OPTIONS() {
  return corsOptions();
}

// POST - Customer Login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.phone || !body.password) {
      return corsResponse(
        { error: 'Phone and password are required' },
        400
      );
    }

    // Find customer by phone
    const customer = await DatabaseService.getCustomerByPhone(body.phone);
    if (!customer) {
      return corsResponse(
        { error: 'Invalid phone number or password' },
        401
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(body.password, customer.password_hash || '');
    if (!isValidPassword) {
      return corsResponse(
        { error: 'Invalid phone number or password' },
        401
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        customer_id: customer.id, 
        phone: customer.phone,
        name: customer.name 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    // Update last login
    await DatabaseService.updateCustomer(customer.id, {
      last_login: new Date().toISOString()
    });

    // Remove sensitive data from response
    const { password_hash, ...customerData } = customer;

    return corsResponse({
      message: 'Login successful',
      data: {
        customer: customerData,
        token,
        expires_in: '30 days'
      }
    });

  } catch (error) {
    console.error('Customer login error:', error);
    return corsResponse(
      { error: 'Login failed', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
