# start.ps1
$PORT = 8081

Write-Host "Checking port $PORT..." -ForegroundColor Cyan

$pids = (netstat -ano | findstr ":$PORT") -split '\s+' | Where-Object { $_ -match '^\d+$' } | Select-Object -Unique

foreach ($p in $pids) {
    if ($p -and $p -ne "0") {
        Write-Host "Killing PID $p on port $PORT..." -ForegroundColor Yellow
        taskkill /PID $p /F 2>$null
    }
}

Start-Sleep -Seconds 1
Write-Host "Starting Metro on port $PORT..." -ForegroundColor Green
npx react-native start --reset-cache