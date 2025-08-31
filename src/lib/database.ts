import { supabase } from './supabase';

// Types for our database entities
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
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  duration: number;
  total_price: number;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  barber?: Barber;
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
  static async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert([booking])
      .select(`
        *,
        barber:barbers(*),
        service:services(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getAllBookings(filters?: {
    barber_id?: string;
    date?: string;
    status?: string;
  }): Promise<Booking[]> {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        barber:barbers(*),
        service:services(*)
      `);

    if (filters?.barber_id) {
      query = query.eq('barber_id', filters.barber_id);
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
        barber:barbers(*),
        service:services(*)
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
      .select('appointment_time, duration')
      .eq('barber_id', barberId)
      .eq('appointment_date', date)
      .in('status', ['confirmed', 'completed']);

    if (error) throw error;

    // Check if any existing booking conflicts
    for (const booking of existingBookings || []) {
      const bookingStart = booking.appointment_time;
      const bookingEnd = this.addMinutesToTime(bookingStart, booking.duration);
      
      // Check for time overlap
      if (this.timeOverlaps(time, endTime, bookingStart, bookingEnd)) {
        return false;
      }
    }

    return true;
  }

  // Generate available time slots for a barber on a specific date
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

    // Get existing bookings for this barber on this date
    const existingBookings = await this.getAllBookings({
      barber_id: barberId,
      date: date
    });

    // Generate time slots
    const slots = [];
    const openTime = businessHours.open_time;
    const closeTime = businessHours.close_time;
    const slotDuration = 15; // 15-minute slots

    let currentTime = openTime;
    while (this.timeToMinutes(currentTime) < this.timeToMinutes(closeTime) - serviceDuration) {
      const endTime = this.addMinutesToTime(currentTime, serviceDuration);
      
      // Check if this slot is available
      const isAvailable = await this.checkBarberAvailability(
        barberId, 
        date, 
        currentTime, 
        serviceDuration
      );

      slots.push({
        time: `${date}T${currentTime}:00.000Z`,
        display: currentTime.substring(0, 5), // HH:MM format
        available: isAvailable
      });

      currentTime = this.addMinutesToTime(currentTime, slotDuration);
    }

    return slots;
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
