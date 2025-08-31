-- 🗄️ BARBERSHOP DATABASE SETUP
-- Copy and paste this entire script into your Supabase SQL Editor

-- Clean slate (removes existing tables if any)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS barber_availability CASCADE;
DROP TABLE IF EXISTS business_hours CASCADE;
DROP TABLE IF EXISTS barbers CASCADE;
DROP TABLE IF EXISTS services CASCADE;

-- Create barbers table
CREATE TABLE barbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  specialties TEXT[],
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
  duration INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  category VARCHAR(50) NOT NULL,
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
  duration INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_barber_time UNIQUE (barber_id, appointment_date, appointment_time)
);

-- Create business_hours table
CREATE TABLE business_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create barber_availability table
CREATE TABLE barber_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_barber_availability UNIQUE (barber_id, date, start_time, end_time)
);

-- Insert sample barbers
INSERT INTO barbers (id, name, email, phone, specialties, rating, bio) VALUES 
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'John Smith', 'john@barbershop.com', '+1234567890', ARRAY['haircut', 'beard', 'styling'], 4.8, 'Experienced barber with 10 years in the industry.'),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Mike Johnson', 'mike@barbershop.com', '+1234567891', ARRAY['haircut', 'fade', 'beard'], 4.9, 'Specialist in modern cuts and fades.'),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Sarah Wilson', 'sarah@barbershop.com', '+1234567892', ARRAY['styling', 'haircut', 'coloring'], 4.7, 'Creative stylist with expertise in modern trends.');

-- Insert sample services
INSERT INTO services (id, name, description, duration, price, category) VALUES 
('11a2b3c4-d5e6-f789-0abc-def123456789', 'Classic Haircut', 'Traditional haircut with styling', 30, 25.00, 'haircut'),
('22b3c4d5-e6f7-a890-1bcd-ef1234567890', 'Beard Trim', 'Professional beard trimming and shaping', 20, 15.00, 'beard'),
('33c4d5e6-f7a8-b901-2cde-f12345678901', 'Premium Styling', 'Complete styling with premium products', 45, 40.00, 'styling'),
('44d5e6f7-a8b9-c012-3def-123456789012', 'Fade Cut', 'Modern fade haircut', 35, 30.00, 'haircut'),
('55e6f7a8-b9c0-d123-4efa-234567890123', 'Hot Towel Shave', 'Traditional hot towel shave', 25, 20.00, 'shave'),
('66f7a8b9-c0d1-e234-5fab-345678901234', 'Hair Wash & Style', 'Shampooing and basic styling', 20, 12.00, 'haircut');

-- Insert business hours (0=Sunday, 6=Saturday)
INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES 
(1, '09:00:00', '18:00:00', false), -- Monday
(2, '09:00:00', '18:00:00', false), -- Tuesday
(3, '09:00:00', '18:00:00', false), -- Wednesday
(4, '09:00:00', '18:00:00', false), -- Thursday
(5, '09:00:00', '18:00:00', false), -- Friday
(6, '10:00:00', '17:00:00', false), -- Saturday
(0, '11:00:00', '15:00:00', false); -- Sunday

-- Create indexes for performance
CREATE INDEX idx_bookings_barber_id ON bookings(barber_id);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_bookings_date_time ON bookings(appointment_date, appointment_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_barber_availability_barber_date ON barber_availability(barber_id, date);

-- Success message
SELECT 'Database setup complete! 🎉' as message;
