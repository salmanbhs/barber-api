Write-Host "Checking existing bookings for John Smith on 2025-09-10..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/bookings?barber_id=75cc9f55-0e9c-4633-84ca-b503b4092219&date=2025-09-10" -Method GET -ErrorAction Stop
    $result = $response.Content | ConvertFrom-Json
    Write-Host "Found $($result.count) booking(s):"
    foreach ($booking in $result.data) {
        Write-Host "- $($booking.appointment_time) to $($booking.appointment_time + ':' + $booking.service_duration) mins ($($booking.customer_name)) - Status: $($booking.status)"
    }
} catch {
    Write-Host "Error checking bookings: $($_.Exception.Response.StatusCode)"
}
