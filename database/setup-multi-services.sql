-- 🗄️ UPDATED BARBERSHOP DATABASE SETUP - Multiple Services Support
-- Copy and paste this entire script into your Supabase SQL Editor

-- Clean slate (removes existing tables if any)
DROP TABLE IF EXISTS booking_services CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS barber_availability CASCADE;
DROP TABLE IF EXISTS business_hours CASCADE;
DROP TABLE IF EXISTS barbers CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- Create customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  date_of_birth DATE,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  total_visits INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  last_visit_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Create bookings table (main booking record)
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  total_duration INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent double booking: same barber cannot have overlapping appointments
  CONSTRAINT unique_barber_time UNIQUE (barber_id, appointment_date, appointment_time)
);

-- Create booking_services table (many-to-many relationship)
CREATE TABLE booking_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  service_order INTEGER NOT NULL DEFAULT 1,
  service_duration INTEGER NOT NULL,
  service_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure each service is only added once per booking
  CONSTRAINT unique_booking_service UNIQUE (booking_id, service_id)
);

-- Create business hours table
CREATE TABLE business_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_day_of_week UNIQUE (day_of_week)
);

-- Create barber availability table (for custom schedules)
CREATE TABLE barber_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_barber_date_time UNIQUE (barber_id, date, start_time, end_time)
);

-- Insert sample customers
INSERT INTO customers (id, name, phone, email, date_of_birth, total_visits, total_spent, last_visit_date) VALUES
('111e1111-e89b-12d3-a456-426614174010', 'John Doe', '+1-555-1001', 'john@email.com', '1990-05-15', 5, 125.00, '2025-08-20'),
('222e2222-e89b-12d3-a456-426614174011', 'Jane Smith', '+1-555-1002', 'jane@email.com', '1985-12-08', 3, 85.00, '2025-08-15'),
('333e3333-e89b-12d3-a456-426614174012', 'Mike Johnson', '+1-555-1003', 'mike@email.com', '1992-03-22', 8, 220.00, '2025-08-25'),
('444e4444-e89b-12d3-a456-426614174013', 'Sarah Davis', '+1-555-1004', 'sarah@email.com', '1988-07-10', 2, 50.00, '2025-08-10');

-- Insert sample barbers
INSERT INTO barbers (id, name, email, phone, specialties, rating, bio, profile_image_url) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'Mike Johnson', 'mike@barbershop.com', '+1-555-0101', ARRAY['Classic Cuts', 'Beard Styling'], 4.8, 'Expert barber with 10 years of experience', 'https://example.com/mike.jpg'),
('234e5678-e89b-12d3-a456-426614174001', 'Sarah Smith', 'sarah@barbershop.com', '+1-555-0102', ARRAY['Modern Styles', 'Hair Coloring'], 4.9, 'Creative stylist specializing in modern looks', 'https://example.com/sarah.jpg'),
('345e6789-e89b-12d3-a456-426614174002', 'David Wilson', 'david@barbershop.com', '+1-555-0103', ARRAY['Traditional Cuts', 'Mustache Grooming'], 4.7, 'Traditional barber with classic techniques', 'https://example.com/david.jpg');

-- Insert sample services
INSERT INTO services (id, name, description, duration, price, category) VALUES
('456e7890-e89b-12d3-a456-426614174003', 'Classic Haircut', 'Traditional haircut with scissors and clipper', 30, 25.00, 'Haircuts'),
('567e8901-e89b-12d3-a456-426614174004', 'Beard Trim', 'Professional beard trimming and shaping', 15, 15.00, 'Beard Services'),
('678e9012-e89b-12d3-a456-426614174005', 'Hot Towel Shave', 'Traditional hot towel shave with straight razor', 45, 35.00, 'Shaving'),
('789e0123-e89b-12d3-a456-426614174006', 'Hair Wash & Style', 'Hair washing and styling service', 20, 20.00, 'Hair Care'),
('890e1234-e89b-12d3-a456-426614174007', 'Mustache Grooming', 'Detailed mustache trimming and styling', 10, 10.00, 'Beard Services'),
('901e2345-e89b-12d3-a456-426614174008', 'Deluxe Package', 'Haircut + Beard Trim + Hot Towel', 60, 60.00, 'Packages');

-- Insert business hours (Monday = 1, Sunday = 0)
INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES
(0, '10:00:00', '18:00:00', false), -- Sunday
(1, '09:00:00', '19:00:00', false), -- Monday
(2, '09:00:00', '19:00:00', false), -- Tuesday
(3, '09:00:00', '19:00:00', false), -- Wednesday
(4, '09:00:00', '20:00:00', false), -- Thursday
(5, '09:00:00', '20:00:00', false), -- Friday
(6, '08:00:00', '18:00:00', false); -- Saturday

-- Insert sample bookings with customer IDs
INSERT INTO bookings (id, customer_id, barber_id, appointment_date, appointment_time, total_duration, total_price, status, notes) VALUES
('abc12345-e89b-12d3-a456-426614174009', '111e1111-e89b-12d3-a456-426614174010', '123e4567-e89b-12d3-a456-426614174000', '2025-09-01', '10:00:00', 45, 40.00, 'confirmed', 'Regular customer'),
('bcd23456-e89b-12d3-a456-426614174010', '222e2222-e89b-12d3-a456-426614174011', '234e5678-e89b-12d3-a456-426614174001', '2025-09-01', '14:00:00', 30, 25.00, 'confirmed', 'First time visit');

-- Insert booking services (multiple services per booking)
INSERT INTO booking_services (booking_id, service_id, service_order, service_duration, service_price) VALUES
-- John Doe's booking: Haircut + Beard Trim
('abc12345-e89b-12d3-a456-426614174009', '456e7890-e89b-12d3-a456-426614174003', 1, 30, 25.00), -- Classic Haircut
('abc12345-e89b-12d3-a456-426614174009', '567e8901-e89b-12d3-a456-426614174004', 2, 15, 15.00), -- Beard Trim

-- Jane Smith's booking: Just Haircut
('bcd23456-e89b-12d3-a456-426614174010', '456e7890-e89b-12d3-a456-426614174003', 1, 30, 25.00); -- Classic Haircut

-- Create indexes for better performance
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_barber_date ON bookings(barber_id, appointment_date);
CREATE INDEX idx_bookings_date_time ON bookings(appointment_date, appointment_time);
CREATE INDEX idx_booking_services_booking_id ON booking_services(booking_id);
CREATE INDEX idx_barber_availability_barber_date ON barber_availability(barber_id, date);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_barbers_updated_at BEFORE UPDATE ON barbers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_hours_updated_at BEFORE UPDATE ON business_hours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ✅ Database setup complete!
-- Your barbershop now supports multiple services per booking!
