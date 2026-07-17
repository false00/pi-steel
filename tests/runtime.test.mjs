import test from "node:test";
import assert from "node:assert/strict";
import { createFakePi, readFileOrEmpty, withTempSteelConfig } from "./helpers.mjs";

const { default: steelExtension } = await import("../dist/index.js");
const { clickTool } = await import("../dist/tools/click.js");
const { resolveSessionMode } = await import("../dist/session-mode.js");

test("session mode defaults to session and still respects explicit overrides", () => {
  const previous = process.env.STEEL_SESSION_MODE;

  try {
    delete process.env.STEEL_SESSION_MODE;
    assert.equal(resolveSessionMode(), "session");

    process.env.STEEL_SESSION_MODE = "agent";
    assert.equal(resolveSessionMode(), "agent");

    process.env.STEEL_SESSION_MODE = "turn";
    assert.equal(resolveSessionMode(), "turn");
  } finally {
    if (previous === undefined) {
      delete process.env.STEEL_SESSION_MODE;
    } else {
      process.env.STEEL_SESSION_MODE = previous;
    }
  }
});

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

test("steel_click fails fast on a fresh about:blank session", async () => {
  let locatorCalled = false;
  const tool = clickTool({
    async getOrCreateSession() {
      return {
        url: async () => "about:blank",
        locator() {
          locatorCalled = true;
          throw new Error("locator should not be used on about:blank");
        },
      };
    },
  });

  await assert.rejects(
    () => tool.execute("tool-2", { selector: "a[href*=\"story\"]" }, undefined, undefined, {}),
    (error) => {
      assert.match(error.message, /Cannot click the selected element because the current page is about:blank/i);
      assert.match(error.message, /STEEL_SESSION_MODE=session/i);
      assert.equal(locatorCalled, false);
      return true;
    },
  );
});
