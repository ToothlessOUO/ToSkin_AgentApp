@echo off
setlocal
rem ZONE skin for ZCode - rollback. Restores the official app.asar from the
rem backup taken by apply.cmd (tools\out\app.asar.zone-bak).

set HERE=%~dp0
set BACKUP=%HERE%out\app.asar.zone-bak
if "%ZCODE_RESOURCES%"=="" (set TARGET=C:\Program Files\ZCode\resources) else (set TARGET=%ZCODE_RESOURCES%)
set ORIG=%TARGET%\app.asar

net session >nul 2>&1
if errorlevel 1 (
  echo Requesting administrator privileges ...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

if not exist "%BACKUP%" (
  echo [FAIL] %BACKUP% not found - nothing to restore from. Reinstall ZCode instead.
  exit /b 1
)
if not exist "%ORIG%" (
  echo [FAIL] %ORIG% not found. Set ZCODE_RESOURCES to the resources directory.
  exit /b 1
)

copy /y "%BACKUP%" "%ORIG%" >nul || (echo [FAIL] restore copy failed & exit /b 1)
echo [ok] official package restored to %ORIG%
echo      Fully quit ZCode (tray icon - right-click - quit), then start it again.
pause
