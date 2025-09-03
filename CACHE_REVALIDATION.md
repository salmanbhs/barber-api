# Cache Revalidation API

## Overview
The revalidation API allows you to manually refresh cached data without waiting for the automatic revalidation period (24 hours). This is perfect for getting fresh data immediately after making changes.

## Manual Revalidation Endpoints

### GET /api/revalidate
**Manual cache revalidation via GET request (ADMIN ONLY)**

**Headers:**
- `Authorization: Bearer <admin_token>` (required)

**Query Parameters:**
- `path` (required) - The API path to revalidate

**Example:**
```bash
# Revalidate services cache (admin token required)
curl -H "Authorization: Bearer your-admin-token" \
  "https://barber-api-three.vercel.app/api/revalidate?path=/api/services"
```

**Response:**
```json
{
  "message": "Cache revalidated successfully for /api/services",
  "revalidated": true,
  "path": "/api/services",
  "revalidated_by": "Admin Name",
  "timestamp": "2025-09-03T..."
}
```

### POST /api/revalidate
**Manual cache revalidation via POST request (ADMIN ONLY)**

**Headers:**
- `Authorization: Bearer <admin_token>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "path": "/api/services"
}
```

**Response:** Same as GET version

## Automatic Revalidation

The cache is **automatically revalidated** when data changes:

✅ **Create service** (`POST /api/services`) → Cache revalidated  
✅ **Update service** (`PUT /api/services/[id]`) → Cache revalidated  
✅ **Delete service** (`DELETE /api/services/[id]`) → Cache revalidated  

## Usage Examples

### 1. **Admin Dashboard Integration**
```javascript
// After creating/updating a service in admin panel
async function refreshServicesCache(adminToken) {
  const response = await fetch('/api/revalidate?path=/api/services', {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  const result = await response.json();
  console.log('Cache refreshed:', result.message);
}
```

### 2. **Manual Refresh Button**
```javascript
// Add a "Refresh Data" button in admin dashboard
const handleRefresh = async () => {
  setLoading(true);
  await fetch('/api/revalidate?path=/api/services', {
    headers: {
      'Authorization': `Bearer ${getAdminToken()}`
    }
  });
  // Refetch your data
  await refetchServices();
  setLoading(false);
};
```

### 3. **Admin Tools Integration**
```bash
# From admin tools/scripts with admin token
curl -H "Authorization: Bearer admin-jwt-token-here" \
  "https://barber-api-three.vercel.app/api/revalidate?path=/api/services"
```

### 4. **Multiple Path Revalidation**
```bash
# Revalidate multiple endpoints (admin auth required for each)
curl -H "Authorization: Bearer admin-token" \
  "https://barber-api-three.vercel.app/api/revalidate?path=/api/services"
curl -H "Authorization: Bearer admin-token" \
  "https://barber-api-three.vercel.app/api/revalidate?path=/api/barbers"
```

## Security

✅ **Admin Authentication Required** - Only users with admin role can revalidate cache  
✅ **JWT Token Validation** - Uses your existing authentication system  
✅ **Role-Based Access** - Leverages the same `requireAdmin()` function  
✅ **Audit Trail** - Logs which admin triggered the revalidation  

No additional environment variables needed - uses your existing auth system!

## Testing Cache Behavior

```bash
# 1. Check current cache status
curl -D headers.txt "https://barber-api-three.vercel.app/api/services"
grep "X-Vercel-Cache" headers.txt  # Should show HIT

# 2. Revalidate cache (admin token required)
curl -H "Authorization: Bearer your-admin-token" \
  "https://barber-api-three.vercel.app/api/revalidate?path=/api/services"

# 3. Check cache status again
curl -D headers2.txt "https://barber-api-three.vercel.app/api/services"
grep "X-Vercel-Cache" headers2.txt  # Should show MISS (fresh data)

# 4. Subsequent requests should be cached again
curl -D headers3.txt "https://barber-api-three.vercel.app/api/services"
grep "X-Vercel-Cache" headers3.txt  # Should show HIT
```

## Benefits

✅ **Keep cache optimization** - Services API stays cached for 24 hours  
✅ **On-demand fresh data** - Get new data when you need it  
✅ **No query parameter complexity** - Doesn't make routes dynamic  
✅ **Automatic revalidation** - Changes trigger cache refresh automatically  
✅ **Manual control** - Admin/webhook triggered refresh when needed  

This approach gives you the best of both worlds: excellent cache performance with the ability to get fresh data on demand! 🚀
