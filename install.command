#!/bin/bash
# Double-click in Finder (macOS).
cd "$(dirname "$0")" || exit 1
exec /bin/bash "./install.sh"
