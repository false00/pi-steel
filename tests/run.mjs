import { spawnSync } from "node:child_process";

const files = [
  "tests/smoke.test.mjs",
  "tests/runtime.test.mjs",
  "tests/package.test.mjs",
];

const result = spawnSync(process.execPath, ["--test", ...files], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
