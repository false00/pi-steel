import test from "node:test";
import assert from "node:assert/strict";
import { createFakePi, readFileOrEmpty, withTempSteelConfig } from "./helpers.mjs";

const { default: steelExtension } = await import("../dist/index.js");

test("missing configuration is deferred until tool execution with actionable guidance", async () => {
  await withTempSteelConfig(async ({ envPath }) => {
    const pi = createFakePi();
    steelExtension(pi);

    const navigateTool = pi.tools.find((tool) => tool.name === "steel_navigate");
    assert.ok(navigateTool, "expected steel_navigate to be registered");

    await assert.rejects(
      () => navigateTool.execute("tool-1", { url: "https://example.com" }, undefined, undefined, {}),
      (error) => {
        assert.match(error.message, /Configuration required/i);
        assert.match(error.message, /Update .*\.env/i);
        assert.match(error.message, /steel login/i);
        assert.doesNotMatch(error.message, /Failed to load extension/i);
        return true;
      },
    );

    const envContents = await readFileOrEmpty(envPath);
    assert.match(envContents, /api_key=/);
  });
});
