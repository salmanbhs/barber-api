# Company Configuration System

This document explains how to use the company configuration system for the barber API. The system allows you to manage company settings, working hours, theme colors, and business configurations.

## 🎯 Key Features for Your Business

### Simplified Business Configuration
- **Booking Advance**: 1 hour minimum advance booking (not days)
- **No Cancellation Policy**: Cancellation restrictions removed
- **No Tax/Deposit**: Tax rates and deposit settings removed for simplicity
- **Currency**: BHD (Bahraini Dinar) as default currency
- **Time Slots**: Flexible 15, 30, or 60-minute intervals

## Database Setup

Run the SQL file to create the company configuration table:

```sql
-- Run this in Supabase SQL Editor
-- File: database/add-company-config-table.sql
```

## API Endpoints

### 1. Company Configuration Management

#### Get Company Configuration
```
GET /api/company/config
```

Returns the complete company configuration including:
- Company details (name, description, contact info)
- Working hours
- Theme colors
- Business settings
- Notification settings

#### Update Company Configuration
```
PUT /api/company/config
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "company_name": "My Barber Shop",
  "company_description": "Professional barber services",
  "company_phone": "+1-555-0123",
  "company_email": "info@mybarbershop.com",
  "primary_color": "#2563eb",
  "booking_advance_hours": 2,
  "currency": "BHD"
}
```

### 2. Working Hours Management

#### Get Working Hours
```
GET /api/company/working-hours
```

#### Update Working Hours
```
PUT /api/company/working-hours
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "working_hours": {
    "monday": {
      "isOpen": true,
      "shifts": [
        {"start": "09:00", "end": "12:00"},
        {"start": "16:00", "end": "20:00"}
      ]
    },
    "tuesday": {
      "isOpen": true,
      "shifts": [
        {"start": "09:00", "end": "12:00"},
        {"start": "16:00", "end": "20:00"}
      ]
    },
    "wednesday": {
      "isOpen": true,
      "shifts": [
        {"start": "09:00", "end": "12:00"},
        {"start": "16:00", "end": "20:00"}
      ]
    },
    "thursday": {
      "isOpen": true,
      "shifts": [
        {"start": "09:00", "end": "12:00"},
        {"start": "16:00", "end": "20:00"}
      ]
    },
    "friday": {
      "isOpen": true,
      "shifts": [
        {"start": "09:00", "end": "12:00"},
        {"start": "16:00", "end": "20:00"}
      ]
    },
    "saturday": {
      "isOpen": true,
      "shifts": [
        {"start": "09:00", "end": "18:00"}
      ]
    },
    "sunday": {
      "isOpen": false,
      "shifts": []
    }
  }
}
```

### 3. Theme Management

#### Get Theme Colors
```
GET /api/company/theme
```

#### Update Theme Colors
```
PUT /api/company/theme
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "primary_color": "#2563eb",
  "secondary_color": "#64748b",
  "accent_color": "#f59e0b",
  "background_color": "#ffffff",
  "text_color": "#1f2937"
}
```

### 4. Shop Status

#### Check if Shop is Open
```
GET /api/company/status
GET /api/company/status?date=2025-09-07T10:30:00.000Z
```

Returns whether the shop is currently open or open at a specific date/time.

### 5. Maintenance Mode

#### Get Maintenance Status
```
GET /api/company/maintenance
```

#### Set Maintenance Mode
```
PUT /api/company/maintenance
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "maintenance_mode": true,
  "maintenance_message": "We are currently updating our systems. Please check back in 30 minutes."
}
```

### 6. Holiday Management

#### Get Holidays
```
GET /api/company/holidays
```

#### Add Holiday
```
POST /api/company/holidays
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "date": "2025-12-25",
  "name": "Christmas Day",
  "isRecurring": true,
  "customHours": []
}
```

#### Remove Holiday
```
DELETE /api/company/holidays?date=2025-12-25
Authorization: Bearer <admin_token>
```

### 7. Booking Availability

#### Check Booking Availability
```
GET /api/booking/availability?datetime=2025-09-07T15:30:00.000Z
```

Returns whether a booking can be made at a specific date/time, considering:
- Minimum advance hours requirement (1 hour default)
- Shop opening hours
- Holiday schedule

Response example:
```json
{
  "success": true,
  "data": {
    "can_book": true,
    "is_shop_open": true,
    "booking_datetime": "2025-09-07T15:30:00.000Z",
    "hours_until_booking": 5.5,
    "min_advance_hours": 1,
    "meets_advance_requirement": true,
    "currency": "BHD"
  }
}
```

### Company Information
- `company_name`: Name of the business
- `company_description`: Business description
- `company_logo_url`: URL to company logo
- `company_phone`: Contact phone number
- `company_email`: Contact email
- `company_address`: Physical address
- `company_website`: Website URL

### Working Hours
- Stored as JSON with support for multiple shifts per day
- Each day can be open/closed
- Supports break times (e.g., 9-12, then 16-20)

### Theme Colors
- `primary_color`: Main brand color
- `secondary_color`: Secondary UI color
- `accent_color`: Accent/highlight color
- `background_color`: Background color
- `text_color`: Main text color
- All colors must be in hex format (#RRGGBB)

### Business Settings
- `booking_advance_hours`: How many hours in advance bookings are allowed (default: 1 hour)
- `default_service_duration`: Default service duration in minutes
- `time_slot_interval`: Time slot intervals (15, 30, or 60 minutes)
- `max_daily_bookings`: Maximum bookings per day
- `currency`: Currency code (default: BHD - Bahraini Dinar)

### Notification Settings
- `sms_notifications`: Enable/disable SMS notifications
- `email_notifications`: Enable/disable email notifications
- `reminder_hours_before`: Hours before appointment to send reminders

### Social Media
- `social_media`: Object containing social media URLs
  - `facebook`
  - `instagram`
  - `twitter`
  - `whatsapp`
  - `google_business`

## Usage Examples

### Frontend Integration

```javascript
// Get company configuration
const response = await fetch('/api/company/config');
const { data: config } = await response.json();

// Apply theme colors
document.documentElement.style.setProperty('--primary-color', config.primary_color);
document.documentElement.style.setProperty('--secondary-color', config.secondary_color);

// Check if shop is open
const statusResponse = await fetch('/api/company/status');
const { data: status } = await statusResponse.json();
if (!status.is_open) {
  showClosedMessage();
}

// Update working hours (admin only)
const updateResponse = await fetch('/api/company/working-hours', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    working_hours: newWorkingHours
  })
});
```

### Mobile App Integration

```javascript
// Get theme for mobile app styling
const themeResponse = await fetch('/api/company/theme');
const { data: theme } = await themeResponse.json();

// Apply colors to mobile app theme
const appTheme = {
  colors: {
    primary: theme.primary_color,
    secondary: theme.secondary_color,
    accent: theme.accent_color,
    background: theme.background_color,
    text: theme.text_color
  }
};
```

## Database Functions

The system includes several database functions:

- `get_company_config()`: Returns the active company configuration
- `is_shop_open(check_datetime)`: Checks if shop is open at specific time
- `update_company_config_updated_at()`: Trigger to update timestamp

## Security

- Row Level Security (RLS) is enabled
- Public read access for basic configuration
- Admin-only write access for modifications
- All endpoints require proper authentication for modifications

## Best Practices

1. **Theme Colors**: Use consistent color schemes that work well together
2. **Working Hours**: Consider break times and realistic operating hours
3. **Holidays**: Keep holiday list updated for accurate availability
4. **Maintenance Mode**: Use for planned downtime and system updates
5. **Booking Settings**: Set realistic advance booking and cancellation policies
