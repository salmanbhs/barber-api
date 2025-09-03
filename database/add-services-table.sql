-- Add Services Table to Barber API
-- Run this in Supabase SQL Editor

-- Create services table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_price ON services(price);

-- Insert sample services data
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

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
