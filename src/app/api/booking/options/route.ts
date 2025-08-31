import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

// GET all booking options (barbers, services, available times)
export async function GET() {
  try {
    // Generate available time slots for the next 7 days
    const generateTimeSlots = (date: Date, startHour: number, endHour: number, duration: number = 30) => {
      const slots = [];
      const currentDate = new Date(date);
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += duration) {
          const slotTime = new Date(currentDate);
          slotTime.setHours(hour, minute, 0, 0);
          
          slots.push({
            time: slotTime.toISOString(),
            display: slotTime.toTimeString().substring(0, 5), // HH:MM format
            available: Math.random() > 0.3 // 70% chance of being available (mock data)
          });
        }
      }
      return slots;
    };

    // Generate available dates for the next 7 days
    const generateAvailableDates = () => {
      const dates = [];
      const today = new Date();
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Skip Sundays for some barbers (example business logic)
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        dates.push({
          date: date.toISOString().split('T')[0], // YYYY-MM-DD format
          dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
          slots: generateTimeSlots(
            date, 
            isWeekend ? 10 : 9, // Weekend starts later
            isWeekend ? 17 : 18  // Weekend ends earlier
          )
        });
      }
      return dates;
    };

    // TODO: Replace with actual database queries
    const barbers = [
      {
        id: '1',
        name: 'John Smith',
        specialties: ['haircut', 'beard', 'styling'],
        rating: 4.8,
        profileImage: null,
        availability: generateAvailableDates()
      },
      {
        id: '2',
        name: 'Mike Johnson',
        specialties: ['haircut', 'fade', 'beard'],
        rating: 4.9,
        profileImage: null,
        availability: generateAvailableDates()
      }
    ];

    const services = [
      {
        id: '1',
        name: 'Classic Haircut',
        duration: 30,
        price: 25.00,
        category: 'haircut'
      },
      {
        id: '2',
        name: 'Beard Trim',
        duration: 20,
        price: 15.00,
        category: 'beard'
      },
      {
        id: '3',
        name: 'Premium Styling',
        duration: 45,
        price: 40.00,
        category: 'styling'
      },
      {
        id: '4',
        name: 'Fade Cut',
        duration: 35,
        price: 30.00,
        category: 'haircut'
      },
      {
        id: '5',
        name: 'Hot Towel Shave',
        duration: 25,
        price: 20.00,
        category: 'shave'
      }
    ];

    // Business hours
    const businessHours = {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '17:00' },
      sunday: { open: '11:00', close: '15:00' }
    };

    return corsResponse({
      message: 'Booking options retrieved successfully',
      data: {
        barbers,
        services,
        businessHours,
        bookingRules: {
          minAdvanceHours: 2, // Must book at least 2 hours in advance
          maxAdvanceDays: 30,  // Can book up to 30 days in advance
          slotDuration: 30     // 30-minute time slots
        }
      }
    });

  } catch (error) {
    console.error('Get booking options error:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
