#!/usr/bin/env node
/** Bundle the React desk + vanilla graph into extension/media/main.js */
import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ext = path.resolve(here, "..");
const root = path.resolve(ext, "..");
const outfile = path.join(ext, "media", "main.js");
const check = process.argv.includes("--check");
const prev = check && fs.existsSync(outfile) ? fs.readFileSync(outfile) : null;

const result = await esbuild.build({
  absWorkingDir: root,
  entryPoints: [path.join(ext, "media", "src", "index.jsx")],
  outfile,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  jsx: "automatic",
  minify: false,
  charset: "utf8",
  sourcemap: false,
  legalComments: "none",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  banner: {
    js: "/* Graphide Review desk — React 18 chrome + vanilla graph. npm run build:webview */",
  },
  logLevel: "info",
});

if (result.errors && result.errors.length) {
  process.exit(1);
}

if (check && prev) {
  const next = fs.readFileSync(outfile);
  if (!prev.equals(next)) {
    fs.writeFileSync(outfile, prev);
    console.error("FAIL build:webview --check · committed extension/media/main.js is stale. Run npm run build:webview and commit the bundle.");
    process.exit(1);
  }
}

console.log("ok webview", path.relative(root, outfile), fs.statSync(outfile).size);
