const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const staging = fs.mkdtempSync(path.join(os.tmpdir(), "peepel-package-"));
try {
  fs.cpSync(path.join(root, "extension"), path.join(staging, "peepel-in-days"), { recursive: true });
  fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });
  const archive = path.join(root, "artifacts", "peepel-in-days.zip");
  fs.rmSync(archive, { force: true });
  execFileSync("/usr/bin/zip", ["-qr", archive, "peepel-in-days"], { cwd: staging });
  console.log(archive);
} finally {
  fs.rmSync(staging, { recursive: true, force: true });
}
