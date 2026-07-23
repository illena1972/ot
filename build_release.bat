@echo off
setlocal

set PROJECT_DIR=F:\app\ot
set RELEASE_DIR=F:\app\ot_release

echo === CLEAN RELEASE ===
rmdir /s /q "%RELEASE_DIR%" 2>nul
mkdir "%RELEASE_DIR%"

echo === FRONTEND BUILD ===
cd /d "%PROJECT_DIR%\frontend"
call npm run build
if errorlevel 1 goto error

echo === COPY BACKEND ===
xcopy "%PROJECT_DIR%\backend" "%RELEASE_DIR%\backend\" /E /I /Y /EXCLUDE:%PROJECT_DIR%\exclude_release.txt
xcopy "%PROJECT_DIR%\api" "%RELEASE_DIR%\api\" /E /I /Y /EXCLUDE:%PROJECT_DIR%\exclude_release.txt

echo === COPY FRONTEND DIST ===
xcopy "%PROJECT_DIR%\frontend\dist" "%RELEASE_DIR%\frontend\dist\" /E /I /Y

echo === COPY ROOT FILES ===

if exist "%PROJECT_DIR%\manage.py" (
  copy "%PROJECT_DIR%\manage.py" "%RELEASE_DIR%\" /Y
) else (
  echo WARNING: manage.py not found
)

if exist "%PROJECT_DIR%\runserver_prod.py" (
  copy "%PROJECT_DIR%\runserver_prod.py" "%RELEASE_DIR%\" /Y
) else (
  echo WARNING: runserver_prod.py not found, skipped
)

if exist "%PROJECT_DIR%\backend\requirements.txt" (
  copy "%PROJECT_DIR%\backend\requirements.txt" "%RELEASE_DIR%\backend\" /Y
) else (
  echo WARNING: backend requirements.txt not found, skipped
)

echo === RELEASE READY ===
echo %RELEASE_DIR%
goto end

:error
echo RELEASE BUILD FAILED
pause
exit /b 1

:end
pause