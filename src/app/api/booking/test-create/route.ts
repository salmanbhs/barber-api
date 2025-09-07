import { NextRequest } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { corsOptions, corsResponse } from '@/lib/cors';
import { supabase } from '@/lib/supabase';

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barber_id, service_ids, appointment_date, appointment_time } = body;

    console.log('=== ACTUAL BOOKING TEST (NO AUTH) ===');
    
    // Support both single service_id (legacy) and service_ids array (new)
    let serviceIdsArray: string[];
    if (service_ids) {
      serviceIdsArray = Array.isArray(service_ids) ? service_ids : [service_ids];
    } else if (body.service_id) {
      // Legacy support
      serviceIdsArray = [body.service_id];
    } else {
      return corsResponse({
        success: false,
        error: 'Either service_ids (array) or service_id (single) must be provided'
      }, 400);
    }
    
    // First, let's create a test customer if it doesn't exist
    const testCustomerId = '111e1111-e89b-12d3-a456-426614174010';
    
    // Try to get the customer first
    let customer;
    try {
      customer = await DatabaseService.getCustomerById(testCustomerId);
    } catch (error) {
      console.log('Customer not found, may need to be created first');
    }
    
    if (!customer) {
      // Let's list available customers for debugging
      try {
        const { data: customers } = await supabase
          .from('customers')
          .select('id, name, phone')
          .limit(5);
        
        if (customers && customers.length > 0) {
          console.log('Available customers:', customers);
          // Use the first available customer
          const firstCustomer = customers[0];
          
          const booking = await DatabaseService.createBooking({
            customer_id: firstCustomer.id,
            service_ids: serviceIdsArray,
            barber_id: barber_id,
            appointment_date: appointment_date,
            appointment_time: appointment_time,
            notes: `Test booking with customer ${firstCustomer.name} to verify multiple services support`
          });

          return corsResponse({
            success: true,
            message: `Booking created successfully! Confirmation code: ${booking.confirmation_code}`,
            data: booking,
            customer_used: firstCustomer
          }, 201);
        } else {
          return corsResponse({
            success: false,
            error: 'No customers found in database. Please run database setup first.',
            debug: 'Need to insert sample customers'
          }, 404);
        }
      } catch (dbError) {
        return corsResponse({
          success: false,
          error: 'Database error when checking for customers',
          details: dbError instanceof Error ? dbError.message : 'Unknown error'
        }, 500);
      }
    }
    
    // Customer exists, proceed with booking
    const booking = await DatabaseService.createBooking({
      customer_id: customer.id,
      service_ids: serviceIdsArray,
      barber_id: barber_id,
      appointment_date: appointment_date,
      appointment_time: appointment_time,
      notes: 'Test booking to verify multiple services support'
    });

    return corsResponse({
      success: true,
      message: `Booking created successfully! Confirmation code: ${booking.confirmation_code}`,
      data: booking
    }, 201);

  } catch (error) {
    console.error('Error in booking test:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
    
    return corsResponse(
      { 
        success: false, 
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
      400
    );
  }
}
