import { supabase } from './supabase';

// Types for our database entities
export type UserRole = 'admin' | 'barber' | 'customer';

export interface User {
  id: string;
  auth_user_id?: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile_data?: Record<string, string | number | boolean | null>;
}

export interface Barber {
  id: string;
  user_id: string;
  specialties: string[];
  experience_years: number;
  rating: number;
  bio?: string;
  profile_image_url?: string;
  hire_date: string;
  created_at: string;
  updated_at: string;
  // Join fields
  user?: User;
}

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
  user_id?: string;
  // Join fields
  user?: User;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Database service class
export class DatabaseService {
  
  // User operations
  static async getUserByAuthId(authUserId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getUserByPhone(phone: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createOrUpdateUser(userData: {
    auth_user_id?: string;
    name: string;
    phone: string;
    email?: string;
    role?: UserRole;
  }): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .upsert([{
        ...userData,
        role: userData.role || 'customer'
      }], {
        onConflict: 'phone'
      })
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getUsersByRole(role: UserRole): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  // Barber operations
  static async getAllBarbers(): Promise<Barber[]> {
    const { data, error } = await supabase
      .from('barbers')
      .select(`
        *,
        user:user_id (
          id, name, phone, email, role, is_active
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getBarberById(id: string): Promise<Barber | null> {
    const { data, error } = await supabase
      .from('barbers')
      .select(`
        *,
        user:user_id (
          id, name, phone, email, role, is_active
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getBarberByUserId(userId: string): Promise<Barber | null> {
    const { data, error } = await supabase
      .from('barbers')
      .select(`
        *,
        user:user_id (
          id, name, phone, email, role, is_active
        )
      `)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createBarber(barberData: {
    user_id: string;
    specialties?: string[];
    experience_years?: number;
    bio?: string;
    hourly_rate?: number;
    commission_rate?: number;
  }): Promise<Barber> {
    const { data, error } = await supabase
      .from('barbers')
      .insert([barberData])
      .select(`
        *,
        user:user_id (
          id, name, phone, email, role, is_active
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateBarber(id: string, updates: Partial<Barber>): Promise<Barber> {
    const { data, error } = await supabase
      .from('barbers')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        user:user_id (
          id, name, phone, email, role, is_active
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Customer operations
  static async getAllCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        user:user_id (
          id, name, phone, email, role, is_active
        )
      `)
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async getCustomerById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        user:user_id (
          id, name, phone, email, role, is_active
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getCustomerByPhone(phone: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        user:user_id (
          id, name, phone, email, role, is_active
        )
      `)
      .eq('phone', phone)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getCustomerByUserId(userId: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        user:user_id (
          id, name, phone, email, role, is_active
        )
      `)
      .eq('user_id', userId)
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
    user_id?: string;
  }): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select(`
        *,
        user:user_id (
          id, name, phone, email, role, is_active
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        user:user_id (
          id, name, phone, email, role, is_active
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  }

  // Role checking utilities
  static async checkUserRole(authUserId: string, requiredRole: UserRole): Promise<boolean> {
    try {
      const user = await this.getUserByAuthId(authUserId);
      return user?.role === requiredRole && user?.is_active === true;
    } catch {
      return false;
    }
  }

  static async checkUserHasAnyRole(authUserId: string, requiredRoles: UserRole[]): Promise<boolean> {
    try {
      const user = await this.getUserByAuthId(authUserId);
      return user?.is_active === true && requiredRoles.includes(user?.role);
    } catch {
      return false;
    }
  }

  // Service operations
  static async getAllServices(includeInactive = false): Promise<Service[]> {
    let query = supabase
      .from('services')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  static async getServiceById(id: string): Promise<Service | null> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getServicesByCategory(category: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async createService(serviceData: {
    name: string;
    description?: string;
    price: number;
    duration_minutes: number;
    category?: string;
  }): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .insert([serviceData])
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateService(id: string, updates: {
    name?: string;
    description?: string;
    price?: number;
    duration_minutes?: number;
    category?: string;
    is_active?: boolean;
  }): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteService(id: string): Promise<void> {
    const { error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  }

  static async hardDeleteService(id: string): Promise<void> {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}
