import test from "node:test";
import assert from "node:assert/strict";
import { createFakePi, readFileOrEmpty, withTempSteelConfig } from "./helpers.mjs";

const { default: steelExtension } = await import("../dist/index.js");

test("extension loads without Steel credentials and registers tools/commands", async () => {
  await withTempSteelConfig(async ({ envPath }) => {
    const pi = createFakePi();

    assert.doesNotThrow(() => steelExtension(pi));
    assert.equal(pi.tools.length, 17);
    assert.ok(pi.tools.some((tool) => tool.name === "steel_navigate"));
    assert.ok(pi.tools.some((tool) => tool.name === "steel_release_session"));
    assert.ok(pi.commands.some((command) => command.name === "clear_webcache"));
    assert.ok(pi.events.has("turn_end"));
    assert.ok(typeof pi.shutdownHandler === "function");

    const envContents = await readFileOrEmpty(envPath);
    assert.match(envContents, /api_key=/);
    assert.match(envContents, /steel login/);
  });
});
