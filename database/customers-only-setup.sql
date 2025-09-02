-- Simple Customer Management Database Setup
-- Run this in your Supabase SQL Editor

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
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

-- Insert sample customers
INSERT INTO customers (id, name, phone, email, date_of_birth, total_visits, total_spent, last_visit_date) VALUES
('111e1111-e89b-12d3-a456-426614174010', 'John Doe', '+1-555-1001', 'john@email.com', '1990-05-15', 5, 125.00, '2025-08-20'),
('222e2222-e89b-12d3-a456-426614174011', 'Jane Smith', '+1-555-1002', 'jane@email.com', '1985-12-08', 3, 85.00, '2025-08-15'),
('333e3333-e89b-12d3-a456-426614174012', 'Mike Johnson', '+1-555-1003', 'mike@email.com', '1992-03-22', 8, 220.00, '2025-08-25'),
('444e4444-e89b-12d3-a456-426614174013', 'Sarah Davis', '+1-555-1004', 'sarah@email.com', '1988-07-10', 2, 50.00, '2025-08-10')
ON CONFLICT (phone) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ✅ Simple customer database setup complete!
