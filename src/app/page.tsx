export default function Home() {
  const apiInfo = {
    name: 'Barber API',
    version: '0.1.0',
    description: 'A barbershop management API with SMS OTP authentication',
    documentation: {
      info: '/api/info',
      endpoints: {
        authentication: {
          sendOtp: 'POST /api/auth/send-otp',
          verifyOtp: 'POST /api/auth/verify-otp',
          logout: 'POST /api/auth/logout'
        },
        barbers: {
          list: 'GET /api/barbers',
          create: 'POST /api/barbers',
          getById: 'GET /api/barbers/{id}',
          update: 'PUT /api/barbers/{id}',
          delete: 'DELETE /api/barbers/{id}'
        },
        services: {
          list: 'GET /api/services',
          create: 'POST /api/services',
          getById: 'GET /api/services/{id}',
          update: 'PUT /api/services/{id}',
          delete: 'DELETE /api/services/{id}'
        }
      }
    },
    status: 'running'
  };

  return (
    <div style={{ fontFamily: 'monospace', padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1>🔥 Barber API</h1>
      <p>A barbershop management API with SMS OTP authentication</p>
      
      <h2>📚 API Documentation</h2>
      <ul>
        <li><strong>Info:</strong> <code>GET /api/info</code></li>
      </ul>
      
      <h2>🔐 Authentication Endpoints</h2>
      <ul>
        <li><strong>Send OTP:</strong> <code>POST /api/auth/send-otp</code> (handles both login & registration)</li>
        <li><strong>Verify OTP:</strong> <code>POST /api/auth/verify-otp</code></li>
        <li><strong>Logout:</strong> <code>POST /api/auth/logout</code></li>
      </ul>
      
      <h2>💈 Barber Management Endpoints</h2>
      <ul>
        <li><strong>List Barbers:</strong> <code>GET /api/barbers</code></li>
        <li><strong>Create Barber:</strong> <code>POST /api/barbers</code></li>
        <li><strong>Get Barber:</strong> <code>GET /api/barbers/&#123;id&#125;</code></li>
        <li><strong>Update Barber:</strong> <code>PUT /api/barbers/&#123;id&#125;</code></li>
        <li><strong>Delete Barber:</strong> <code>DELETE /api/barbers/&#123;id&#125;</code></li>
      </ul>
      
      <h2>🛠️ Service Management Endpoints</h2>
      <ul>
        <li><strong>List Services:</strong> <code>GET /api/services</code></li>
        <li><strong>Create Service:</strong> <code>POST /api/services</code></li>
        <li><strong>Get Service:</strong> <code>GET /api/services/&#123;id&#125;</code></li>
        <li><strong>Update Service:</strong> <code>PUT /api/services/&#123;id&#125;</code></li>
        <li><strong>Delete Service:</strong> <code>DELETE /api/services/&#123;id&#125;</code></li>
      </ul>
      
      <h2>🚀 Quick Start</h2>
      <pre style={{ backgroundColor: '#000', color: '#0f0', padding: '10px', borderRadius: '4px' }}>
{`# Authentication
curl -X POST http://localhost:3001/api/auth/send-otp \\
  -H "Content-Type: application/json" \\
  -d '{"phone": "+1234567890"}'

curl -X POST http://localhost:3001/api/auth/verify-otp \\
  -H "Content-Type: application/json" \\
  -d '{"phone": "+1234567890", "token": "123456"}'

# Barber Management
curl -X GET http://localhost:3001/api/barbers

curl -X POST http://localhost:3001/api/barbers \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@barbershop.com",
    "phone": "+1234567890",
    "specialties": ["haircut", "beard"],
    "experience": 5
  }'

# Service Management
curl -X GET http://localhost:3001/api/services

curl -X POST http://localhost:3001/api/services \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Premium Haircut",
    "description": "Luxury haircut experience",
    "duration": 45,
    "price": 35.00,
    "category": "haircut"
  }'`}
      </pre>
      
      <p style={{ marginTop: '20px', color: '#666' }}>
        Version: {apiInfo.version} | Status: {apiInfo.status}
      </p>
    </div>
  );
}
