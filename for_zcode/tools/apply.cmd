@echo off
setlocal
rem ZONE skin for ZCode - install (admin). Copies tools\out\app.asar.zone over
rem the official resources\app.asar, backing the official package up once to
rem tools\out\app.asar.zone-bak. Run build.js first. Rollback: restore.cmd.
rem After apply: fully quit ZCode (tray right-click -> quit) and start again.

set HERE=%~dp0
set BUILT=%HERE%out\app.asar.zone
set BACKUP=%HERE%out\app.asar.zone-bak
if "%ZCODE_RESOURCES%"=="" (set TARGET=C:\Program Files\ZCode\resources) else (set TARGET=%ZCODE_RESOURCES%)
set ORIG=%TARGET%\app.asar

if not exist "%BUILT%" (
  echo [FAIL] %BUILT% not found. Run: cd tools ^&^& npm install ^&^& node build.js
  exit /b 1
)

net session >nul 2>&1
if errorlevel 1 (
  echo Requesting administrator privileges ...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

if not exist "%ORIG%" (
  echo [FAIL] %ORIG% not found. Set ZCODE_RESOURCES to the resources directory.
  exit /b 1
)

if exist "%BACKUP%" (
  echo [info] backup already exists, keeping the first one: %BACKUP%
) else (
  copy /y "%ORIG%" "%BACKUP%" >nul || (echo [FAIL] backup copy failed & exit /b 1)
  echo [ok] official package backed up to %BACKUP%
)

copy /y "%BUILT%" "%ORIG%" >nul || (echo [FAIL] install copy failed & exit /b 1)
echo [ok] ZONE skin installed to %ORIG%
echo      Fully quit ZCode (tray icon - right-click - quit), then start it again.
pause
