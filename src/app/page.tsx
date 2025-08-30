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
      
      <h2>🚀 Quick Start</h2>
      <pre style={{ backgroundColor: '#000', color: '#0f0', padding: '10px', borderRadius: '4px' }}>
{`# Send OTP (works for both new and existing users)
curl -X POST http://localhost:3001/api/auth/send-otp \\
  -H "Content-Type: application/json" \\
  -d '{"phone": "+1234567890"}'

# Verify OTP
curl -X POST http://localhost:3001/api/auth/verify-otp \\
  -H "Content-Type: application/json" \\
  -d '{"phone": "+1234567890", "token": "123456"}'`}
      </pre>
      
      <p style={{ marginTop: '20px', color: '#666' }}>
        Version: {apiInfo.version} | Status: {apiInfo.status}
      </p>
    </div>
  );
}
