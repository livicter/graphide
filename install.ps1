# Graphide Windows helper. Prefer install.cmd (cmd.exe, no PowerShell parser).
# This file is ASCII-only so Windows PowerShell 5.1 can parse it.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host "Graphide install (Windows) via install.cmd"
$cmd = Join-Path $PSScriptRoot "install.cmd"
if (-not (Test-Path $cmd)) { throw "install.cmd missing" }
& cmd.exe /c "`"$cmd`""
if ($LASTEXITCODE -ne 0) { throw "install.cmd failed" }
