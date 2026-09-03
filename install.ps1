# Graphide installer for Windows (PowerShell 5+ and pwsh).
# Usage:  powershell -ExecutionPolicy Bypass -File install.ps1
# Or double-click install.cmd
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host "Graphide install (Windows)"

function Add-PathDir([string]$dir) {
  if ($dir -and (Test-Path $dir)) {
    $env:Path = "$dir;" + $env:Path
  }
}

Add-PathDir "$env:USERPROFILE\.cargo\bin"
Add-PathDir "$env:USERPROFILE\.volta\bin"
Add-PathDir "C:\Program Files\nodejs"
Add-PathDir "C:\Program Files (x86)\nodejs"
Add-PathDir "$env:LOCALAPPDATA\fnm"
Add-PathDir "$env:APPDATA\nvm"
Add-PathDir "$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin"
Add-PathDir "$env:ProgramFiles\Microsoft VS Code\bin"
Add-PathDir "$env:LOCALAPPDATA\Programs\cursor\resources\app\bin"
Add-PathDir "$env:LOCALAPPDATA\Programs\Cursor\resources\app\bin"

function Need([string]$name, [string]$hint) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing $name. $hint"
  }
}

Need "cargo" "Install Rust from https://rustup.rs and reopen this window."
Need "rustc" "Install Rust from https://rustup.rs and reopen this window."
Need "node" "Install Node.js from https://nodejs.org and reopen this window."
Need "npm" "Install Node.js (includes npm) from https://nodejs.org and reopen this window."

Write-Host "Building graphide CLI (release)..."
& cargo build -p graphide-cli --release
if ($LASTEXITCODE -ne 0) { throw "cargo build failed" }

$exe = Join-Path $PSScriptRoot "target\release\graphide.exe"
if (-not (Test-Path $exe)) { throw "Expected $exe" }

$extBin = Join-Path $PSScriptRoot "extension\bin"
$homeBin = Join-Path $env:USERPROFILE ".graphide"
New-Item -ItemType Directory -Force -Path $extBin | Out-Null
New-Item -ItemType Directory -Force -Path $homeBin | Out-Null
Copy-Item $exe (Join-Path $extBin "graphide.exe") -Force
Copy-Item $exe (Join-Path $homeBin "graphide.exe") -Force
Write-Host "CLI copied to $homeBin\graphide.exe"
Write-Host "Checking language plugins..."
& (Join-Path $homeBin "graphide.exe") plugins --check
if ($LASTEXITCODE -ne 0) { throw "language plugin check failed" }

Write-Host "Packaging VSIX..."
& node (Join-Path $PSScriptRoot "scripts\package-graphide.js")
if ($LASTEXITCODE -ne 0) { throw "package failed" }

$vsix = Get-ChildItem -Path (Join-Path $PSScriptRoot "extension") -Filter "graphide-*.vsix" | Sort-Object LastWriteTime | Select-Object -Last 1
if (-not $vsix) { throw "VSIX not written" }

function Find-Editor([string]$name) {
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $guesses = if ($name -eq "cursor") {
    @(
      "$env:LOCALAPPDATA\Programs\cursor\resources\app\bin\cursor.cmd",
      "$env:LOCALAPPDATA\Programs\Cursor\resources\app\bin\cursor.cmd",
      "$env:ProgramFiles\cursor\resources\app\bin\cursor.cmd",
      "$env:ProgramFiles\Cursor\resources\app\bin\cursor.cmd"
    )
  } else {
    @(
      "$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin\code.cmd",
      "$env:ProgramFiles\Microsoft VS Code\bin\code.cmd"
    )
  }
  foreach ($g in $guesses) {
    if (Test-Path $g) { return $g }
  }
  return $null
}

$installed = $false
foreach ($name in @("cursor", "code")) {
  $ed = Find-Editor $name
  if (-not $ed) { continue }
  Write-Host "Installing into $ed..."
  & $ed --install-extension $vsix.FullName --force
  if ($LASTEXITCODE -eq 0) { $installed = $true }
}

if (-not $installed) {
  Write-Host "VSIX is ready: $($vsix.FullName)"
  Write-Host "In Cursor or VS Code: Extensions → … → Install from VSIX…"
} else {
  Write-Host "Installed. Reload Cursor or VS Code, open the Graphide view, click Review."
}
