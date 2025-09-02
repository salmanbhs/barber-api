import { supabase } from './supabase';

// Types for our database entities
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  total_visits: number;
  total_spent: number;
  last_visit_date?: string;
  created_at: string;
  updated_at: string;
}

// Database service class
export class DatabaseService {
  
  // Customer operations
  static async getAllCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async getCustomerById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getCustomerByPhone(phone: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createCustomer(customer: {
    name: string;
    phone: string;
    email?: string;
    date_of_birth?: string;
    address?: string;
    notes?: string;
  }): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteCustomer(id: string): Promise<void> {
    const { data, error } = await supabase
      .from('customers')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  }
}
