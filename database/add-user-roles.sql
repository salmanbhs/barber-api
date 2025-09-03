-- Add User Roles System to Barber API
-- Run this in Supabase SQL Editor

-- Create roles enum
CREATE TYPE user_role AS ENUM ('admin', 'barber', 'customer');

-- Create users table to extend Supabase auth
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
  
  -- Additional role-specific fields
  profile_data JSONB DEFAULT '{}',
  
  -- Indexes
  CONSTRAINT users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create barbers table (extends users with role='barber')
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
  
  CONSTRAINT barbers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Update existing customers table to link with users
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE customers ADD CONSTRAINT customers_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_barbers_user_id ON barbers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_barbers_updated_at ON barbers;
CREATE TRIGGER update_barbers_updated_at BEFORE UPDATE ON barbers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample admin user (phone: +973admin, OTP will be needed)
INSERT INTO users (name, phone, email, role, profile_data) VALUES
('System Administrator', '+973admin', 'admin@barbershop.com', 'admin', '{"permissions": ["manage_users", "manage_barbers", "manage_customers", "view_reports"]}')
ON CONFLICT (phone) DO NOTHING;

-- Insert sample barber users
INSERT INTO users (name, phone, email, role, profile_data) VALUES
('John Smith', '+973barber1', 'john@barbershop.com', 'barber', '{"can_manage_appointments": true, "can_view_customer_data": true}'),
('Mike Johnson', '+973barber2', 'mike@barbershop.com', 'barber', '{"can_manage_appointments": true, "can_view_customer_data": true}'),
('Sarah Wilson', '+973barber3', 'sarah@barbershop.com', 'barber', '{"can_manage_appointments": true, "can_view_customer_data": true}')
ON CONFLICT (phone) DO NOTHING;

-- Insert barber details (we'll need to get the user IDs first)
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

-- Function to automatically create user record when someone authenticates
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user record if it doesn't exist
  INSERT INTO public.users (auth_user_id, name, phone, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.phone,
    NEW.email,
    'customer' -- Default role
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto user creation (when someone signs up via auth)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION user_has_role(user_id UUID, required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users u 
    WHERE u.auth_user_id = user_id 
    AND u.role = required_role 
    AND u.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has role among multiple roles
CREATE OR REPLACE FUNCTION user_has_any_role(user_id UUID, required_roles user_role[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users u 
    WHERE u.auth_user_id = user_id 
    AND u.role = ANY(required_roles) 
    AND u.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ User roles system setup complete!
-- 
-- Sample Test Users Created:
-- 📱 Admin: +973admin (role: admin)
-- 💈 Barber 1: +973barber1 (role: barber) 
-- 💈 Barber 2: +973barber2 (role: barber)
-- 💈 Barber 3: +973barber3 (role: barber)
-- 
-- Any new phone number will automatically get 'customer' role
