import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export function createFakePi() {
  const tools = [];
  const commands = [];
  const events = new Map();
  let shutdownHandler;

  return {
    tools,
    commands,
    events,
    get shutdownHandler() {
      return shutdownHandler;
    },
    registerTool(tool) {
      tools.push(tool);
    },
    registerCommand(name, options) {
      commands.push({ name, ...options });
    },
    on(event, handler) {
      const handlers = events.get(event) ?? [];
      handlers.push(handler);
      events.set(event, handlers);
    },
    onShutdown(handler) {
      shutdownHandler = handler;
    },
  };
}

const STEEL_ENV_KEYS = [
  "STEEL_CONFIG_DIR",
  "STEEL_API_KEY",
  "STEEL_BASE_URL",
  "STEEL_BROWSER_API_URL",
  "STEEL_LOCAL_API_URL",
  "STEEL_API_URL",
  "STEEL_SESSION_HEADLESS",
  "STEEL_SESSION_NAMESPACE",
  "STEEL_SESSION_PROFILE_ID",
  "STEEL_SESSION_PERSIST_PROFILE",
  "STEEL_SESSION_CREDENTIALS",
  "STEEL_USE_PROXY",
  "STEEL_PROXY_URL",
  "STEEL_SOLVE_CAPTCHA",
  "STEEL_SESSION_REGION",
];

export async function withTempSteelConfig(run) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-steel-test-"));
  const previous = new Map(STEEL_ENV_KEYS.map((key) => [key, process.env[key]]));

  for (const key of STEEL_ENV_KEYS) {
    delete process.env[key];
  }
  process.env.STEEL_CONFIG_DIR = tempDir;

  try {
    return await run({
      tempDir,
      envPath: path.join(tempDir, ".env"),
    });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

export async function readFileOrEmpty(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    assert.fail(`Expected file to exist: ${filePath}\n${error}`);
  }
}
