# Graphide Review

Local VS Code / Cursor extension for the Graphide review panel.

This package is the UI only. It shells out to a `graphide` binary you build from the repo root:

```bat
cargo build -p graphide-cli
```

Then set `graphide.cliPath` to that binary, for example:

`C:\Users\user\Documents\Git\graphide\target\debug\graphide.exe`

## Package and install (Windows)

From `extension\`:

```bat
npm install
npm run package
code --install-extension graphide-0.1.0.vsix
```

In Cursor, use `cursor` instead of `code`.
