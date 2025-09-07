Write-Host "Checking company configuration..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/booking/test-wednesday" -Method GET -ErrorAction Stop
    $result = $response.Content | ConvertFrom-Json
    Write-Host "Working hours for Wednesday:"
    $result.data.day_schedule | ConvertTo-Json -Depth 5
    Write-Host ""
    Write-Host "All working hours:"
    $result.data.all_working_hours | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $($_.Exception.Response.StatusCode)"
}
