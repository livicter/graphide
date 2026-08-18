@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo Graphide one-click install (Windows)
echo.

REM Do not call install.ps1. Windows PowerShell 5.1 misparses UTF-8 scripts
REM without a BOM and fails before any build work starts.

set "PATH=%USERPROFILE%\.cargo\bin;%USERPROFILE%\.volta\bin;%ProgramFiles%\nodejs;%ProgramFiles(x86)%\nodejs;%LOCALAPPDATA%\fnm;%APPDATA%\nvm;%LOCALAPPDATA%\Programs\Microsoft VS Code\bin;%ProgramFiles%\Microsoft VS Code\bin;%LOCALAPPDATA%\Programs\cursor\resources\app\bin;%LOCALAPPDATA%\Programs\Cursor\resources\app\bin;%PATH%"

where cargo >nul 2>nul
if errorlevel 1 (
  echo Missing cargo. Install Rust from https://rustup.rs and reopen this window.
  goto :fail
)
where rustc >nul 2>nul
if errorlevel 1 (
  echo Missing rustc. Install Rust from https://rustup.rs and reopen this window.
  goto :fail
)
where node >nul 2>nul
if errorlevel 1 (
  echo Missing node. Install Node.js from https://nodejs.org and reopen this window.
  goto :fail
)
where npm >nul 2>nul
if errorlevel 1 (
  echo Missing npm. Install Node.js from https://nodejs.org and reopen this window.
  goto :fail
)

echo Building graphide CLI ^(release^)...
cargo build -p graphide-cli --release
if errorlevel 1 goto :fail

if not exist "target\release\graphide.exe" (
  echo Expected target\release\graphide.exe
  goto :fail
)

if not exist "extension\bin" mkdir "extension\bin"
if not exist "%USERPROFILE%\.graphide" mkdir "%USERPROFILE%\.graphide"
copy /Y "target\release\graphide.exe" "extension\bin\graphide.exe" >nul
copy /Y "target\release\graphide.exe" "%USERPROFILE%\.graphide\graphide.exe" >nul
echo CLI copied to %USERPROFILE%\.graphide\graphide.exe

pushd extension
if not exist node_modules (
  echo Installing extension dependencies...
  call npm install
  if errorlevel 1 (
    popd
    goto :fail
  )
)
echo Packaging VSIX...
call npm run compile
if errorlevel 1 (
  popd
  goto :fail
)
call npx --yes @vscode/vsce package --no-dependencies --allow-missing-repository
if errorlevel 1 (
  popd
  goto :fail
)

set "VSIX="
for /f "delims=" %%F in ('dir /b /a:-d /o:-d graphide-*.vsix 2^>nul') do (
  set "VSIX=%CD%\%%F"
  goto :gotvsix
)
:gotvsix
if not defined VSIX (
  echo VSIX not written
  popd
  goto :fail
)

set "INSTALLED=0"
call :install_ed cursor
call :install_ed code
popd

if "%INSTALLED%"=="0" (
  echo VSIX is ready: %VSIX%
  echo In the editor: Extensions ^> ... ^> Install from VSIX...
) else (
  echo Installed. Reload the editor window, open the Graphide view, click Review.
)
echo.
pause
exit /b 0

:install_ed
set "ED=%~1"
where %ED% >nul 2>nul
if not errorlevel 1 (
  echo Installing into %ED%...
  call %ED% --install-extension "%VSIX%" --force
  if not errorlevel 1 set "INSTALLED=1"
)
if exist "%LOCALAPPDATA%\Programs\%ED%\resources\app\bin\%ED%.cmd" (
  echo Installing into %LOCALAPPDATA%\Programs\%ED%...
  call "%LOCALAPPDATA%\Programs\%ED%\resources\app\bin\%ED%.cmd" --install-extension "%VSIX%" --force
  if not errorlevel 1 set "INSTALLED=1"
)
if exist "%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\%ED%.cmd" (
  echo Installing into VS Code...
  call "%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\%ED%.cmd" --install-extension "%VSIX%" --force
  if not errorlevel 1 set "INSTALLED=1"
)
if exist "%ProgramFiles%\Microsoft VS Code\bin\%ED%.cmd" (
  echo Installing into VS Code...
  call "%ProgramFiles%\Microsoft VS Code\bin\%ED%.cmd" --install-extension "%VSIX%" --force
  if not errorlevel 1 set "INSTALLED=1"
)
goto :eof

:fail
echo.
echo Install failed.
pause
exit /b 1
