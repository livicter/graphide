#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing $1. $2" >&2
    exit 1
  }
}

need cargo "Install Rust from https://rustup.rs"
need node "Install Node.js from https://nodejs.org"

echo "Building graphide CLI (release)..."
cargo build -p graphide-cli --release

bin_name="graphide"
src="target/release/${bin_name}"
[[ -x "$src" ]] || { echo "Expected $src" >&2; exit 1; }

mkdir -p extension/bin "$HOME/.graphide"
cp "$src" "extension/bin/${bin_name}"
cp "$src" "$HOME/.graphide/${bin_name}"
chmod +x "extension/bin/${bin_name}" "$HOME/.graphide/${bin_name}"
echo "CLI copied to $HOME/.graphide/${bin_name}"

cd extension
[[ -d node_modules ]] || npm install
npm run compile
npx --yes @vscode/vsce package --no-dependencies --allow-missing-repository
vsix="$PWD/graphide-0.1.0.vsix"

installed=0
for ed in cursor code; do
  if command -v "$ed" >/dev/null 2>&1; then
    echo "Installing into $ed..."
    "$ed" --install-extension "$vsix" --force && installed=1
  fi
done

if [[ "$installed" -eq 0 ]]; then
  echo "VSIX is ready: $vsix"
  echo "In the editor: Extensions → … → Install from VSIX…"
else
  echo "Installed. Reload the editor window."
fi
