param(
    [string]$ApplicationDirectory = (Resolve-Path (Join-Path $PSScriptRoot "..\.."))
)

$ErrorActionPreference = "Stop"
$application = [System.IO.Path]::GetFullPath($ApplicationDirectory)
$python = Join-Path $application "venv\Scripts\python.exe"
$lockFile = Join-Path $application "tmp\database-backup.lock"
$lock = $null

if (-not (Test-Path -LiteralPath $python)) {
    throw "Python virtual environment not found: $python"
}

New-Item -ItemType Directory -Path (Split-Path $lockFile) -Force | Out-Null

try {
    $lock = [System.IO.File]::Open(
        $lockFile,
        [System.IO.FileMode]::CreateNew,
        [System.IO.FileAccess]::Write,
        [System.IO.FileShare]::None
    )
    Set-Location $application
    & $python manage.py backup_databases
    if ($LASTEXITCODE -ne 0) {
        throw "Database backup failed with exit code $LASTEXITCODE"
    }
} finally {
    if ($null -ne $lock) {
        $lock.Dispose()
        Remove-Item -LiteralPath $lockFile -Force -ErrorAction SilentlyContinue
    }
}
