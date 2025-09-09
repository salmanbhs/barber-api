# Database Schema

This directory contains the complete database schema for the Barber Shop API.

## Files

- `schema.sql` - Complete database schema with all tables, functions, triggers, and sample data

## Setup Instructions

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the entire content of `schema.sql`
4. Run the script

## What's Included

### Tables
- **users** - User authentication and role management
- **customers** - Customer information and visit history  
- **barbers** - Barber profiles and specialties
- **services** - Available services with pricing
- **bookings** - Appointment bookings
- **booking_services** - Multiple services per booking (junction table)
- **company_config** - Business configuration and settings

### Features
- Automated timestamp updates
- Multiple services per booking support
- Business hours validation
- Confirmation code generation
- Role-based access control
- Sample data for testing

### Functions
- `is_shop_open()` - Check if shop is open at given time
- `generate_confirmation_code()` - Generate unique booking codes
- Automatic calculation of booking totals and duration

## Usage

After running the schema, your database will be ready to use with the Barber API. The schema includes sample data for testing:

- 1 Admin user
- 3 Barber users  
- 4 Sample customers
- 10 Sample services
- Default company configuration

All tables include proper indexes for optimal performance and triggers for data integrity.
