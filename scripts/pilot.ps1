# Prefer: .\scripts\pilot.cmd  (no execution-policy fight)
# Or: powershell -ExecutionPolicy Bypass -File .\scripts\pilot.ps1
& "$PSScriptRoot\pilot.cmd"
exit $LASTEXITCODE
