-- Barbershop Database Schema
-- Run these SQL commands in your Supabase SQL editor

-- Enable Row Level Security (RLS)
ALTER TABLE IF EXISTS bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS barbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS services DISABLE ROW LEVEL SECURITY;

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS barbers CASCADE;
DROP TABLE IF EXISTS services CASCADE;

-- Create barbers table
CREATE TABLE barbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  specialties TEXT[], -- Array of specialties like ['haircut', 'beard', 'styling']
  rating DECIMAL(3,2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  bio TEXT,
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- Duration in minutes
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  category VARCHAR(50) NOT NULL, -- 'haircut', 'beard', 'styling', 'shave', etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration INTEGER NOT NULL, -- Duration in minutes
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure no double booking for the same barber at the same time
  CONSTRAINT unique_barber_time UNIQUE (barber_id, appointment_date, appointment_time)
);

-- Create business_hours table for dynamic scheduling
CREATE TABLE business_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create barber_availability table for custom availability
CREATE TABLE barber_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true, -- false for breaks/unavailable periods
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_barber_availability UNIQUE (barber_id, date, start_time, end_time)
);

-- Insert sample data
-- Sample barbers
INSERT INTO barbers (id, name, email, phone, specialties, rating, bio) VALUES 
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'John Smith', 'john@barbershop.com', '+1234567890', ARRAY['haircut', 'beard', 'styling'], 4.8, 'Experienced barber with 10 years in the industry.'),
('b2c3d4e5-f6g7-8901-bcde-f12345678901', 'Mike Johnson', 'mike@barbershop.com', '+1234567891', ARRAY['haircut', 'fade', 'beard'], 4.9, 'Specialist in modern cuts and fades.'),
('c3d4e5f6-g7h8-9012-cdef-123456789012', 'Sarah Wilson', 'sarah@barbershop.com', '+1234567892', ARRAY['styling', 'haircut', 'coloring'], 4.7, 'Creative stylist with expertise in modern trends.');

-- Sample services
INSERT INTO services (id, name, description, duration, price, category) VALUES 
('s1a2b3c4-d5e6-f789-0abc-def123456789', 'Classic Haircut', 'Traditional haircut with styling', 30, 25.00, 'haircut'),
('s2b3c4d5-e6f7-g890-1bcd-ef1234567890', 'Beard Trim', 'Professional beard trimming and shaping', 20, 15.00, 'beard'),
('s3c4d5e6-f7g8-h901-2cde-f12345678901', 'Premium Styling', 'Complete styling with premium products', 45, 40.00, 'styling'),
('s4d5e6f7-g8h9-i012-3def-123456789012', 'Fade Cut', 'Modern fade haircut', 35, 30.00, 'haircut'),
('s5e6f7g8-h9i0-j123-4efg-234567890123', 'Hot Towel Shave', 'Traditional hot towel shave', 25, 20.00, 'shave'),
('s6f7g8h9-i0j1-k234-5fgh-345678901234', 'Hair Wash & Style', 'Shampooing and basic styling', 20, 12.00, 'haircut');

-- Sample business hours (Monday = 1, Sunday = 0)
INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES 
(1, '09:00:00', '18:00:00', false), -- Monday
(2, '09:00:00', '18:00:00', false), -- Tuesday
(3, '09:00:00', '18:00:00', false), -- Wednesday
(4, '09:00:00', '18:00:00', false), -- Thursday
(5, '09:00:00', '18:00:00', false), -- Friday
(6, '10:00:00', '17:00:00', false), -- Saturday
(0, '11:00:00', '15:00:00', false); -- Sunday

-- Create indexes for better performance
CREATE INDEX idx_bookings_barber_id ON bookings(barber_id);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_bookings_date_time ON bookings(appointment_date, appointment_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_barber_availability_barber_date ON barber_availability(barber_id, date);

-- Enable Row Level Security (optional - for production)
-- ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE barber_availability ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_barbers_updated_at BEFORE UPDATE ON barbers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
