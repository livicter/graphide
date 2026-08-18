@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

echo == unit tests ==
cargo test --workspace --all-targets
if errorlevel 1 exit /b 1

echo == pilot: review demo ==
cargo run -q -- review --root fixtures/demo --json > "%TEMP%\graphide_pilot_review.json" 2>nul
if errorlevel 1 (
  echo review failed
  exit /b 1
)

python "%~dp0pilot_check.py" review "%TEMP%\graphide_pilot_review.json"
if errorlevel 1 exit /b 1

for /f "usebackq delims=" %%A in (`python "%~dp0pilot_check.py" bubble "%TEMP%\graphide_pilot_review.json"`) do set BUBBLE=%%A
if "%BUBBLE%"=="" (
  echo could not read bubble id
  exit /b 1
)

echo == pilot: enter first run bubble ==
cargo run -q -- enter --root fixtures/demo --flow data-subscription --bubble %BUBBLE% > "%TEMP%\graphide_pilot_enter.json" 2>nul
if errorlevel 1 (
  echo enter failed
  exit /b 1
)

python "%~dp0pilot_check.py" enter "%TEMP%\graphide_pilot_enter.json"
if errorlevel 1 exit /b 1

echo == pilot: extract smoke ==
cargo run -q -- extract --file fixtures/demo/src/bus.rs --repo-root fixtures/demo >nul 2>nul
if errorlevel 1 (
  echo extract failed
  exit /b 1
)

python "%~dp0pilot_check.py" summary "%TEMP%\graphide_pilot_review.json" "%TEMP%\graphide_pilot_enter.json"
exit /b 0
