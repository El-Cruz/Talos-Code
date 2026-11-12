import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const script = resolve("scripts/vercel-ignore-build.mjs");
test("ignored builds skip docs but preserve code changes, renames and unknown history", () => {
  const cwd = mkdtempSync(join(tmpdir(), "talos-ignore-build-"));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const commit = () => { git("add", "."); git("-c", "user.name=Test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", "commit", "-qm", "fixture"); };
  const run = base => spawnSync(process.execPath, [script], { cwd, env: { ...process.env, VERCEL_GIT_PREVIOUS_SHA: base }, encoding: "utf8" }).status;
  try {
    git("init", "-q"); writeFileSync(join(cwd, "app.ts"), "export default 1;"); commit();
    assert.equal(run("missing-revision"), 1);
    let base = git("rev-parse", "HEAD");
    writeFileSync(join(cwd, "README.md"), "docs"); writeFileSync(join(cwd, "hero.svg"), "<svg/>"); commit();
    assert.equal(run(base), 1);
    base = git("rev-parse", "HEAD"); writeFileSync(join(cwd, ".editorconfig"), "root=true"); commit();
    assert.equal(run(base), 0);
    base = git("rev-parse", "HEAD"); writeFileSync(join(cwd, "app.ts"), "export default 2;"); commit();
    const previousCode = base;
    assert.equal(run(base), 1);
    base = git("rev-parse", "HEAD"); writeFileSync(join(cwd, "README.md"), "updated docs"); commit();
    assert.equal(run(previousCode), 1); // Multiple commits since the last deployment.
    base = git("rev-parse", "HEAD"); renameSync(join(cwd, "app.ts"), join(cwd, "archived.md")); commit();
    assert.equal(run(base), 1); // A rename must not hide deleted application code.
    assert.equal(run("HEAD"), 1);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});
