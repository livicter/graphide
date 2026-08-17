const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..", "..");
const destDir = path.join(__dirname, "..", "bin");
fs.mkdirSync(destDir, { recursive: true });
const names = process.platform === "win32" ? ["graphide.exe"] : ["graphide"];
let copied = 0;
for (const name of names) {
  const release = path.join(root, "target", "release", name);
  const debug = path.join(root, "target", "debug", name);
  const from = fs.existsSync(release) ? release : fs.existsSync(debug) ? debug : null;
  if (!from) continue;
  fs.copyFileSync(from, path.join(destDir, name));
  copied += 1;
  console.log("bundled", from);
}
if (!copied) {
  console.log("no local graphide binary to bundle (ok if you only have the UI)");
}
