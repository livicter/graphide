@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo Graphide CLI only (Windows)
echo This folder must be the Graphide repo (the one with crates\graphide-cli).
echo Do not run this from SolarSim or any other project.
echo.

set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"

if not exist "crates\graphide-cli\Cargo.toml" (
  echo ERROR: This is not the Graphide source repo.
  echo cd /d C:\Users\user\Documents\Git\graphide
  echo then run install-cli.cmd again.
  goto :fail
)

where cargo >nul 2>nul
if errorlevel 1 (
  echo Missing cargo. Install Rust from https://rustup.rs and reopen this window.
  goto :fail
)

echo Building graphide-cli ^(release^)...
cargo build -p graphide-cli --release
if errorlevel 1 goto :fail

if not exist "target\release\graphide.exe" (
  echo Expected target\release\graphide.exe
  goto :fail
)

if not exist "%USERPROFILE%\.graphide" mkdir "%USERPROFILE%\.graphide"
if not exist "extension\bin" mkdir "extension\bin"
copy /Y "target\release\graphide.exe" "%USERPROFILE%\.graphide\graphide.exe" >nul
copy /Y "target\release\graphide.exe" "extension\bin\graphide.exe" >nul
echo.
echo CLI is here:
echo   %USERPROFILE%\.graphide\graphide.exe
echo.
echo Reload the editor. Open SolarSim ^(or any repo^). Click Review.
echo If the old 0.1.0 extension still complains, set graphide.cliPath to that exe.
echo.
pause
exit /b 0

:fail
echo.
echo Install failed.
pause
exit /b 1
