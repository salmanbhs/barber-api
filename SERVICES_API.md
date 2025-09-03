# Services API Documentation

## Overview
The Services API provides CRUD operations for managing barbershop services. It includes public access for viewing services and admin-only access for creating, updating, and deleting services.

## Database Setup
Run the following SQL script in your Supabase SQL Editor to create the services table:

```sql
-- File: database/add-services-table.sql
```

This will create the `services` table with sample data including:
- Classic Haircut ($25, 45min)
- Beard Trim ($15, 30min)
- Hot Towel Shave ($35, 45min)
- Full Service Package ($50, 90min)
- And more...

## API Endpoints

### GET /api/services
**Public access** - Retrieve all active services

**Query Parameters:**
- `category` (optional) - Filter by service category
- `includeInactive=true` (staff only) - Include inactive services

**Response:**
```json
{
  "message": "Services retrieved successfully",
  "data": {
    "services": [...],
    "servicesByCategory": {
      "haircut": [...],
      "beard": [...],
      "styling": [...]
    },
    "count": 10,
    "categories": ["haircut", "beard", "styling", "shave", "treatment", "package"]
  }
}
```

### GET /api/services/[id]
**Public access** - Retrieve a specific service by ID

**Response:**
```json
{
  "message": "Service retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "Classic Haircut",
    "description": "Traditional men's haircut with scissors and clipper",
    "price": 25.00,
    "duration_minutes": 45,
    "category": "haircut",
    "is_active": true,
    "created_at": "2025-09-03T...",
    "updated_at": "2025-09-03T..."
  }
}
```

### POST /api/services
**Admin only** - Create a new service

**Request Body:**
```json
{
  "name": "New Service",
  "description": "Service description",
  "price": 30.00,
  "duration_minutes": 60,
  "category": "haircut"
}
```

**Required fields:** `name`, `price`, `duration_minutes`

### PUT /api/services/[id]
**Admin only** - Update an existing service

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Service Name",
  "description": "Updated description",
  "price": 35.00,
  "duration_minutes": 50,
  "category": "styling",
  "is_active": false
}
```

### DELETE /api/services/[id]
**Admin only** - Delete a service

**Query Parameters:**
- `hard=true` (optional) - Permanently delete instead of soft delete

**Soft delete** (default): Sets `is_active` to false
**Hard delete**: Permanently removes from database

## Service Categories
Standard categories include:
- `haircut` - Hair cutting services
- `beard` - Beard grooming services  
- `styling` - Hair styling services
- `shave` - Shaving services
- `treatment` - Hair treatments
- `grooming` - General grooming
- `package` - Service combinations

## Authentication
- **Public endpoints:** No authentication required
- **Admin endpoints:** Require Bearer token with admin role
- **Staff endpoints:** Require Bearer token with admin or barber role

## Error Responses
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Caching
- Services list cached for 1 hour (3600 seconds)
- Individual services cached for 2 hours (7200 seconds)
- Cache automatically revalidated when data changes
