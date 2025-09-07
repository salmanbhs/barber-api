-- Modify Bookings Table to Support Multiple Services
-- Run this in Supabase SQL Editor

-- First, let's create a booking_services junction table
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_services_booking_id ON booking_services(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_services_service_id ON booking_services(service_id);

-- Modify the bookings table to support multiple services
-- Remove single service fields and add aggregate fields
ALTER TABLE bookings 
  DROP COLUMN IF EXISTS service_id,
  DROP COLUMN IF EXISTS service_name,
  DROP COLUMN IF EXISTS service_price,
  DROP COLUMN IF EXISTS service_duration;

-- Add new aggregate fields for multiple services
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS services_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_duration INTEGER NOT NULL DEFAULT 30, -- Total duration in minutes
  ADD COLUMN IF NOT EXISTS services_summary TEXT; -- Human readable summary like "Haircut, Beard Trim"

-- Create function to calculate total duration and update booking
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

-- Create triggers to automatically update booking totals
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

-- Update existing bookings to use the new structure (if any exist)
-- This will move single service data to the junction table
INSERT INTO booking_services (booking_id, service_id, service_name, service_price, service_duration)
SELECT id, '7dbb7025-edf7-4cbf-b1d6-eb70d1d8569c'::UUID, 'Beard Trim', 15.00, 30
FROM bookings 
WHERE NOT EXISTS (SELECT 1 FROM booking_services WHERE booking_id = bookings.id)
ON CONFLICT (booking_id, service_id) DO NOTHING;

-- The trigger will automatically update the booking totals

COMMENT ON TABLE booking_services IS 'Junction table linking bookings to multiple services';
COMMENT ON COLUMN booking_services.service_order IS 'Order in which services will be performed (1, 2, 3, etc.)';
COMMENT ON COLUMN bookings.total_duration IS 'Total duration of all services combined';
COMMENT ON COLUMN bookings.services_summary IS 'Human-readable list of all services';
COMMENT ON COLUMN bookings.services_count IS 'Number of services in this booking';
