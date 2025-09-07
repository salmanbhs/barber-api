// Simple test file for the updated company configuration
// You can run this with: node test-company-config.js

const testEndpoints = [
  {
    name: 'Company Configuration',
    url: '/api/company/config',
    method: 'GET'
  },
  {
    name: 'Shop Status',
    url: '/api/company/status',
    method: 'GET'
  },
  {
    name: 'Booking Availability (1 hour from now)',
    url: `/api/booking/availability?datetime=${new Date(Date.now() + 60*60*1000).toISOString()}`,
    method: 'GET'
  },
  {
    name: 'Booking Availability (30 minutes from now - should fail)',
    url: `/api/booking/availability?datetime=${new Date(Date.now() + 30*60*1000).toISOString()}`,
    method: 'GET'
  },
  {
    name: 'Theme Configuration',
    url: '/api/company/theme',
    method: 'GET'
  }
];

console.log('🧪 Company Configuration Test Endpoints');
console.log('=====================================');
console.log('Run these tests after starting your server:\n');

testEndpoints.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}`);
  console.log(`   curl -X ${test.method} "http://localhost:3000${test.url}"`);
  console.log('');
});

console.log('📝 Configuration Summary:');
console.log('- Booking advance: 1 hour minimum');
console.log('- No cancellation policy');
console.log('- No tax/deposit settings');
console.log('- Default currency: BHD');
console.log('- Time slots: 15, 30, or 60 minutes');
console.log('- Working hours: 9-12, 16-20 (with break)');

// Example config object
const exampleConfig = {
  company_name: "Modern Barber Shop",
  company_phone: "+973-1234-5678",
  company_email: "info@modernbarber.bh",
  primary_color: "#2563eb",
  secondary_color: "#64748b",
  accent_color: "#f59e0b",
  booking_advance_hours: 1,
  time_slot_interval: 30,
  currency: "BHD",
  working_hours: {
    monday: {
      isOpen: true,
      shifts: [
        {start: "09:00", end: "12:00"},
        {start: "16:00", end: "20:00"}
      ]
    },
    tuesday: {
      isOpen: true,
      shifts: [
        {start: "09:00", end: "12:00"},
        {start: "16:00", end: "20:00"}
      ]
    },
    wednesday: {
      isOpen: true,
      shifts: [
        {start: "09:00", end: "12:00"},
        {start: "16:00", end: "20:00"}
      ]
    },
    thursday: {
      isOpen: true,
      shifts: [
        {start: "09:00", end: "12:00"},
        {start: "16:00", end: "20:00"}
      ]
    },
    friday: {
      isOpen: true,
      shifts: [
        {start: "09:00", end: "12:00"},
        {start: "16:00", end: "20:00"}
      ]
    },
    saturday: {
      isOpen: true,
      shifts: [
        {start: "09:00", end: "18:00"}
      ]
    },
    sunday: {
      isOpen: false,
      shifts: []
    }
  }
};

console.log('\n📋 Example Configuration to POST/PUT:');
console.log(JSON.stringify(exampleConfig, null, 2));
