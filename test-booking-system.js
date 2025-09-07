// Booking System Test Examples
// Run these commands after setting up the database and starting the server

console.log('🔥 Booking System API Test Commands');
console.log('=====================================\n');

const baseUrl = 'http://localhost:3000';
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const tomorrowDate = tomorrow.toISOString().split('T')[0];

console.log('1. 📋 Get Booking Options (Available Time Slots)');
console.log(`curl -X GET "${baseUrl}/api/booking/options?date=${tomorrowDate}"`);
console.log('');

console.log('2. 📅 Check Booking Availability');
console.log(`curl -X GET "${baseUrl}/api/booking/availability?datetime=${tomorrow.toISOString()}"`);
console.log('');

console.log('3. 🆕 Create a New Booking');
const sampleBooking = {
  customer_name: "Ahmed Al-Mahmoud",
  customer_phone: "+973-3456-7890",
  customer_email: "ahmed@example.com",
  service_id: "SERVICE_ID_HERE", // Replace with actual service ID
  appointment_date: tomorrowDate,
  appointment_time: "10:00",
  notes: "First time customer",
  special_requests: "Please use beard oil"
};

console.log(`curl -X POST "${baseUrl}/api/bookings" \\`);
console.log('  -H "Content-Type: application/json" \\');
console.log(`  -d '${JSON.stringify(sampleBooking, null, 2)}'`);
console.log('');

console.log('4. 📖 Get All Bookings');
console.log(`curl -X GET "${baseUrl}/api/bookings"`);
console.log('');

console.log('5. 🔍 Search Bookings by Status');
console.log(`curl -X GET "${baseUrl}/api/bookings?status=pending"`);
console.log('');

console.log('6. 📱 Find Booking by Confirmation Code');
console.log(`curl -X GET "${baseUrl}/api/bookings?confirmation_code=ABC123"`);
console.log('');

console.log('7. 📞 Find Bookings by Customer Phone');
console.log(`curl -X GET "${baseUrl}/api/bookings?customer_phone=%2B973-3456-7890"`);
console.log('');

console.log('8. 📅 Get Bookings for Specific Date');
console.log(`curl -X GET "${baseUrl}/api/bookings?date=${tomorrowDate}"`);
console.log('');

console.log('9. ✏️ Update Booking Status');
console.log(`curl -X PUT "${baseUrl}/api/bookings/BOOKING_ID_HERE" \\`);
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"status": "confirmed"}\'');
console.log('');

console.log('10. 🕐 Reschedule Booking');
const rescheduleData = {
  appointment_date: tomorrowDate,
  appointment_time: "14:30",
  notes: "Rescheduled by customer request"
};
console.log(`curl -X PUT "${baseUrl}/api/bookings/BOOKING_ID_HERE" \\`);
console.log('  -H "Content-Type: application/json" \\');
console.log(`  -d '${JSON.stringify(rescheduleData)}'`);
console.log('');

console.log('11. ❌ Cancel Booking');
console.log(`curl -X DELETE "${baseUrl}/api/bookings/BOOKING_ID_HERE?reason=Customer%20requested%20cancellation"`);
console.log('');

console.log('12. 👤 Get Specific Booking Details');
console.log(`curl -X GET "${baseUrl}/api/bookings/BOOKING_ID_HERE"`);
console.log('');

console.log('📝 Sample Booking Flow:');
console.log('=======================');
console.log('1. Customer checks available time slots');
console.log('2. Customer selects service and time');
console.log('3. System creates booking with confirmation code');
console.log('4. Customer receives confirmation code');
console.log('5. Barber confirms booking (status: pending → confirmed)');
console.log('6. After service, mark as completed');
console.log('');

console.log('🎯 Key Features:');
console.log('================');
console.log('✅ Automatic conflict prevention');
console.log('✅ Customer creation/linking');
console.log('✅ Service price calculation');
console.log('✅ Confirmation code generation');
console.log('✅ Working hours validation');
console.log('✅ 1-hour advance booking requirement');
console.log('✅ BHD currency default');
console.log('✅ Customer statistics tracking');
console.log('');

console.log('🔧 First, get a service ID:');
console.log(`curl -X GET "${baseUrl}/api/services"`);
console.log('');

console.log('💡 Then replace SERVICE_ID_HERE and BOOKING_ID_HERE with actual IDs from the API responses!');
