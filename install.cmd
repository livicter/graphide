@echo off
setlocal
cd /d "%~dp0"
echo Graphide one-click install (Windows)
echo.

where powershell >nul 2>nul
if %ERRORLEVEL%==0 (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
  goto :after
)
where pwsh >nul 2>nul
if %ERRORLEVEL%==0 (
  pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
  goto :after
)
echo ERROR: PowerShell not found. Install Windows PowerShell or PowerShell 7.
pause
exit /b 1

:after
if errorlevel 1 (
  echo.
  echo Install failed.
  pause
  exit /b 1
)
echo.
echo Reload VS Code or Cursor, open the Graphide view, click Review.
pause
