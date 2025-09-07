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

export interface WorkingShift {
  start: string; // Format: "HH:MM"
  end: string;   // Format: "HH:MM"
}

export interface DaySchedule {
  isOpen: boolean;
  shifts: WorkingShift[];
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface Holiday {
  date: string; // Format: "YYYY-MM-DD"
  name: string;
  isRecurring?: boolean;
  customHours?: WorkingShift[];
}

export interface SocialMedia {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  whatsapp?: string;
  google_business?: string;
}

export interface CompanyConfig {
  id: string;
  company_name: string;
  company_description?: string;
  company_logo_url?: string;
  company_phone?: string;
  company_email?: string;
  company_address?: string;
  company_website?: string;
  working_hours: WorkingHours;
  holidays: Holiday[];
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  booking_advance_hours: number;
  default_service_duration: number;
  time_slot_interval: number;
  max_daily_bookings: number;
  currency: string;
  sms_notifications: boolean;
  email_notifications: boolean;
  reminder_hours_before: number;
  social_media: SocialMedia;
  is_active: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
  created_at: string;
  updated_at: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface BookingService {
  id: string;
  booking_id: string;
  service_id: string;
  service_name: string;
  service_price: number;
  service_duration: number;
  service_order: number;
  created_at: string;
  // Join fields
  service?: Service;
}

export interface Booking {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  // Removed single service fields, now using services array
  services_count: number;
  total_duration: number; // Total duration of all services
  services_summary: string; // Human-readable summary like "Haircut, Beard Trim"
  barber_id?: string;
  barber_name?: string;
  appointment_date: string;
  appointment_time: string;
  appointment_datetime: string;
  total_amount: number;
  currency: string;
  notes?: string;
  special_requests?: string;
  status: BookingStatus;
  booking_source: string;
  confirmation_code: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  cancelled_at?: string;
  completed_at?: string;
  // Join fields
  customer?: Customer;
  services?: BookingService[]; // Array of services in this booking
  barber?: User;
}

export interface TimeSlot {
  slot_time: string;
  slot_datetime: string;
  is_available: boolean;
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

  static async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
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

