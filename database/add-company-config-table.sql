-- Add Company Configuration Table to Barber API
-- Run this in Supabase SQL Editor

-- Create company_config table
CREATE TABLE IF NOT EXISTS company_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  
  -- Constraints
  CONSTRAINT company_config_primary_color_format CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT company_config_secondary_color_format CHECK (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT company_config_accent_color_format CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT company_config_background_color_format CHECK (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT company_config_text_color_format CHECK (text_color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT company_config_booking_advance_hours_positive CHECK (booking_advance_hours > 0),
  CONSTRAINT company_config_time_slot_interval_valid CHECK (time_slot_interval IN (15, 30, 60))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_config_is_active ON company_config(is_active);
CREATE INDEX IF NOT EXISTS idx_company_config_maintenance_mode ON company_config(maintenance_mode);

-- Insert default company configuration
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

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_config_updated_at 
    BEFORE UPDATE ON company_config 
    FOR EACH ROW 
    EXECUTE FUNCTION update_company_config_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE company_config ENABLE ROW LEVEL SECURITY;

-- Create policies for company_config table
-- Allow all users to read company config
CREATE POLICY "Allow public read access to company config" ON company_config
    FOR SELECT USING (true);

-- Only allow admins to modify company config
CREATE POLICY "Allow admin full access to company config" ON company_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role = 'admin' 
            AND users.is_active = true
        )
    );

-- Create a function to get current company config
CREATE OR REPLACE FUNCTION get_company_config()
RETURNS TABLE (
    id UUID,
    company_name VARCHAR(255),
    company_description TEXT,
    company_logo_url VARCHAR(500),
    company_phone VARCHAR(20),
    company_email VARCHAR(255),
    company_address TEXT,
    company_website VARCHAR(255),
    working_hours JSONB,
    holidays JSONB,
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    background_color VARCHAR(7),
    text_color VARCHAR(7),
    booking_advance_hours INTEGER,
    default_service_duration INTEGER,
    time_slot_interval INTEGER,
    max_daily_bookings INTEGER,
    currency VARCHAR(3),
    sms_notifications BOOLEAN,
    email_notifications BOOLEAN,
    reminder_hours_before INTEGER,
    social_media JSONB,
    is_active BOOLEAN,
    maintenance_mode BOOLEAN,
    maintenance_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.id,
        cc.company_name,
        cc.company_description,
        cc.company_logo_url,
        cc.company_phone,
        cc.company_email,
        cc.company_address,
        cc.company_website,
        cc.working_hours,
        cc.holidays,
        cc.primary_color,
        cc.secondary_color,
        cc.accent_color,
        cc.background_color,
        cc.text_color,
        cc.booking_advance_hours,
        cc.default_service_duration,
        cc.time_slot_interval,
        cc.max_daily_bookings,
        cc.currency,
        cc.sms_notifications,
        cc.email_notifications,
        cc.reminder_hours_before,
        cc.social_media,
        cc.is_active,
        cc.maintenance_mode,
        cc.maintenance_message,
        cc.created_at,
        cc.updated_at
    FROM company_config cc
    WHERE cc.is_active = true
    ORDER BY cc.created_at ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if shop is open at specific time
CREATE OR REPLACE FUNCTION is_shop_open(check_datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW())
RETURNS BOOLEAN AS $$
DECLARE
    config_row company_config%ROWTYPE;
    day_name TEXT;
    check_time TIME;
    day_config JSONB;
    shift JSONB;
    shift_start TIME;
    shift_end TIME;
BEGIN
    -- Get company config
    SELECT * INTO config_row FROM company_config WHERE is_active = true LIMIT 1;
    
    -- If no config or maintenance mode, return false
    IF config_row IS NULL OR config_row.maintenance_mode = true THEN
        RETURN false;
    END IF;
    
    -- Get day name and time
    day_name := LOWER(TO_CHAR(check_datetime, 'Day'));
    day_name := TRIM(day_name);
    check_time := check_datetime::TIME;
    
    -- Get day configuration
    day_config := config_row.working_hours->day_name;
    
    -- If day config doesn't exist or shop is closed that day
    IF day_config IS NULL OR (day_config->>'isOpen')::BOOLEAN = false THEN
        RETURN false;
    END IF;
    
    -- Check each shift for the day
    FOR shift IN SELECT * FROM jsonb_array_elements(day_config->'shifts')
    LOOP
        shift_start := (shift->>'start')::TIME;
        shift_end := (shift->>'end')::TIME;
        
        IF check_time >= shift_start AND check_time <= shift_end THEN
            RETURN true;
        END IF;
    END LOOP;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
