param(
    [string]$ApplicationDirectory = (Resolve-Path (Join-Path $PSScriptRoot "..\.."))
)

$ErrorActionPreference = "Stop"
$application = [System.IO.Path]::GetFullPath($ApplicationDirectory)
$python = Join-Path $application "venv\Scripts\python.exe"
$envFile = Join-Path $application ".env"

if (-not (Test-Path -LiteralPath $python)) {
    throw "Python virtual environment not found: $python"
}
if (-not (Test-Path -LiteralPath $envFile)) {
    throw "Private configuration not found: $envFile"
}

Set-Location $application
& $python "runserver_prod.py"
if ($LASTEXITCODE -ne 0) {
    throw "Local server stopped with exit code $LASTEXITCODE"
}
