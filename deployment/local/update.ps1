param(
    [string]$ApplicationDirectory = (Resolve-Path (Join-Path $PSScriptRoot "..\.."))
)

$ErrorActionPreference = "Stop"
$application = [System.IO.Path]::GetFullPath($ApplicationDirectory)
$python = Join-Path $application "venv\Scripts\python.exe"
$requirements = Join-Path $application "requirements.txt"
$envFile = Join-Path $application ".env"

if (-not (Test-Path -LiteralPath $python)) {
    throw "Python virtual environment not found: $python"
}
if (-not (Test-Path -LiteralPath $requirements)) {
    throw "Requirements file not found: $requirements"
}
if (-not (Test-Path -LiteralPath $envFile)) {
    throw "Private configuration not found: $envFile"
}

Set-Location $application

Write-Host "[1/4] Installing Python dependencies" -ForegroundColor Cyan
& $python -m pip install -r $requirements
if ($LASTEXITCODE -ne 0) { throw "Dependency installation failed" }

Write-Host "[2/4] Checking configuration" -ForegroundColor Cyan
& $python manage.py check
if ($LASTEXITCODE -ne 0) { throw "Django configuration check failed" }

Write-Host "[3/4] Migrating all organization databases" -ForegroundColor Cyan
& $python manage.py migrate_all_organizations
if ($LASTEXITCODE -ne 0) { throw "Database migration failed" }

Write-Host "[4/4] Collecting static files" -ForegroundColor Cyan
& $python manage.py collectstatic --noinput
if ($LASTEXITCODE -ne 0) { throw "Static file collection failed" }

Write-Host "Update completed. Restart the local application service." -ForegroundColor Green
