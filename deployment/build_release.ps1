$ErrorActionPreference = "Stop"

$config = Get-Content ".\deployment.dev.json" | ConvertFrom-Json

$project = $config.ProjectDir
$release = $config.ReleaseDir
$versionFile = $config.VersionFile

Write-Host "=== BUILD RELEASE ===" -ForegroundColor Cyan

if (Test-Path $release) {
    Remove-Item $release -Recurse -Force
}

New-Item -ItemType Directory -Path $release | Out-Null

Write-Host "[1/5] Frontend build" -ForegroundColor Cyan
Set-Location "$project\frontend"
npm run build
if ($LASTEXITCODE -ne 0) {
    throw "npm run build failed"
}

Write-Host "[2/5] Copy backend" -ForegroundColor Cyan
Copy-Item "$project\backend" "$release\backend" -Recurse
Remove-Item "$release\backend\settings.py" -Force -ErrorAction SilentlyContinue
Copy-Item "$project\api" "$release\api" -Recurse

Write-Host "[3/5] Copy frontend dist" -ForegroundColor Cyan
New-Item -ItemType Directory -Path "$release\frontend" | Out-Null
Copy-Item "$project\frontend\dist" "$release\frontend\dist" -Recurse

Write-Host "[4/5] Copy root files" -ForegroundColor Cyan
Copy-Item "$project\manage.py" "$release\manage.py"

if (Test-Path "$project\runserver_prod.py") {
    Copy-Item "$project\runserver_prod.py" "$release\runserver_prod.py"
}

Write-Host "[5/5] Version" -ForegroundColor Cyan
$version = Get-Content $versionFile | ConvertFrom-Json

$buildDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

if ($version.PSObject.Properties.Name -contains "buildDate") {
    $version.buildDate = $buildDate
} else {
    $version | Add-Member -NotePropertyName "buildDate" -NotePropertyValue $buildDate
}

if ($version.PSObject.Properties.Name -notcontains "buildBy") {
    $version | Add-Member -NotePropertyName "buildBy" -NotePropertyValue $env:USERNAME
}

$version | ConvertTo-Json | Set-Content "$release\version.json" -Encoding UTF8

Write-Host "=== RELEASE READY ===" -ForegroundColor Green
Write-Host $release