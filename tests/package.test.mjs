import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("package metadata exposes trust and support signals", () => {
  assert.equal(pkg.name, "@false00/pi-steel");
  assert.equal(pkg.main, "dist/index.js");
  assert.equal(pkg.types, "dist/index.d.ts");
  assert.equal(pkg.publishConfig?.access, "public");
  assert.equal(pkg.homepage, "https://github.com/false00/pi-steel#readme");
  assert.equal(pkg.bugs?.url, "https://github.com/false00/pi-steel/issues");
  assert.equal(pkg.directories?.doc, "docs");
  assert.equal(pkg.directories?.test, "tests");
});

test("published files include docs and policy files", () => {
  const published = new Set(pkg.files ?? []);
  for (const required of [
    "dist",
    "AGENTS.md",
    "CHANGELOG.md",
    "CONTRIBUTING.md",
    "README.md",
    "SECURITY.md",
    "docs/COMPATIBILITY.md",
    "docs/EXAMPLES.md",
    "docs/TROUBLESHOOTING.md",
    "LICENSE",
  ]) {
    assert.ok(published.has(required), `missing published file entry: ${required}`);
  }
});

test("dependency posture is hardened", () => {
  assert.equal(pkg.dependencies?.["steel-sdk"], "^0.18.0");
  assert.equal(pkg.dependencies?.["playwright-core"], "^1.61.0");
  assert.equal(pkg.dependencies?.["@sinclair/typebox"], "^0.34.49");
  assert.ok(!pkg.peerDependencies);
  assert.equal(pkg.overrides?.["form-data"], "^4.0.6");
});
