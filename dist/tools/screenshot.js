import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Type } from "@sinclair/typebox";
import { sessionDetails as baseSessionDetails } from "../steel-client.js";
import { emitProgress, throwIfAborted, withAbortSignal, withToolError, } from "./tool-runtime.js";
import { MAX_TOOL_TIMEOUT_MS, resolveToolTimeoutMs, } from "./tool-settings.js";
const DEFAULT_FULL_PAGE = false;
const RELATIVE_SCREENSHOT_DIR = path.join(".artifacts", "screenshots");
function sessionDetails(session, url, selector, fullPage) {
    return {
        ...baseSessionDetails(session),
        url,
        selector: selector ?? null,
        fullPage,
    };
}
function normalizeSelector(selector) {
    if (selector === undefined) {
        return undefined;
    }
    const trimmed = selector.trim();
    if (!trimmed) {
        throw new Error("selector cannot be empty.");
    }
    return trimmed;
}
function resolveTimeoutMs(rawTimeout) {
    return resolveToolTimeoutMs(rawTimeout);
}
function normalizeFullPage(fullPage) {
    return fullPage !== false;
}
async function readSessionUrl(session) {
    const direct = session.url;
    if (typeof direct === "string" && direct.trim()) {
        return direct;
    }
    if (typeof direct === "function") {
        const value = await direct.call(session);
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }
    const getter = session.getCurrentUrl;
    if (typeof getter === "function") {
        const value = await getter.call(session);
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }
    return "unknown";
}
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
function artifactDirectory() {
    return path.resolve(process.cwd(), RELATIVE_SCREENSHOT_DIR);
}
function toArtifactDisplayPath(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    if (!relativePath || relativePath.startsWith("..")) {
        return path.basename(filePath);
    }
    return relativePath;
}
async function makeArtifactPath() {
    const dir = artifactDirectory();
    await fs.mkdir(dir, { recursive: true });
    const safeId = randomUUID().slice(0, 8);
    return path.join(dir, `steel-screenshot-${Date.now()}-${safeId}.png`);
}
async function getWaitForSelector(session) {
    if (typeof session.waitForSelector === "function") {
        return async (selector, timeoutMs) => {
            await session.waitForSelector?.(selector, { state: "visible", timeout: timeoutMs });
        };
    }
    if (typeof session.page?.waitForSelector === "function") {
        return async (selector, timeoutMs) => {
            await session.page?.waitForSelector?.(selector, { state: "visible", timeout: timeoutMs });
        };
    }
    return async () => {
        return;
    };
}
function getSessionScreenshot(session) {
    if (typeof session.screenshot === "function") {
        return async (options) => {
            return session.screenshot?.(options);
        };
    }
    if (typeof session.page?.screenshot === "function") {
        return async (options) => {
            return session.page?.screenshot?.(options);
        };
    }
    return undefined;
}
function getSessionLocator(session, selector) {
    if (typeof session.locator === "function") {
        return session.locator(selector);
    }
    if (typeof session.page?.locator === "function") {
        return session.page.locator(selector);
    }
    return undefined;
}
async function captureWithSelector(session, selector, targetPath, timeoutMs) {
    const waitForSelector = await getWaitForSelector(session);
    await waitForSelector(selector, timeoutMs);
    const locator = getSessionLocator(session, selector);
    if (locator?.screenshot) {
        return locator.screenshot({ path: targetPath });
    }
    const evaluate = session.evaluate ?? session.page?.evaluate;
    if (typeof evaluate !== "function") {
        return false;
    }
    const clip = await evaluate((rawSelector) => {
        const element = document.querySelector(rawSelector);
        if (!element) {
            return null;
        }
        const bounds = element.getBoundingClientRect();
        if (!bounds.width || !bounds.height) {
            return null;
        }
        return {
            x: Math.max(0, Math.floor(bounds.left)),
            y: Math.max(0, Math.floor(bounds.top)),
            width: Math.max(1, Math.ceil(bounds.width)),
            height: Math.max(1, Math.ceil(bounds.height)),
        };
    }, selector);
    if (!clip) {
        throw new Error(`No element matched selector: ${selector}`);
    }
    const screenshot = getSessionScreenshot(session);
    if (!screenshot) {
        return undefined;
    }
    return screenshot({
        path: targetPath,
        clip,
    });
}
async function captureFullPage(session, targetPath, fullPage) {
    const screenshot = getSessionScreenshot(session);
    if (!screenshot) {
        throw new Error("Session does not support screenshot capture.");
    }
    return screenshot({
        path: targetPath,
        fullPage,
    });
}
function isBinaryLike(value) {
    if (value instanceof Uint8Array) {
        return value;
    }
    if (value instanceof Buffer) {
        return value;
    }
    return null;
}
async function persistScreenshotBuffer(targetPath, value) {
    const buffer = isBinaryLike(value);
    if (!buffer) {
        return;
    }
    await fs.writeFile(targetPath, Buffer.from(buffer));
}
async function writeArtifact(targetPath, sessionResult) {
    if (await fileExists(targetPath)) {
        return;
    }
    await persistScreenshotBuffer(targetPath, sessionResult);
    if (!(await fileExists(targetPath))) {
        throw new Error(`Screenshot not written to expected path: ${targetPath}`);
    }
}
export function screenshotTool(client) {
    return {
        name: "steel_screenshot",
        label: "Screenshot",
        description: "Capture a full-page screenshot (default). The file path is shown at the end of the output — read that path to view the image. Pass fullPage: false to capture only the viewport.",
        parameters: Type.Object({
            fullPage: Type.Optional(Type.Boolean({ description: "Capture full page screenshot instead of viewport-only (defaults to true in @false00/pi-steel)" })),
            selector: Type.Optional(Type.String({
                description: "Optional CSS selector to capture a single element instead of full page",
            })),
            timeout: Type.Optional(Type.Integer({
                minimum: 100,
                maximum: MAX_TOOL_TIMEOUT_MS,
                description: "Timeout for waiting on selector when selector mode is used",
            })),
        }),
        async execute(_toolCallId, params, signal, onUpdate, _ctx) {
            return withToolError("steel_screenshot", async () => {
                throwIfAborted(signal);
                const selector = normalizeSelector(params.selector);
                const fullPage = normalizeFullPage(params.fullPage);
                const timeoutMs = resolveTimeoutMs(params.timeout);
                const target = selector ? ` element ${selector}` : " visible page";
                await emitProgress(onUpdate, "steel_screenshot", `Preparing capture for${target}`);
                const session = (await withAbortSignal(client.getOrCreateSession(), signal));
                throwIfAborted(signal);
                const url = await readSessionUrl(session);
                const targetPath = await makeArtifactPath();
                let screenshotResult;
                if (selector) {
                    await emitProgress(onUpdate, "steel_screenshot", `Capturing element ${selector}`);
                    screenshotResult = await captureWithSelector(session, selector, targetPath, timeoutMs);
                    if (!screenshotResult && !(await fileExists(targetPath))) {
                        throw new Error("Session does not support selector-based screenshot capture.");
                    }
                }
                else {
                    await emitProgress(onUpdate, "steel_screenshot", fullPage ? "Capturing full-page screenshot" : "Capturing viewport screenshot");
                    screenshotResult = await captureFullPage(session, targetPath, fullPage);
                }
                await emitProgress(onUpdate, "steel_screenshot", `Persisting image to ${targetPath}`);
                await writeArtifact(targetPath, screenshotResult);
                const displayPath = toArtifactDisplayPath(targetPath);
                const contentText = selector
                    ? `Captured screenshot of ${selector}`
                    : fullPage
                        ? "Captured full-page screenshot"
                        : "Captured viewport screenshot";
                return {
                    content: [{ type: "text", text: contentText + `\nPath: ${displayPath}` }],
                    details: {
                        ...sessionDetails(session, url, selector, fullPage),
                        filePath: displayPath,
                        timeoutMs,
                    },
                };
            }, signal);
        },
    };
}
//# sourceMappingURL=screenshot.js.map