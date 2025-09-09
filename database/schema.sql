-- =========================================================================
-- BARBER SHOP API - COMPLETE DATABASE SCHEMA
-- =========================================================================
-- This file contains the complete database schema for the Barber Shop API
-- Run this in Supabase SQL Editor to set up the entire database
-- =========================================================================

-- =========================================================================
-- 1. ENUMS AND CUSTOM TYPES
-- =========================================================================

-- Booking status enumeration
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

-- User role enumeration
CREATE TYPE user_role AS ENUM ('admin', 'barber', 'customer');

-- =========================================================================
-- 2. CORE TABLES
-- =========================================================================

-- -------------------------------------------------------------------------
-- 2.1 USERS TABLE (Authentication & Role Management)
-- -------------------------------------------------------------------------
-- Extends Supabase auth with role-based access control

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID UNIQUE, -- References Supabase auth.users.id
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  role user_role NOT NULL DEFAULT 'customer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional role-specific data stored as JSON
  profile_data JSONB DEFAULT '{}',
  
  -- Foreign key constraint to Supabase auth
  CONSTRAINT users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------------
-- 2.2 CUSTOMERS TABLE (Customer Information)
-- -------------------------------------------------------------------------
-- Detailed customer information and visit history

CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- Links to users table for authenticated customers
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  date_of_birth DATE,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Visit tracking
  total_visits INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  last_visit_date DATE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key to users table
  CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- -------------------------------------------------------------------------
-- 2.3 BARBERS TABLE (Barber Profiles)
-- -------------------------------------------------------------------------
-- Detailed barber information extending the users table

CREATE TABLE IF NOT EXISTS barbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  specialties TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  bio TEXT,
  profile_image_url TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT barbers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------------
-- 2.4 SERVICES TABLE (Available Services)
-- -------------------------------------------------------------------------
-- All services offered by the barber shop

CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT services_price_positive CHECK (price > 0),
  CONSTRAINT services_duration_positive CHECK (duration_minutes > 0)
);

-- -------------------------------------------------------------------------
-- 2.5 BOOKINGS TABLE (Appointment Bookings)
-- -------------------------------------------------------------------------
-- Main bookings table supporting multiple services per booking

CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Customer Information
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  
  -- Barber Information (optional - can be any available barber)
  barber_id UUID REFERENCES users(id) ON DELETE SET NULL,
  barber_name VARCHAR(100),
  
  -- Appointment Details
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  appointment_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Service Summary (calculated from booking_services)
  services_count INTEGER DEFAULT 1,
  total_duration INTEGER NOT NULL DEFAULT 30, -- Total duration in minutes
  services_summary TEXT, -- Human readable summary like "Haircut, Beard Trim"
  
  -- Booking Details
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BHD',
  notes TEXT,
  special_requests TEXT,
  
  -- Status and Tracking
  status booking_status DEFAULT 'pending',
  booking_source VARCHAR(50) DEFAULT 'web', -- web, mobile, phone, walk-in
  confirmation_code VARCHAR(10) UNIQUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT bookings_total_amount_positive CHECK (total_amount >= 0)
);

-- -------------------------------------------------------------------------
-- 2.6 BOOKING_SERVICES TABLE (Services per Booking)
-- -------------------------------------------------------------------------
-- Junction table for multiple services per booking

CREATE TABLE IF NOT EXISTS booking_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE RESTRICT,
  service_name VARCHAR(100) NOT NULL,
  service_price DECIMAL(10,2) NOT NULL,
  service_duration INTEGER NOT NULL, -- Duration in minutes
  service_order INTEGER DEFAULT 1, -- Order of service in the appointment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure each service appears only once per booking
  UNIQUE(booking_id, service_id)
);

-- -------------------------------------------------------------------------
-- 2.7 COMPANY_CONFIG TABLE (Business Configuration)
-- -------------------------------------------------------------------------
-- Company settings, working hours, and configuration

