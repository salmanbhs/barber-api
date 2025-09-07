$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNzVjYzlmNTUtMGU5Yy00NjMzLTg0Y2EtYjUwM2I0MDkyMjE5Iiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzM2ODc1Mjk5LCJleHAiOjE3MzY4Nzg4OTl9.LzSKNvW6BqOZ8G_gOd1sOZSBMnYpPjHfm6_B8Rqh7Xc'
}
$body = @{
    barber_id = "75cc9f55-0e9c-4633-84ca-b503b4092219"
    service_id = "7dbb7025-edf7-4cbf-b1d6-eb70d1d8569c"
    appointment_date = "2025-09-10"
    appointment_time = "11:00"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/bookings" -Method POST -Headers $headers -Body $body
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
