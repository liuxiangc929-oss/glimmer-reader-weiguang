import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("provides stable Windows dev-server startup scripts", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  const startScript = readFileSync("scripts/start-glimmer-dev.ps1", "utf8");
  const installScript = readFileSync("scripts/install-dev-autostart.ps1", "utf8");

  assert.equal(
    packageJson.scripts["dev:start"],
    "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-glimmer-dev.ps1",
  );
  assert.equal(
    packageJson.scripts["dev:install-autostart"],
    "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/install-dev-autostart.ps1",
  );
  assert.match(startScript, /127\.0\.0\.1/);
  assert.match(startScript, /3002/);
  assert.match(startScript, /node_modules\\vite\\bin\\vite\.js/);
  assert.match(installScript, /Register-ScheduledTask/);
  assert.match(installScript, /Startup/);
  assert.match(installScript, /GlimmerReaderDevServer/);
});
