$ErrorActionPreference = "Stop"

$config = Get-Content "$PSScriptRoot\deployment.dev.json" | ConvertFrom-Json

$project = [System.IO.Path]::GetFullPath($config.ProjectDir).TrimEnd('\')
$release = [System.IO.Path]::GetFullPath($config.ReleaseDir).TrimEnd('\')
$versionFile = $config.VersionFile

$driveRoot = [System.IO.Path]::GetPathRoot($release).TrimEnd('\')
if (
    $release -eq $driveRoot -or
    $release -eq $project -or
    $release.StartsWith("$project\", [System.StringComparison]::OrdinalIgnoreCase) -or
    $project.StartsWith("$release\", [System.StringComparison]::OrdinalIgnoreCase)
) {
    throw "Unsafe release directory: $release"
}

Write-Host "=== BUILD RELEASE ===" -ForegroundColor Cyan

if (Test-Path $release) {
    Remove-Item $release -Recurse -Force
}

New-Item -ItemType Directory -Path $release | Out-Null

Write-Host "[1/6] Frontend build" -ForegroundColor Cyan
Set-Location "$project\frontend"
npm run build
if ($LASTEXITCODE -ne 0) {
    throw "npm run build failed"
}

Write-Host "[2/6] Copy backend" -ForegroundColor Cyan
Copy-Item "$project\backend" "$release\backend" -Recurse
Copy-Item "$project\api" "$release\api" -Recurse
Copy-Item "$project\organizations" "$release\organizations" -Recurse

Write-Host "[3/6] Copy frontend dist" -ForegroundColor Cyan
New-Item -ItemType Directory -Path "$release\frontend" | Out-Null
Copy-Item "$project\frontend\dist" "$release\frontend\dist" -Recurse

Write-Host "[4/6] Copy root files" -ForegroundColor Cyan
Copy-Item "$project\manage.py" "$release\manage.py"
Copy-Item "$project\.env.example" "$release\.env.example"
Copy-Item "$project\deployment\server\passenger_wsgi.py" "$release\passenger_wsgi.py"
Copy-Item "$project\deployment\server\.htaccess.example" "$release\.htaccess.example"
Copy-Item "$project\deployment\server\README.md" "$release\DEPLOYMENT.md"
Copy-Item "$project\deployment\server\requirements.txt" "$release\requirements.txt"

if (Test-Path "$project\runserver_prod.py") {
    Copy-Item "$project\runserver_prod.py" "$release\runserver_prod.py"
}

Write-Host "[5/6] Remove development caches" -ForegroundColor Cyan
Get-ChildItem $release -Directory -Recurse -Filter "__pycache__" |
    Remove-Item -Recurse -Force
Get-ChildItem $release -File -Recurse -Filter "*.pyc" |
    Remove-Item -Force

Write-Host "[6/6] Version" -ForegroundColor Cyan
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
