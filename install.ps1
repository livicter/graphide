$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Need($name, $hint) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing $name. $hint"
  }
}

Need "cargo" "Install Rust from https://rustup.rs and reopen this window."
Need "node" "Install Node.js from https://nodejs.org and reopen this window."

Write-Host "Building graphide CLI (release)..."
cargo build -p graphide-cli --release
if ($LASTEXITCODE -ne 0) { throw "cargo build failed" }

$exe = Join-Path $PSScriptRoot "target\release\graphide.exe"
if (-not (Test-Path $exe)) { throw "Expected $exe" }

$extBin = Join-Path $PSScriptRoot "extension\bin"
$HOMEBin = Join-Path $env:USERPROFILE ".graphide"
New-Item -ItemType Directory -Force -Path $extBin | Out-Null
New-Item -ItemType Directory -Force -Path $HOMEBin | Out-Null
Copy-Item $exe (Join-Path $extBin "graphide.exe") -Force
Copy-Item $exe (Join-Path $HOMEBin "graphide.exe") -Force
Write-Host "CLI copied to $HOMEBin\graphide.exe"

Set-Location (Join-Path $PSScriptRoot "extension")
if (-not (Test-Path "node_modules")) {
  Write-Host "Installing extension dependencies..."
  npm install
  if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
}
Write-Host "Packaging VSIX..."
npm run compile
if ($LASTEXITCODE -ne 0) { throw "extension compile failed" }
npx --yes @vscode/vsce package --no-dependencies --allow-missing-repository
if ($LASTEXITCODE -ne 0) { throw "vsce package failed" }

$vsix = Join-Path (Get-Location) "graphide-0.1.0.vsix"
if (-not (Test-Path $vsix)) { throw "VSIX not written" }

$installed = $false
foreach ($ed in @("cursor", "code")) {
  if (Get-Command $ed -ErrorAction SilentlyContinue) {
    Write-Host "Installing into $ed..."
    & $ed --install-extension $vsix --force
    if ($LASTEXITCODE -eq 0) { $installed = $true }
  }
}

if (-not $installed) {
  Write-Host "VSIX is ready: $vsix"
  Write-Host "In the editor: Extensions → … → Install from VSIX…"
} else {
  Write-Host "Installed. Reload the editor window."
}
