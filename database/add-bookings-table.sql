-- Add Bookings Table to Barber API
-- Run this in Supabase SQL Editor

-- Create booking status enum
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Customer Information
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  
  -- Service Information
  service_id UUID REFERENCES services(id) ON DELETE RESTRICT,
  service_name VARCHAR(100) NOT NULL,
  service_price DECIMAL(10,2) NOT NULL,
  service_duration INTEGER NOT NULL, -- Duration in minutes
  
  -- Barber Information (optional - can be any available barber)
  barber_id UUID REFERENCES users(id) ON DELETE SET NULL,
  barber_name VARCHAR(100),
  
  -- Appointment Details
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  appointment_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  
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
  CONSTRAINT bookings_total_amount_positive CHECK (total_amount >= 0),
  CONSTRAINT bookings_service_duration_positive CHECK (service_duration > 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_barber_id ON bookings(barber_id);
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_datetime ON bookings(appointment_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_date ON bookings(appointment_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_confirmation_code ON bookings(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);

-- Add trigger to update updated_at timestamp and appointment_datetime
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
$$ language 'plpgsql';

CREATE TRIGGER update_bookings_updated_at 
    BEFORE INSERT OR UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_bookings_updated_at();

-- Function to generate unique confirmation code
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    code VARCHAR(10);
    exists_check INT;
BEGIN
    LOOP
        -- Generate 6-character alphanumeric code
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
        
        -- Check if code already exists
        SELECT COUNT(*) INTO exists_check FROM bookings WHERE confirmation_code = code;
        
        -- Exit loop if code is unique
        EXIT WHEN exists_check = 0;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate confirmation code
CREATE OR REPLACE FUNCTION auto_generate_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.confirmation_code IS NULL OR NEW.confirmation_code = '' THEN
        NEW.confirmation_code = generate_confirmation_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_confirmation_code_trigger
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_confirmation_code();

-- Function to check booking conflicts
CREATE OR REPLACE FUNCTION check_booking_conflict(
    check_datetime TIMESTAMP WITH TIME ZONE,
    service_duration_minutes INTEGER,
    booking_id_to_exclude UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
    config_row company_config%ROWTYPE;
    end_datetime TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get company config for max daily bookings
    SELECT * INTO config_row FROM company_config WHERE is_active = true LIMIT 1;
    
    end_datetime := check_datetime + (service_duration_minutes || ' minutes')::INTERVAL;
    
    -- Check for time conflicts (overlapping appointments)
    SELECT COUNT(*) INTO conflict_count
    FROM bookings
    WHERE status IN ('pending', 'confirmed')
      AND appointment_datetime < end_datetime
      AND (appointment_datetime + (service_duration || ' minutes')::INTERVAL) > check_datetime
      AND (booking_id_to_exclude IS NULL OR id != booking_id_to_exclude);
    
    -- If conflicts exist, return true (conflict found)
    IF conflict_count > 0 THEN
        RETURN true;
    END IF;
    
    -- Check daily booking limit
    IF config_row.max_daily_bookings IS NOT NULL THEN
        SELECT COUNT(*) INTO conflict_count
        FROM bookings
        WHERE DATE(appointment_datetime) = DATE(check_datetime)
          AND status IN ('pending', 'confirmed')
          AND (booking_id_to_exclude IS NULL OR id != booking_id_to_exclude);
        
        IF conflict_count >= config_row.max_daily_bookings THEN
            RETURN true;
        END IF;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available time slots for a specific date
CREATE OR REPLACE FUNCTION get_available_time_slots(
    target_date DATE,
    service_duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE(
    slot_time TIME,
    slot_datetime TIMESTAMP WITH TIME ZONE,
    is_available BOOLEAN
) AS $$
DECLARE
    config_row company_config%ROWTYPE;
    day_name TEXT;
    day_config JSONB;
    shift JSONB;
    slot_time_var TIME;
    end_time TIME;
    slot_interval INTEGER;
    current_datetime TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get company config
    SELECT * INTO config_row FROM company_config WHERE is_active = true LIMIT 1;
    
    IF config_row IS NULL THEN
        RETURN;
    END IF;
    
    slot_interval := config_row.time_slot_interval;
    
    -- Get day name
    day_name := LOWER(TO_CHAR(target_date, 'Day'));
    day_name := TRIM(day_name);
    
    -- Get day configuration
    day_config := config_row.working_hours->day_name;
    
    -- If day config doesn't exist or shop is closed, return empty
    IF day_config IS NULL OR (day_config->>'isOpen')::BOOLEAN = false THEN
        RETURN;
    END IF;
    
    -- Loop through each shift for the day
    FOR shift IN SELECT * FROM jsonb_array_elements(day_config->'shifts')
    LOOP
        slot_time_var := (shift->>'start')::TIME;
        end_time := (shift->>'end')::TIME;
        
        -- Generate time slots for this shift
        WHILE slot_time_var <= end_time - (service_duration_minutes || ' minutes')::INTERVAL LOOP
            current_datetime := (target_date::text || ' ' || slot_time_var::text)::timestamp with time zone;
            
            slot_time := slot_time_var;
            slot_datetime := current_datetime;
            is_available := NOT check_booking_conflict(current_datetime, service_duration_minutes);
            
            RETURN NEXT;
            
            -- Move to next time slot
            slot_time_var := slot_time_var + (slot_interval || ' minutes')::INTERVAL;
        END LOOP;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security (RLS)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings table
-- Allow customers to view their own bookings
CREATE POLICY "Customers can view own bookings" ON bookings
    FOR SELECT USING (
        customer_phone = COALESCE(
            (SELECT phone FROM users WHERE auth_user_id = auth.uid()),
            customer_phone
        )
    );

-- Allow customers to create bookings
CREATE POLICY "Customers can create bookings" ON bookings
    FOR INSERT WITH CHECK (true);

-- Allow customers to update their own bookings (status changes only)
CREATE POLICY "Customers can update own bookings" ON bookings
    FOR UPDATE USING (
        customer_phone = COALESCE(
            (SELECT phone FROM users WHERE auth_user_id = auth.uid()),
            customer_phone
        )
    );

-- Allow barbers and admins full access
CREATE POLICY "Barbers and admins full access to bookings" ON bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'barber') 
            AND users.is_active = true
        )
    );

-- Function to update customer statistics after booking
CREATE OR REPLACE FUNCTION update_customer_stats_after_booking()
RETURNS TRIGGER AS $$
BEGIN
    -- Update customer stats when booking is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE customers 
        SET 
            total_visits = total_visits + 1,
            total_spent = total_spent + NEW.total_amount,
            last_visit_date = NEW.appointment_date,
            updated_at = NOW()
        WHERE id = NEW.customer_id;
    END IF;
    
    -- Reverse stats if booking status changes from completed
    IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
        UPDATE customers 
        SET 
            total_visits = GREATEST(total_visits - 1, 0),
            total_spent = GREATEST(total_spent - NEW.total_amount, 0),
            updated_at = NOW()
        WHERE id = NEW.customer_id;
        
        -- Update last_visit_date to the most recent completed booking
        UPDATE customers 
        SET last_visit_date = (
            SELECT MAX(appointment_date) 
            FROM bookings 
            WHERE customer_id = NEW.customer_id 
            AND status = 'completed'
        )
        WHERE id = NEW.customer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_stats_trigger
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats_after_booking();
