import { NextRequest } from 'next/server';
import { corsResponse, corsOptions } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptions();
}

// Mock bookings database
let bookings = [
  {
    id: '1',
    customerId: 'customer1',
    customerName: 'Alice Johnson',
    customerPhone: '+1234567890',
    barberId: '1',
    barberName: 'John Smith',
    serviceId: '1',
    serviceName: 'Classic Haircut',
    date: '2025-09-01',
    time: '10:00',
    duration: 30,
    price: 25.00,
    status: 'confirmed', // pending, confirmed, completed, cancelled
    notes: 'Please trim the sides shorter',
    createdAt: '2025-08-31T10:00:00Z',
    updatedAt: '2025-08-31T10:00:00Z'
  },
  {
    id: '2',
    customerId: 'customer2',
    customerName: 'Bob Wilson',
    customerPhone: '+1234567891',
    barberId: '2',
    barberName: 'Mike Johnson',
    serviceId: '2',
    serviceName: 'Beard Trim',
    date: '2025-09-01',
    time: '14:30',
    duration: 20,
    price: 15.00,
    status: 'pending',
    notes: '',
    createdAt: '2025-08-31T11:00:00Z',
    updatedAt: '2025-08-31T11:00:00Z'
  }
];

// GET all bookings (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barberId = searchParams.get('barberId');
    const customerId = searchParams.get('customerId');
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    let filteredBookings = [...bookings];

    // Apply filters
    if (barberId) {
      filteredBookings = filteredBookings.filter(booking => booking.barberId === barberId);
    }
    if (customerId) {
      filteredBookings = filteredBookings.filter(booking => booking.customerId === customerId);
    }
    if (date) {
      filteredBookings = filteredBookings.filter(booking => booking.date === date);
    }
    if (status) {
      filteredBookings = filteredBookings.filter(booking => booking.status === status);
    }

    // Sort by date and time
    filteredBookings.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`);
      const dateTimeB = new Date(`${b.date}T${b.time}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });

    return corsResponse({
      message: 'Bookings retrieved successfully',
      data: filteredBookings,
      meta: {
        total: filteredBookings.length,
        filters: { barberId, customerId, date, status }
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}

// POST - Create new booking
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validation
    const requiredFields = [
      'customerName', 'customerPhone', 'barberId', 'serviceId', 
      'date', 'time', 'duration', 'price'
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return corsResponse(
          { error: `Missing required field: ${field}` },
          400
        );
      }
    }

    // Validate phone format (basic)
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(data.customerPhone)) {
      return corsResponse(
        { error: 'Invalid phone number format' },
        400
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      return corsResponse(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        400
      );
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(data.time)) {
      return corsResponse(
        { error: 'Invalid time format. Use HH:MM' },
        400
      );
    }

    // Check if booking slot is available
    const conflictingBooking = bookings.find(booking => 
      booking.barberId === data.barberId &&
      booking.date === data.date &&
      booking.time === data.time &&
      booking.status !== 'cancelled'
    );

    if (conflictingBooking) {
      return corsResponse(
        { error: 'Time slot is already booked' },
        409
      );
    }

    // Create new booking
    const newBooking = {
      id: (bookings.length + 1).toString(),
      customerId: data.customerId || `customer_${Date.now()}`,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      barberId: data.barberId,
      barberName: data.barberName || 'Unknown Barber',
      serviceId: data.serviceId,
      serviceName: data.serviceName || 'Unknown Service',
      date: data.date,
      time: data.time,
      duration: parseInt(data.duration),
      price: parseFloat(data.price),
      status: 'pending',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    bookings.push(newBooking);

    return corsResponse({
      message: 'Booking created successfully',
      data: newBooking
    }, 201);

  } catch (error) {
    console.error('Create booking error:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
