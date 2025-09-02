import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';
import { DatabaseService } from '@/lib/database';

export async function OPTIONS() {
  return corsOptions();
}

// GET all customers
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const phone = url.searchParams.get('phone');

    // If phone is provided, search by phone
    if (phone) {
      const customer = await DatabaseService.getCustomerByPhone(phone);
      return corsResponse({
        message: customer ? 'Customer found' : 'Customer not found',
        data: customer,
        found: !!customer
      });
    }

    // Otherwise, get all customers
    const customers = await DatabaseService.getAllCustomers();

    return corsResponse({
      message: 'Customers retrieved successfully',
      data: {
        customers,
        count: customers.length
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    return corsResponse(
      { error: 'Failed to retrieve customers', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}

// POST - Create new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.phone) {
      return corsResponse(
        { error: 'Missing required fields: name, phone' },
        400
      );
    }

    // Check if customer already exists
    const existingCustomer = await DatabaseService.getCustomerByPhone(body.phone);
    if (existingCustomer) {
      return corsResponse(
        { error: 'Customer with this phone number already exists', data: existingCustomer },
        409
      );
    }

    const customerData = {
      name: body.name,
      phone: body.phone,
      email: body.email,
      date_of_birth: body.date_of_birth,
      address: body.address,
      notes: body.notes
    };

    const customer = await DatabaseService.createCustomer(customerData);

    return corsResponse(
      {
        message: 'Customer created successfully',
        data: customer
      },
      201
    );
  } catch (error) {
    console.error('Create customer error:', error);
    
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
      { error: 'Failed to create customer', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}
