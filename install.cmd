@echo off
setlocal
cd /d "%~dp0"
echo Graphide one-click install
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if errorlevel 1 (
  echo.
  echo Install failed.
  pause
  exit /b 1
)
echo.
echo Reload VS Code or Cursor, open the Graphide view, click Review.
pause