  // Company Configuration operations
  static async getCompanyConfig(): Promise<CompanyConfig | null> {
    const { data, error } = await supabase
      .from('company_config')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async updateCompanyConfig(updates: Partial<Omit<CompanyConfig, 'id' | 'created_at' | 'updated_at'>>): Promise<CompanyConfig> {
    // First get the current config
    const currentConfig = await this.getCompanyConfig();
    
    if (!currentConfig) {
      throw new Error('No company configuration found');
    }

    const { data, error } = await supabase
      .from('company_config')
      .update(updates)
      .eq('id', currentConfig.id)
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createCompanyConfig(configData: Partial<Omit<CompanyConfig, 'id' | 'created_at' | 'updated_at'>>): Promise<CompanyConfig> {
    const { data, error } = await supabase
      .from('company_config')
      .insert([configData])
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  }

  static async isShopOpen(checkDate?: Date): Promise<boolean> {
    const checkDateTime = checkDate?.toISOString() || new Date().toISOString();
    console.log('Debug isShopOpen: checking datetime', checkDateTime);
    
    try {
      const { data, error } = await supabase
        .rpc('is_shop_open', { 
          check_datetime: checkDateTime
        });
      
      if (error) {
        console.log('Debug isShopOpen: RPC error', error);
        // Fallback to basic time check if RPC function doesn't exist
        return await this.isShopOpenFallback(checkDate);
      }
      
      console.log('Debug isShopOpen: RPC result', data);
      return data || false;
    } catch (err) {
      console.log('Debug isShopOpen: Exception', err);
      return await this.isShopOpenFallback(checkDate);
    }
  }

  // Fallback method if RPC function doesn't exist
  static async isShopOpenFallback(checkDate?: Date): Promise<boolean> {
    const config = await this.getCompanyConfig();
    if (!config) {
      console.log('Debug fallback: No company config found');
      return false;
    }
    
    const targetDate = checkDate || new Date();
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof WorkingHours;
    const daySchedule = config.working_hours[dayName];
    
    console.log('Debug fallback: checking day schedule for', dayName, 'on date:', targetDate.toISOString());
    console.log('Debug fallback: day schedule found:', JSON.stringify(daySchedule, null, 2));
    console.log('Debug fallback: all working hours:', JSON.stringify(config.working_hours, null, 2));
    
    if (!daySchedule || !daySchedule.isOpen) {
      console.log('Debug fallback: day is closed or schedule missing');
      return false;
    }
    
    const targetTime = `${targetDate.getUTCHours().toString().padStart(2, '0')}:${targetDate.getUTCMinutes().toString().padStart(2, '0')}`; // HH:MM format in UTC
    console.log('Debug fallback: target time (UTC)', targetTime);
    console.log('Debug fallback: local time would be', targetDate.toTimeString().slice(0, 5));
    console.log('Debug fallback: available shifts:', JSON.stringify(daySchedule.shifts, null, 2));
    
    // Check if time falls within any shift
    for (const shift of daySchedule.shifts || []) {
      console.log(`Debug fallback: checking if ${targetTime} is between ${shift.start} and ${shift.end}`);
      if (targetTime >= shift.start && targetTime <= shift.end) {
        console.log('Debug fallback: time is within shift', shift);
        return true;
      }
    }
    
    console.log('Debug fallback: time is outside all shifts');
    return false;
  }

  static async getWorkingHoursForDate(date: Date): Promise<DaySchedule | null> {
    const config = await this.getCompanyConfig();
    if (!config) return null;

    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof WorkingHours;
    return config.working_hours[dayName] || null;
  }

  static async canBookAtTime(bookingDateTime: Date, barberId?: string, totalDuration?: number): Promise<boolean> {
    const config = await this.getCompanyConfig();
    if (!config) {
      console.log('Debug: No company config found');
      return false;
    }

    const now = new Date();
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    console.log('Debug canBookAtTime:', {
      bookingDateTime: bookingDateTime.toISOString(),
      now: now.toISOString(),
      hoursUntilBooking: hoursUntilBooking,
      requiredAdvanceHours: config.booking_advance_hours,
      barberId: barberId,
      totalDuration: totalDuration
    });
    
    // Check if booking is within advance hours limit
    if (hoursUntilBooking < (config.booking_advance_hours || 1)) {
      console.log('Debug: Booking too soon, advance hours check failed');
      return false;
    }

    // Check if shop is open at that time
    const isOpen = await this.isShopOpen(bookingDateTime);
    console.log('Debug: Shop open check result:', isOpen);
    if (!isOpen) {
      return false;
    }

    // Check for booking conflicts if barberId is provided
    if (barberId) {
      const hasConflict = await this.hasBookingConflict(bookingDateTime, barberId, totalDuration);
      console.log('Debug: Booking conflict check result:', hasConflict);
      if (hasConflict) {
        return false;
      }
    }

    return true;
  }

  static async hasBookingConflict(bookingDateTime: Date, barberId: string, totalDuration?: number): Promise<boolean> {
    try {
      // Get service duration to calculate time range
      let serviceDuration = totalDuration || 60; // Use provided duration or default 1 hour

      // Calculate booking end time
      const bookingEndTime = new Date(bookingDateTime.getTime() + (serviceDuration * 60 * 1000));
      
      console.log('Debug conflict check:', {
        bookingStart: bookingDateTime.toISOString(),
        bookingEnd: bookingEndTime.toISOString(),
        barberId: barberId,
        serviceDuration: serviceDuration
      });

      // Get the barber's user_id for database query
      const barber = await this.getBarberById(barberId);
      if (!barber || !barber.user_id) {
        console.log('Debug: Barber not found or no user_id');
        return false; // If barber doesn't exist, no conflict
      }

      // Check for overlapping bookings for this barber
      // Need to find bookings that could overlap with our time slot
      // An existing booking conflicts if:
      // 1. It starts before our booking ends, AND
      // 2. It ends after our booking starts
      // So we need to get all bookings for this barber on this day and check each one
      
      const dayStart = new Date(bookingDateTime);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(bookingDateTime);
      dayEnd.setUTCHours(23, 59, 59, 999);
      
      const { data: conflictingBookings, error } = await supabase
        .from('bookings')
        .select('id, appointment_datetime, total_duration, barber_name, customer_name')
        .eq('barber_id', barber.user_id)
        .in('status', ['pending', 'confirmed']) // Only check active bookings
        .gte('appointment_datetime', dayStart.toISOString())
        .lte('appointment_datetime', dayEnd.toISOString());

      if (error) {
        console.error('Error checking booking conflicts:', error);
        return false; // If we can't check, allow booking (could also return true to be safe)
      }

      console.log('Debug: Found potentially conflicting bookings:', conflictingBookings);

      // Check each booking for actual time overlap
      for (const booking of conflictingBookings || []) {
        const existingStart = new Date(booking.appointment_datetime);
        const existingEnd = new Date(existingStart.getTime() + (booking.total_duration * 60 * 1000));

        // Check for overlap: new booking overlaps if it starts before existing ends AND ends after existing starts
        const hasOverlap = (bookingDateTime < existingEnd) && (bookingEndTime > existingStart);
        
        if (hasOverlap) {
          console.log('Debug: CONFLICT DETECTED with booking:', {
            existingBooking: booking.id,
            existingStart: existingStart.toISOString(),
            existingEnd: existingEnd.toISOString(),
            existingCustomer: booking.customer_name,
            newBookingStart: bookingDateTime.toISOString(),
            newBookingEnd: bookingEndTime.toISOString()
          });
          return true; // Conflict found
        }
      }

      console.log('Debug: No conflicts found');
      return false; // No conflicts
    } catch (error) {
      console.error('Error in hasBookingConflict:', error);
      return false; // If error, allow booking (could also return true to be conservative)
    }
  }

  static async updateWorkingHours(workingHours: WorkingHours): Promise<CompanyConfig> {
    return this.updateCompanyConfig({ working_hours: workingHours });
  }

  static async addHoliday(holiday: Holiday): Promise<CompanyConfig> {
    const config = await this.getCompanyConfig();
    if (!config) throw new Error('No company configuration found');

    const updatedHolidays = [...config.holidays, holiday];
    return this.updateCompanyConfig({ holidays: updatedHolidays });
  }

  static async removeHoliday(holidayDate: string): Promise<CompanyConfig> {
    const config = await this.getCompanyConfig();
    if (!config) throw new Error('No company configuration found');

    const updatedHolidays = config.holidays.filter(h => h.date !== holidayDate);
    return this.updateCompanyConfig({ holidays: updatedHolidays });
  }

  static async updateTheme(themeColors: {
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    background_color?: string;
    text_color?: string;
  }): Promise<CompanyConfig> {
    return this.updateCompanyConfig(themeColors);
  }

  static async setMaintenanceMode(enabled: boolean, message?: string): Promise<CompanyConfig> {
    const updates: any = { maintenance_mode: enabled };
    if (message) {
      updates.maintenance_message = message;
    }
    return this.updateCompanyConfig(updates);
  }

  // Booking operations
  static async createBooking(bookingData: {
    customer_id: string;
    service_ids: string[]; // Changed from service_id to service_ids array
    barber_id: string;
    appointment_date: string;
    appointment_time: string;
    notes?: string;
    special_requests?: string;
  }): Promise<Booking> {
    // Get all service details to calculate pricing and duration
    const services: Service[] = [];
    let totalPrice = 0;
    let totalDuration = 0;
    
    for (const serviceId of bookingData.service_ids) {
      const service = await this.getServiceById(serviceId);
      if (!service) {
        throw new Error(`Service with ID ${serviceId} not found`);
      }
      services.push(service);
      totalPrice += service.price;
      totalDuration += service.duration_minutes;
    }

    if (services.length === 0) {
      throw new Error('At least one service must be selected');
    }

    // Get customer details
    const customer = await this.getCustomerById(bookingData.customer_id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get barber details (required)
    const barber = await this.getBarberById(bookingData.barber_id);
    if (!barber) {
      throw new Error('Barber not found');
    }
    if (!barber.user_id) {
      throw new Error('Barber is not associated with a user account');
    }
    const barber_name = barber.user?.name || barber.user?.phone || 'Unknown Barber';

    // Get company config for currency
    const config = await this.getCompanyConfig();
    const currency = config?.currency || 'BHD';

    // Check availability with detailed error messaging (using total duration)
    const appointmentDateTime = new Date(`${bookingData.appointment_date}T${bookingData.appointment_time}:00.000Z`);
    const canBook = await this.canBookAtTime(appointmentDateTime, bookingData.barber_id, totalDuration);
    if (!canBook) {
      // Get more specific error information
      const config = await this.getCompanyConfig();
      const now = new Date();
      const hoursUntilBooking = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const isAdvanceOk = hoursUntilBooking >= (config?.booking_advance_hours || 1);
      const isShopOpen = await this.isShopOpen(appointmentDateTime);
      const hasConflict = await this.hasBookingConflict(appointmentDateTime, bookingData.barber_id, totalDuration);
      
      let errorMessage = 'Selected time slot is not available';
      if (!isAdvanceOk) {
        errorMessage += ` - Must book at least ${config?.booking_advance_hours || 1} hour(s) in advance`;
      } else if (!isShopOpen) {
        const dayName = appointmentDateTime.toLocaleDateString('en-US', { weekday: 'long' });
        errorMessage += ` - Shop is closed on ${dayName} at ${bookingData.appointment_time}. Check working hours.`;
      } else if (hasConflict) {
        errorMessage += ` - Barber ${barber_name} is already booked at ${bookingData.appointment_time} on ${bookingData.appointment_date}. Please choose a different time or barber.`;
      }
      
      throw new Error(errorMessage);
    }

    // Create the main booking record
    const servicesNames = services.map(s => s.name).join(', ');
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert([{
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email,
        services_count: services.length,
        total_duration: totalDuration,
        services_summary: servicesNames,
        barber_id: barber.user_id, // Use the user_id, not the barber_id
        barber_name,
        appointment_date: bookingData.appointment_date,
        appointment_time: bookingData.appointment_time,
        total_amount: totalPrice,
        currency,
        notes: bookingData.notes,
        special_requests: bookingData.special_requests,
        booking_source: 'web',
        status: 'pending'
      }])
      .select('*')
      .single();

    if (error) throw error;

    // Create booking_services records for each service
    const bookingServices = services.map((service, index) => ({
      booking_id: booking.id,
      service_id: service.id,
      service_name: service.name,
      service_price: service.price,
      service_duration: service.duration_minutes,
      service_order: index + 1
    }));

    const { error: servicesError } = await supabase
      .from('booking_services')
      .insert(bookingServices);

    if (servicesError) {
      // If service insertion fails, we should clean up the booking
      await supabase.from('bookings').delete().eq('id', booking.id);
      throw servicesError;
    }

    // Return the booking with services attached
    return {
      ...booking,
      services: bookingServices.map(bs => ({
        id: '', // Will be generated by database
        booking_id: bs.booking_id,
        service_id: bs.service_id,
        service_name: bs.service_name,
        service_price: bs.service_price,
        service_duration: bs.service_duration,
        service_order: bs.service_order,
        created_at: new Date().toISOString()
      }))
    };
  }

  static async getBookingById(id: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(*),
        service:services(*),
        barber:users(*)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getBookingByConfirmationCode(code: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(*),
        service:services(*),
        barber:users(*)
      `)
      .eq('confirmation_code', code)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getAllBookings(filters?: {
    status?: BookingStatus;
    date?: string;
    customer_phone?: string;
    service_id?: string;
    barber_id?: string;
    customer_id?: string;
  }): Promise<Booking[]> {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(*),
        barber:users(*)
      `)
      .order('appointment_datetime', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.date) {
      query = query.eq('appointment_date', filters.date);
    }
    if (filters?.customer_phone) {
      query = query.eq('customer_phone', filters.customer_phone);
    }
    if (filters?.service_id) {
      // Skip service_id filter for now since column might not exist
      console.warn('service_id filter skipped - requires database migration');
    }
    if (filters?.barber_id) {
      query = query.eq('barber_id', filters.barber_id);
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  static async updateBooking(id: string, updates: Partial<{
    appointment_date: string;
    appointment_time: string;
    notes: string;
    special_requests: string;
    status: BookingStatus;
  }>): Promise<Booking> {
    // If changing appointment time, check availability
    if (updates.appointment_date || updates.appointment_time) {
      const currentBooking = await this.getBookingById(id);
      if (!currentBooking) throw new Error('Booking not found');

      const newDate = updates.appointment_date || currentBooking.appointment_date;
      const newTime = updates.appointment_time || currentBooking.appointment_time;
      const appointmentDateTime = new Date(`${newDate}T${newTime}`);

      // Check booking conflict excluding current booking
      const { data: hasConflict } = await supabase
        .rpc('check_booking_conflict', {
          check_datetime: appointmentDateTime.toISOString(),
          service_duration_minutes: currentBooking.total_duration,
          booking_id_to_exclude: id
        });

      if (hasConflict) {
        throw new Error('Selected time slot is not available');
      }
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  static async cancelBooking(id: string, reason?: string): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled'
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  static async getAvailableTimeSlots(date: string, serviceDuration?: number): Promise<TimeSlot[]> {
    const config = await this.getCompanyConfig();
    const duration = serviceDuration || config?.default_service_duration || 30;

    const { data, error } = await supabase
      .rpc('get_available_time_slots', {
        target_date: date,
        service_duration_minutes: duration
      });

    if (error) throw error;
    return data || [];
  }
}
