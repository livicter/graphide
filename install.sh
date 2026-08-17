#!/usr/bin/env bash
# Graphide installer for macOS and Linux (Ubuntu and other glibc distros).
# Usage:  bash install.sh
# macOS:  double-click install.command
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$PWD"

say() { printf '%s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

os="$(uname -s 2>/dev/null || echo unknown)"
case "$os" in
  Darwin) os_name="macOS" ;;
  Linux) os_name="Linux" ;;
  *) os_name="$os" ;;
esac
say "Graphide install ($os_name)"

# GUI-launched terminals and editor-integrated terminals often miss these.
export PATH="$HOME/.cargo/bin:/opt/homebrew/bin:/opt/homebrew/opt/node/bin:/usr/local/bin:/usr/local/opt/node/bin:/snap/bin:$HOME/.local/bin:$HOME/.volta/bin:$PATH"

if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1091
  export NVM_DIR="$HOME/.nvm"
  . "$HOME/.nvm/nvm.sh"
fi
if [[ -s "$HOME/.asdf/asdf.sh" ]]; then
  # shellcheck disable=SC1091
  . "$HOME/.asdf/asdf.sh"
fi
if command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env --shell bash 2>/dev/null || fnm env 2>/dev/null || true)"
fi

need() {
  local bin="$1" hint="$2"
  command -v "$bin" >/dev/null 2>&1 || die "Missing $bin. $hint"
}

need cargo "Install Rust from https://rustup.rs then reopen this terminal."
need rustc "Install Rust from https://rustup.rs then reopen this terminal."
need node "Install Node.js from https://nodejs.org (Ubuntu: sudo apt install nodejs npm)."
need npm "Install npm (Ubuntu: sudo apt install npm)."

if ! command -v cc >/dev/null 2>&1 && ! command -v gcc >/dev/null 2>&1 && ! command -v clang >/dev/null 2>&1; then
  if [[ "$os" == Darwin ]]; then
    die "Need a C compiler. Run: xcode-select --install"
  fi
  die "Need a C compiler. On Ubuntu: sudo apt install build-essential"
fi

say "Building graphide CLI (release)..."
cargo build -p graphide-cli --release

bin_name="graphide"
src="$ROOT/target/release/$bin_name"
[[ -f "$src" ]] || die "Expected $src"
chmod +x "$src"

mkdir -p "$ROOT/extension/bin" "$HOME/.graphide"
cp "$src" "$ROOT/extension/bin/$bin_name"
cp "$src" "$HOME/.graphide/$bin_name"
chmod +x "$ROOT/extension/bin/$bin_name" "$HOME/.graphide/$bin_name"
say "CLI copied to $HOME/.graphide/$bin_name"

cd "$ROOT/extension"
if [[ ! -d node_modules ]]; then
  say "Installing extension dependencies..."
  npm install
fi
say "Packaging VSIX..."
npm run compile
npx --yes @vscode/vsce package --no-dependencies --allow-missing-repository

vsix="$(ls -1 "$PWD"/graphide-*.vsix 2>/dev/null | tail -n 1 || true)"
[[ -n "$vsix" && -f "$vsix" ]] || die "VSIX not written"

editors=()
add_editor() {
  local p="$1"
  [[ -n "$p" && -x "$p" ]] || return 0
  editors+=("$p")
}

add_editor "$(command -v cursor 2>/dev/null || true)"
add_editor "$(command -v code 2>/dev/null || true)"
add_editor "/Applications/Cursor.app/Contents/Resources/app/bin/cursor"
add_editor "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
add_editor "/usr/share/code/bin/code"
add_editor "/usr/bin/code"
add_editor "/snap/bin/code"
add_editor "/snap/bin/cursor"
add_editor "$HOME/.local/bin/cursor"
add_editor "$HOME/.local/bin/code"
add_editor "/usr/bin/cursor"

# Dedup while keeping order
seen=""
uniq=()
for e in "${editors[@]+"${editors[@]}"}"; do
  case " $seen " in
    *" $e "*) continue ;;
  esac
  seen+=" $e"
  uniq+=("$e")
done

installed=0
for ed in "${uniq[@]+"${uniq[@]}"}"; do
  say "Installing into $ed..."
  if "$ed" --install-extension "$vsix" --force; then
    installed=1
  fi
done

if [[ "$installed" -eq 0 ]]; then
  say "VSIX is ready: $vsix"
  say "In the editor: Extensions → … → Install from VSIX…"
else
  say "Installed. Reload the editor window, open the Graphide view, click Review."
fi
