Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "LeadFlow Pro Configuration Test" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Helper to check API status and config
function Get-Apidata {
    param($Url)
    try {
        return Invoke-RestMethod -Uri $Url -Method Get
    } catch {
        return $null
    }
}

Write-Host "1. Supabase Connection..." -ForegroundColor Yellow
$health = Get-Apidata "http://localhost:3000/api/health"
if ($health) {
    Write-Host "Status: $($health.status)"
    Write-Host "Database: $($health.services.database.status)"
} else {
    Write-Host "Error: Could not reach /api/health" -ForegroundColor Red
}
Write-Host ""

Write-Host "2. Twilio Configuration..." -ForegroundColor Yellow
$voice = Get-Apidata "http://localhost:3000/api/voice"
if ($voice) {
    $twilio = $voice.config.twilio
    Write-Host "Account SID: $($twilio.accountSid)"
    Write-Host "Phone Number: $($twilio.phoneNumber)"
    Write-Host "Status: $($twilio.status)"
} else {
    Write-Host "Error: Could not reach /api/voice" -ForegroundColor Red
}
Write-Host ""

Write-Host "3. ElevenLabs Configuration..." -ForegroundColor Yellow
if ($voice) {
    $eleven = $voice.config.elevenlabs
    Write-Host "Voice ID: $($eleven.voiceId)"
    Write-Host "API Key Present: $($eleven.hasApiKey)"
    Write-Host "Status: $($eleven.status)"
} else {
    Write-Host "Error: /api/voice data missing" -ForegroundColor Red
}
Write-Host ""

Write-Host "4. Environment Variables (Local Check)..." -ForegroundColor Yellow
$sid = $env:TWILIO_ACCOUNT_SID
$key = $env:ELEVENLABS_API_KEY

if ($sid) { Write-Host "TWILIO_ACCOUNT_SID: $($sid.Substring(0,10))..." } else { Write-Host "TWILIO_ACCOUNT_SID: MISSING" -ForegroundColor Red }
if ($key) { Write-Host "ELEVENLABS_API_KEY: $($key.Substring(0,10))..." } else { Write-Host "ELEVENLABS_API_KEY: MISSING" -ForegroundColor Red }
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
