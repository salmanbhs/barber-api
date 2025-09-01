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

export interface Barber {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  specialties: string[];
  rating: number;
  bio?: string;
  profile_image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  barber_id: string;
  appointment_date: string;
  appointment_time: string;
  total_duration: number;
  total_price: number;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  customer?: Customer;
  barber?: Barber;
  services?: BookingService[];
}

export interface BookingService {
  id: string;
  booking_id: string;
  service_id: string;
  service_order: number;
  service_duration: number;
  service_price: number;
  created_at: string;
  // Joined data
  service?: Service;
}

export interface BusinessHours {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface BarberAvailability {
  id: string;
  barber_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
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

  // Barber operations
  static async getAllBarbers(): Promise<Barber[]> {
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async getBarberById(id: string): Promise<Barber | null> {
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Service operations
  static async getAllServices(): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('price', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async getServiceById(id: string): Promise<Service | null> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Business hours operations
  static async getBusinessHours(): Promise<BusinessHours[]> {
    const { data, error } = await supabase
      .from('business_hours')
      .select('*')
      .order('day_of_week');
    
    if (error) throw error;
    return data || [];
  }

  // Booking operations
  static async createBooking(booking: {
    customer_id: string;
    barber_id: string;
    appointment_date: string;
    appointment_time: string;
    total_duration: number;
    total_price: number;
    status?: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    notes?: string;
    services: {
      service_id: string;
      service_order: number;
      service_duration: number;
      service_price: number;
    }[];
  }): Promise<Booking> {
    // Start a transaction to ensure data consistency
    const { data: newBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        customer_id: booking.customer_id,
        barber_id: booking.barber_id,
        appointment_date: booking.appointment_date,
        appointment_time: booking.appointment_time,
        total_duration: booking.total_duration,
        total_price: booking.total_price,
        status: booking.status || 'confirmed',
        notes: booking.notes
      }])
      .select('*')
      .single();

    if (bookingError) throw bookingError;

    // Insert booking services
    const bookingServices = booking.services.map(service => ({
      booking_id: newBooking.id,
      service_id: service.service_id,
      service_order: service.service_order,
      service_duration: service.service_duration,
      service_price: service.service_price
    }));

    const { error: servicesError } = await supabase
      .from('booking_services')
      .insert(bookingServices);

    if (servicesError) throw servicesError;

    // Update customer stats
    await this.updateCustomerStats(booking.customer_id, booking.total_price);

    // Return the complete booking with customer and services
    return this.getBookingById(newBooking.id) as Promise<Booking>;
  }

  static async updateCustomerStats(customerId: string, bookingPrice: number): Promise<void> {
    // Increment visit count and total spent
    const { error } = await supabase.rpc('update_customer_stats', {
      customer_id: customerId,
      booking_price: bookingPrice
    });

    if (error) {
      // If the function doesn't exist, update manually
      const { data: customer } = await supabase
        .from('customers')
        .select('total_visits, total_spent')
        .eq('id', customerId)
        .single();

      if (customer) {
        await supabase
          .from('customers')
          .update({
            total_visits: customer.total_visits + 1,
            total_spent: customer.total_spent + bookingPrice,
            last_visit_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', customerId);
      }
    }
  }

  static async getAllBookings(filters?: {
    barber_id?: string;
    customer_id?: string;
    date?: string;
    status?: string;
  }): Promise<Booking[]> {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(*),
        barber:barbers(*),
        services:booking_services(
          *,
          service:services(*)
        )
      `);

    if (filters?.barber_id) {
      query = query.eq('barber_id', filters.barber_id);
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    if (filters?.date) {
      query = query.eq('appointment_date', filters.date);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('appointment_date', { ascending: true })
                 .order('appointment_time', { ascending: true });

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  static async getBookingById(id: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(*),
        barber:barbers(*),
        services:booking_services(
          *,
          service:services(*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        barber:barbers(*),
        service:services(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteBooking(id: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Check availability
  static async checkBarberAvailability(
    barberId: string, 
    date: string, 
    time: string, 
    duration: number
  ): Promise<boolean> {
    // Check for existing bookings that would conflict
    const endTime = this.addMinutesToTime(time, duration);
    
    const { data: existingBookings, error } = await supabase
      .from('bookings')
      .select('appointment_time, total_duration')
      .eq('barber_id', barberId)
      .eq('appointment_date', date)
      .in('status', ['confirmed', 'completed']);

    if (error) throw error;

    // Check if any existing booking conflicts
    for (const booking of existingBookings || []) {
      const bookingStart = booking.appointment_time;
      const bookingEnd = this.addMinutesToTime(bookingStart, booking.total_duration);
      
      // Check for time overlap
      if (this.timeOverlaps(time, endTime, bookingStart, bookingEnd)) {
        return false;
      }
    }

    return true;
  }

  // Generate available time slots for a barber on a specific date (YOUR ALGORITHM)
  static async getAvailableTimeSlots(
    barberId: string, 
    date: string, 
    serviceDuration: number = 30
  ): Promise<{ time: string; display: string; available: boolean }[]> {
    const dayOfWeek = new Date(date).getDay();
    
    // Get business hours for this day
    const { data: businessHours, error: hoursError } = await supabase
      .from('business_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .single();

    if (hoursError || !businessHours || businessHours.is_closed) {
      return [];
    }

    // Step 1: Generate ALL possible time slots (assume all available)
    const allSlots = [];
    const openTime = businessHours.open_time;
    const closeTime = businessHours.close_time;
    const slotDuration = 15; // 15-minute slots
    
    // Calculate minimum start time (1 hour from now)
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const todayString = now.toISOString().split('T')[0];
    
    let startTime = openTime;
    
    // If it's today, start from 1 hour from now
    if (date === todayString) {
      const minTime = oneHourFromNow.toTimeString().substring(0, 8); // HH:MM:SS
      if (this.timeToMinutes(minTime) > this.timeToMinutes(openTime)) {
        // Round up to next 15-minute slot
        const minMinutes = this.timeToMinutes(minTime);
        const roundedMinutes = Math.ceil(minMinutes / 15) * 15;
        startTime = this.minutesToTime(roundedMinutes);
      }
    }

    // Generate all time slots from start time to close
    let currentTime = startTime;
    while (this.timeToMinutes(currentTime) <= this.timeToMinutes(closeTime) - serviceDuration) {
      allSlots.push({
        time: `${date}T${currentTime}:00.000Z`,
        display: currentTime.substring(0, 5), // HH:MM format
        available: true // Assume all available initially
      });
      currentTime = this.addMinutesToTime(currentTime, slotDuration);
    }

    // Step 2: Get ALL bookings for this barber on this date (single query)
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('appointment_time, total_duration')
      .eq('barber_id', barberId)
      .eq('appointment_date', date)
      .in('status', ['confirmed', 'completed']);

    if (bookingsError) throw bookingsError;

    // Step 3: Remove booked time slots
    if (existingBookings && existingBookings.length > 0) {
      // Create set of blocked time slots for fast lookup
      const blockedSlots = new Set<string>();
      
      for (const booking of existingBookings) {
        const bookingStart = booking.appointment_time;
        const bookingDuration = booking.total_duration;
        
        // Mark all 15-minute slots covered by this booking as blocked
        let currentSlot = bookingStart;
        const bookingEnd = this.addMinutesToTime(bookingStart, bookingDuration);
        
        while (this.timeToMinutes(currentSlot) < this.timeToMinutes(bookingEnd)) {
          blockedSlots.add(currentSlot.substring(0, 5)); // HH:MM format
          currentSlot = this.addMinutesToTime(currentSlot, 15);
        }
      }

      // Update availability for each slot
      for (const slot of allSlots) {
        const slotTime = slot.display; // HH:MM format
        
        // Check if this slot conflicts with any booking
        let hasConflict = false;
        
        // Check if enough consecutive slots are available for service duration
        let checkTime = slotTime + ':00'; // Convert to HH:MM:SS
        const slotsNeeded = Math.ceil(serviceDuration / 15);
        
        for (let i = 0; i < slotsNeeded; i++) {
          const checkSlot = checkTime.substring(0, 5); // HH:MM
          if (blockedSlots.has(checkSlot)) {
            hasConflict = true;
            break;
          }
          checkTime = this.addMinutesToTime(checkTime, 15);
        }
        
        slot.available = !hasConflict;
      }
    }

    return allSlots;
  }

  // Helper function to convert minutes to time format
  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  }

  // Utility functions
  private static addMinutesToTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}:00`;
  }

  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static timeOverlaps(
    start1: string, 
    end1: string, 
    start2: string, 
    end2: string
  ): boolean {
    const start1Minutes = this.timeToMinutes(start1);
    const end1Minutes = this.timeToMinutes(end1);
    const start2Minutes = this.timeToMinutes(start2);
    const end2Minutes = this.timeToMinutes(end2);

    return (start1Minutes < end2Minutes && end1Minutes > start2Minutes);
  }
}