CREATE TABLE IF NOT EXISTS company_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Company Information
  company_name VARCHAR(255) NOT NULL DEFAULT 'Barber Shop',
  company_description TEXT,
  company_logo_url VARCHAR(500),
  
  -- Contact Information
  company_phone VARCHAR(20),
  company_email VARCHAR(255),
  company_address TEXT,
  company_website VARCHAR(255),
  
  -- Working Hours (stored as JSON for flexibility)
  working_hours JSONB DEFAULT '{
    "monday": {"isOpen": true, "shifts": [{"start": "09:00", "end": "12:00"}, {"start": "16:00", "end": "20:00"}]},
    "tuesday": {"isOpen": true, "shifts": [{"start": "09:00", "end": "12:00"}, {"start": "16:00", "end": "20:00"}]},
    "wednesday": {"isOpen": true, "shifts": [{"start": "09:00", "end": "12:00"}, {"start": "16:00", "end": "20:00"}]},
    "thursday": {"isOpen": true, "shifts": [{"start": "09:00", "end": "12:00"}, {"start": "16:00", "end": "20:00"}]},
    "friday": {"isOpen": true, "shifts": [{"start": "09:00", "end": "12:00"}, {"start": "16:00", "end": "20:00"}]},
    "saturday": {"isOpen": true, "shifts": [{"start": "09:00", "end": "18:00"}]},
    "sunday": {"isOpen": false, "shifts": []}
  }'::jsonb,
  
  -- Holiday/Special Hours (array of holiday objects)
  holidays JSONB DEFAULT '[]'::jsonb,
  
  -- Theme and Branding
  primary_color VARCHAR(7) DEFAULT '#2563eb', -- Primary blue
  secondary_color VARCHAR(7) DEFAULT '#64748b', -- Secondary gray
  accent_color VARCHAR(7) DEFAULT '#f59e0b', -- Accent amber
  background_color VARCHAR(7) DEFAULT '#ffffff',
  text_color VARCHAR(7) DEFAULT '#1f2937',
  
  -- App Configuration
  booking_advance_hours INTEGER DEFAULT 1, -- How many hours in advance customers can book
  default_service_duration INTEGER DEFAULT 30, -- Default service duration in minutes
  time_slot_interval INTEGER DEFAULT 15, -- Time slot intervals in minutes (15, 30, 60)
  max_daily_bookings INTEGER DEFAULT 20, -- Maximum bookings per day
  
  -- Business Settings
  currency VARCHAR(3) DEFAULT 'BHD', -- Bahraini Dinar as default currency
  
  -- Notification Settings
  sms_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  reminder_hours_before INTEGER DEFAULT 24, -- Hours before appointment to send reminder
  
  -- Social Media Links
  social_media JSONB DEFAULT '{
    "facebook": "",
    "instagram": "",
    "twitter": "",
    "whatsapp": "",
    "google_business": ""
  }'::jsonb,
  
  -- Operating Status
  is_active BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT DEFAULT 'We are currently under maintenance. Please check back later.',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints for color format validation
  CONSTRAINT company_config_primary_color_format CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT company_config_secondary_color_format CHECK (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT company_config_accent_color_format CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT company_config_background_color_format CHECK (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT company_config_text_color_format CHECK (text_color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT company_config_booking_advance_hours_positive CHECK (booking_advance_hours > 0),
  CONSTRAINT company_config_time_slot_interval_valid CHECK (time_slot_interval IN (15, 30, 60))
);

-- =========================================================================
-- 3. INDEXES FOR PERFORMANCE
-- =========================================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- Barber indexes
CREATE INDEX IF NOT EXISTS idx_barbers_user_id ON barbers(user_id);

-- Service indexes
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_price ON services(price);

-- Booking indexes
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_barber_id ON bookings(barber_id);
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_datetime ON bookings(appointment_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_date ON bookings(appointment_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_confirmation_code ON bookings(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);

-- Booking services indexes
CREATE INDEX IF NOT EXISTS idx_booking_services_booking_id ON booking_services(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_services_service_id ON booking_services(service_id);

-- Company config indexes
CREATE INDEX IF NOT EXISTS idx_company_config_is_active ON company_config(is_active);
CREATE INDEX IF NOT EXISTS idx_company_config_maintenance_mode ON company_config(maintenance_mode);

-- =========================================================================
-- 4. FUNCTIONS AND TRIGGERS
-- =========================================================================

-- -------------------------------------------------------------------------
-- 4.1 Update Timestamp Function
-- -------------------------------------------------------------------------
-- Generic function to update the updated_at column

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------------
-- 4.2 Booking Update Function
-- -------------------------------------------------------------------------
-- Updates booking timestamps and appointment_datetime when status changes

CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Update appointment_datetime when date or time changes
    NEW.appointment_datetime = (NEW.appointment_date::text || ' ' || NEW.appointment_time::text)::timestamp with time zone;
    
    -- Update confirmed_at when status changes to confirmed
    IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
        NEW.confirmed_at = NOW();
    END IF;
    
    -- Update cancelled_at when status changes to cancelled
    IF NEW.status = 'cancelled' AND (OLD IS NULL OR OLD.status != 'cancelled') THEN
        NEW.cancelled_at = NOW();
    END IF;
    
    -- Update completed_at when status changes to completed
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
        NEW.completed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------------
-- 4.3 Booking Totals Update Function
-- -------------------------------------------------------------------------
-- Automatically calculates total duration and amount from booking_services

CREATE OR REPLACE FUNCTION update_booking_totals()
RETURNS TRIGGER AS $$
DECLARE
    booking_record bookings%ROWTYPE;
    total_dur INTEGER;
    total_amt DECIMAL(10,2);
    services_text TEXT;
    service_count INTEGER;
BEGIN
    -- Get the booking record
    IF TG_OP = 'DELETE' THEN
        SELECT * INTO booking_record FROM bookings WHERE id = OLD.booking_id;
    ELSE
        SELECT * INTO booking_record FROM bookings WHERE id = NEW.booking_id;
    END IF;
    
    -- Calculate totals from booking_services
    SELECT 
        COALESCE(SUM(service_duration), 0),
        COALESCE(SUM(service_price), 0),
        STRING_AGG(service_name, ', ' ORDER BY service_order),
        COUNT(*)
    INTO total_dur, total_amt, services_text, service_count
    FROM booking_services 
    WHERE booking_id = booking_record.id;
    
    -- Update the booking record
    UPDATE bookings SET
        total_duration = total_dur,
        total_amount = total_amt,
        services_summary = COALESCE(services_text, 'No services'),
        services_count = service_count,
        updated_at = NOW()
    WHERE id = booking_record.id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------------
-- 4.4 Shop Open Check Function
-- -------------------------------------------------------------------------
-- Checks if the shop is open at a given datetime

CREATE OR REPLACE FUNCTION is_shop_open(check_datetime TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN AS $$
DECLARE
    config_row company_config%ROWTYPE;
    day_name TEXT;
    day_config JSONB;
    check_time TIME;
    shift JSONB;
BEGIN
    -- Get company config
    SELECT * INTO config_row FROM company_config WHERE is_active = true LIMIT 1;
    
    IF config_row IS NULL THEN
        RETURN false;
    END IF;
    
    -- Get day name (handle different locales)
    day_name := LOWER(TO_CHAR(check_datetime, 'Day'));
    day_name := TRIM(day_name);
    
    -- Get day configuration
    day_config := config_row.working_hours->day_name;
    
    -- If day config doesn't exist or shop is closed, return false
    IF day_config IS NULL OR (day_config->>'isOpen')::BOOLEAN = false THEN
        RETURN false;
    END IF;
    
    -- Get time part
    check_time := check_datetime::TIME;
    
    -- Check if time falls within any shift
    FOR shift IN SELECT * FROM jsonb_array_elements(day_config->'shifts')
    LOOP
        IF check_time >= (shift->>'start')::TIME AND check_time <= (shift->>'end')::TIME THEN
            RETURN true;
        END IF;
    END LOOP;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------------------
-- 4.5 Confirmation Code Generator Function
-- -------------------------------------------------------------------------
-- Generates unique confirmation codes for bookings

CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    code VARCHAR(10);
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 6-character alphanumeric code
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
        
        -- Check if this code already exists
        SELECT EXISTS(SELECT 1 FROM bookings WHERE confirmation_code = code) INTO exists_check;
        
        -- If code doesn't exist, return it
        IF NOT exists_check THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------------
-- 4.6 New User Handler Function
-- -------------------------------------------------------------------------
-- Automatically creates user record when someone authenticates

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (auth_user_id, name, phone, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', '+000000000'),
        NEW.email,
        'customer'
    )
    ON CONFLICT (auth_user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 5. TRIGGERS
-- =========================================================================

-- Update timestamp triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_barbers_updated_at ON barbers;
CREATE TRIGGER update_barbers_updated_at 
    BEFORE UPDATE ON barbers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Booking-specific trigger
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at 
    BEFORE INSERT OR UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_bookings_updated_at();

-- Booking totals triggers
DROP TRIGGER IF EXISTS trigger_update_booking_totals_insert ON booking_services;
DROP TRIGGER IF EXISTS trigger_update_booking_totals_update ON booking_services;
DROP TRIGGER IF EXISTS trigger_update_booking_totals_delete ON booking_services;

CREATE TRIGGER trigger_update_booking_totals_insert
    AFTER INSERT ON booking_services
    FOR EACH ROW EXECUTE FUNCTION update_booking_totals();

CREATE TRIGGER trigger_update_booking_totals_update
    AFTER UPDATE ON booking_services
    FOR EACH ROW EXECUTE FUNCTION update_booking_totals();

CREATE TRIGGER trigger_update_booking_totals_delete
    AFTER DELETE ON booking_services
    FOR EACH ROW EXECUTE FUNCTION update_booking_totals();

-- New user trigger (for Supabase auth integration)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =========================================================================
-- 6. INITIAL DATA
-- =========================================================================

-- -------------------------------------------------------------------------
-- 6.1 Company Configuration
-- -------------------------------------------------------------------------
INSERT INTO company_config (
  company_name,
  company_description,
  company_phone,
  company_email
) VALUES (
  'Barber Shop Pro',
  'Professional barber services with modern styling and traditional techniques',
  '+1-555-0123',
  'info@barbershoppro.com'
) ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- 6.2 Sample Services
-- -------------------------------------------------------------------------
INSERT INTO services (name, description, price, duration_minutes, category) VALUES
('Classic Haircut', 'Traditional men''s haircut with scissors and clipper', 25.00, 45, 'haircut'),
('Beard Trim', 'Professional beard trimming and shaping', 15.00, 30, 'beard'),
('Hair Wash & Style', 'Shampoo, conditioning, and styling', 20.00, 30, 'styling'),
('Mustache Trim', 'Precision mustache trimming', 10.00, 15, 'beard'),
('Fade Cut', 'Modern fade haircut with blending', 30.00, 60, 'haircut'),
('Hot Towel Shave', 'Traditional hot towel straight razor shave', 35.00, 45, 'shave'),
('Hair Styling', 'Professional hair styling for special occasions', 25.00, 30, 'styling'),
('Eyebrow Trim', 'Eyebrow shaping and trimming', 8.00, 15, 'grooming'),
('Hair Treatment', 'Deep conditioning and scalp treatment', 40.00, 60, 'treatment'),
('Full Service Package', 'Haircut, beard trim, and styling combo', 50.00, 90, 'package')
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- 6.3 Sample Users (Admin and Barbers)
-- -------------------------------------------------------------------------
INSERT INTO users (name, phone, email, role, profile_data) VALUES
('System Administrator', '+973admin', 'admin@barbershop.com', 'admin', '{"permissions": ["manage_users", "manage_barbers", "manage_customers", "view_reports"]}'),
('John Smith', '+973barber1', 'john@barbershop.com', 'barber', '{"can_manage_appointments": true, "can_view_customer_data": true}'),
('Mike Johnson', '+973barber2', 'mike@barbershop.com', 'barber', '{"can_manage_appointments": true, "can_view_customer_data": true}'),
('Sarah Wilson', '+973barber3', 'sarah@barbershop.com', 'barber', '{"can_manage_appointments": true, "can_view_customer_data": true}')
ON CONFLICT (phone) DO NOTHING;

-- -------------------------------------------------------------------------
-- 6.4 Sample Barber Profiles
-- -------------------------------------------------------------------------
INSERT INTO barbers (user_id, specialties, experience_years, rating, bio)
SELECT u.id, '{"haircut", "beard", "styling"}', 5, 4.8, 'Experienced barber specializing in modern cuts and traditional shaves.'
FROM users u WHERE u.phone = '+973barber1'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO barbers (user_id, specialties, experience_years, rating, bio)
SELECT u.id, '{"haircut", "fade", "beard"}', 7, 4.9, 'Master of fade cuts and precision styling.'
FROM users u WHERE u.phone = '+973barber2'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO barbers (user_id, specialties, experience_years, rating, bio)
SELECT u.id, '{"styling", "haircut", "coloring"}', 4, 4.7, 'Creative stylist with expertise in hair coloring and modern trends.'
FROM users u WHERE u.phone = '+973barber3'
ON CONFLICT (user_id) DO NOTHING;

-- -------------------------------------------------------------------------
-- 6.5 Sample Customers
-- -------------------------------------------------------------------------
INSERT INTO customers (id, name, phone, email, date_of_birth, total_visits, total_spent, last_visit_date) VALUES
('111e1111-e89b-12d3-a456-426614174010', 'John Doe', '+1-555-1001', 'john@email.com', '1990-05-15', 5, 125.00, '2025-08-20'),
('222e2222-e89b-12d3-a456-426614174011', 'Jane Smith', '+1-555-1002', 'jane@email.com', '1985-12-08', 3, 85.00, '2025-08-15'),
('333e3333-e89b-12d3-a456-426614174012', 'Mike Johnson', '+1-555-1003', 'mike@email.com', '1992-03-22', 8, 220.00, '2025-08-25'),
('444e4444-e89b-12d3-a456-426614174013', 'Sarah Davis', '+1-555-1004', 'sarah@email.com', '1988-07-10', 2, 50.00, '2025-08-10')
ON CONFLICT (phone) DO NOTHING;

-- =========================================================================
-- SCHEMA SETUP COMPLETE
-- =========================================================================
-- The database schema has been successfully created with:
-- - 7 main tables (users, customers, barbers, services, bookings, booking_services, company_config)
-- - Comprehensive indexes for performance
-- - Automated triggers for data integrity
-- - Business logic functions
-- - Sample data for testing
-- 
-- You can now use the API to interact with this database structure.
-- =========================================================================
