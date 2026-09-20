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

Write-Host "[1/7] Frontend build" -ForegroundColor Cyan
Set-Location "$project\frontend"
npm run build
if ($LASTEXITCODE -ne 0) {
    throw "npm run build failed"
}

Write-Host "[2/7] Copy backend" -ForegroundColor Cyan
Copy-Item "$project\backend" "$release\backend" -Recurse
Copy-Item "$project\api" "$release\api" -Recurse
Copy-Item "$project\organizations" "$release\organizations" -Recurse

Write-Host "[3/7] Copy frontend dist" -ForegroundColor Cyan
New-Item -ItemType Directory -Path "$release\frontend" | Out-Null
Copy-Item "$project\frontend\dist" "$release\frontend\dist" -Recurse

Write-Host "[4/7] Copy root files" -ForegroundColor Cyan
Copy-Item "$project\manage.py" "$release\manage.py"
Copy-Item "$project\.env.example" "$release\.env.example"
Copy-Item "$project\deployment\server\passenger_wsgi.py" "$release\passenger_wsgi.py"
Copy-Item "$project\deployment\server\.htaccess.example" "$release\.htaccess.example"
Copy-Item "$project\deployment\server\README.md" "$release\DEPLOYMENT.md"
Copy-Item "$project\deployment\server\requirements.txt" "$release\requirements.txt"
Copy-Item "$project\docs\add-organization-beget.md" "$release\ADD_ORGANIZATION.md"
Copy-Item "$project\docs\deployment-modes.md" "$release\DEPLOYMENT_MODES.md"
Copy-Item "$project\docs\database-backups.md" "$release\DATABASE_BACKUPS.md"

New-Item -ItemType Directory -Path "$release\config" | Out-Null
Copy-Item "$project\deployment\config\*.example" "$release\config"

New-Item -ItemType Directory -Path "$release\deployment\local" -Force | Out-Null
Copy-Item "$project\deployment\local\*" "$release\deployment\local" -Recurse

New-Item -ItemType Directory -Path "$release\deployment\server" -Force | Out-Null
Copy-Item "$project\deployment\server\*.sh" "$release\deployment\server"

$userGuide = Get-ChildItem "$project\docs\user-guide" -File -Filter "*.pdf" |
    Select-Object -First 1
if (-not $userGuide) {
    throw "User guide PDF not found"
}
Copy-Item $userGuide.FullName "$release\USER_GUIDE.pdf"

if (Test-Path "$project\runserver_prod.py") {
    Copy-Item "$project\runserver_prod.py" "$release\runserver_prod.py"
}

Write-Host "[5/7] Remove development caches" -ForegroundColor Cyan
Get-ChildItem $release -Directory -Recurse -Filter "__pycache__" |
    Remove-Item -Recurse -Force
Get-ChildItem $release -File -Recurse -Filter "*.pyc" |
    Remove-Item -Force

Write-Host "[6/7] Version" -ForegroundColor Cyan
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

Write-Host "[7/7] Verify deployment profiles" -ForegroundColor Cyan
$requiredReleaseFiles = @(
    "config\local.env.example",
    "config\hosting.env.example",
    "deployment\local\start.ps1",
    "deployment\local\update.ps1",
    "deployment\local\backup.ps1",
    "deployment\server\update.sh",
    "deployment\server\backup.sh",
    "DATABASE_BACKUPS.md",
    "requirements.txt",
    "USER_GUIDE.pdf"
)
foreach ($relativePath in $requiredReleaseFiles) {
    if (-not (Test-Path (Join-Path $release $relativePath))) {
        throw "Release file missing: $relativePath"
    }
}

Write-Host "=== RELEASE READY ===" -ForegroundColor Green
Write-Host $release
