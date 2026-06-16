import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { Type } from "@sinclair/typebox";
import { sessionDetails } from "../steel-client.js";
import { emitProgress, throwIfAborted, withAbortSignal, withToolError, } from "./tool-runtime.js";
const RELATIVE_SCREENSHOT_DIR = path.join(".steel-browser", "screenshots");
const SUPPORTED_ACTIONS = [
    "move_mouse",
    "click_mouse",
    "drag_mouse",
    "scroll",
    "press_key",
    "type_text",
    "wait",
    "take_screenshot",
    "get_cursor_position",
];
function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
function normalizeCoordinatePair(raw, fieldName) {
    if (!Array.isArray(raw) || raw.length !== 2) {
        throw new Error(`${fieldName} must be [x, y].`);
    }
    const [x, y] = raw;
    if (!isFiniteNumber(x) || !isFiniteNumber(y)) {
        throw new Error(`${fieldName} must contain finite numbers.`);
    }
    return [x, y];
}
function normalizeKeyList(raw, fieldName) {
    if (!Array.isArray(raw) || raw.length === 0) {
        throw new Error(`${fieldName} must contain at least one key.`);
    }
    const keys = raw
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    if (keys.length === 0) {
        throw new Error(`${fieldName} must contain at least one non-empty key.`);
    }
    return keys;
}
function normalizeOptionalHoldKeys(raw) {
    if (raw === undefined) {
        return undefined;
    }
    if (!Array.isArray(raw)) {
        throw new Error("hold_keys must be an array of key names.");
    }
    const keys = raw
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    return keys.length > 0 ? keys : undefined;
}
function normalizeDuration(raw, fieldName) {
    if (raw === undefined) {
        return undefined;
    }
    if (!isFiniteNumber(raw) || raw <= 0) {
        throw new Error(`${fieldName} must be a positive number.`);
    }
    return raw;
}
function normalizeAction(action) {
    const trimmed = action.trim();
    if (!SUPPORTED_ACTIONS.includes(trimmed)) {
        throw new Error(`Unsupported action "${action}". Supported actions: ${SUPPORTED_ACTIONS.join(", ")}.`);
    }
    return trimmed;
}
function buildActionRequest(params) {
    const action = normalizeAction(params.action);
    const screenshot = params.screenshot;
    const holdKeys = normalizeOptionalHoldKeys(params.hold_keys);
    switch (action) {
        case "move_mouse": {
            return {
                action,
                coordinates: normalizeCoordinatePair(params.coordinates, "coordinates"),
                ...(screenshot === undefined ? {} : { screenshot }),
                ...(holdKeys ? { hold_keys: holdKeys } : {}),
            };
        }
        case "click_mouse": {
            const button = params.button;
            if (!button) {
                throw new Error("button is required for click_mouse.");
            }
            const body = {
                action,
                button,
                ...(screenshot === undefined ? {} : { screenshot }),
                ...(holdKeys ? { hold_keys: holdKeys } : {}),
            };
            if (params.coordinates !== undefined) {
                body.coordinates = normalizeCoordinatePair(params.coordinates, "coordinates");
            }
            if (params.click_type !== undefined) {
                body.click_type = params.click_type;
            }
            if (params.num_clicks !== undefined) {
                if (!Number.isInteger(params.num_clicks) || params.num_clicks <= 0) {
                    throw new Error("num_clicks must be a positive integer.");
                }
                body.num_clicks = params.num_clicks;
            }
            return body;
        }
        case "drag_mouse": {
            if (!Array.isArray(params.path) || params.path.length < 2) {
                throw new Error("path must contain at least two [x, y] coordinates.");
            }
            const pathPairs = params.path.map((entry, index) => normalizeCoordinatePair(entry, `path[${index}]`));
            return {
                action,
                path: pathPairs,
                ...(screenshot === undefined ? {} : { screenshot }),
                ...(holdKeys ? { hold_keys: holdKeys } : {}),
            };
        }
        case "scroll": {
            const hasDeltaX = params.delta_x !== undefined;
            const hasDeltaY = params.delta_y !== undefined;
            if (!hasDeltaX && !hasDeltaY) {
                throw new Error("scroll requires delta_x, delta_y, or both.");
            }
            if (hasDeltaX && !isFiniteNumber(params.delta_x)) {
                throw new Error("delta_x must be a finite number.");
            }
            if (hasDeltaY && !isFiniteNumber(params.delta_y)) {
                throw new Error("delta_y must be a finite number.");
            }
            const body = {
                action,
                ...(screenshot === undefined ? {} : { screenshot }),
                ...(holdKeys ? { hold_keys: holdKeys } : {}),
            };
            if (params.coordinates !== undefined) {
                body.coordinates = normalizeCoordinatePair(params.coordinates, "coordinates");
            }
            if (hasDeltaX) {
                body.delta_x = params.delta_x;
            }
            if (hasDeltaY) {
                body.delta_y = params.delta_y;
            }
            return body;
        }
        case "press_key": {
            const duration = normalizeDuration(params.duration, "duration");
            return {
                action,
                keys: normalizeKeyList(params.keys, "keys"),
                ...(duration === undefined ? {} : { duration }),
                ...(screenshot === undefined ? {} : { screenshot }),
            };
        }
        case "type_text": {
            if (typeof params.text !== "string") {
                throw new Error("text is required for type_text.");
            }
            return {
                action,
                text: params.text,
                ...(screenshot === undefined ? {} : { screenshot }),
                ...(holdKeys ? { hold_keys: holdKeys } : {}),
            };
        }
        case "wait": {
            const duration = normalizeDuration(params.duration, "duration");
            if (duration === undefined) {
                throw new Error("duration is required for wait.");
            }
            return {
                action,
                duration,
                ...(screenshot === undefined ? {} : { screenshot }),
            };
        }
        case "take_screenshot":
            return { action };
        case "get_cursor_position":
            return { action };
        default:
            throw new Error(`Unsupported action "${action}".`);
    }
}
function artifactDirectory() {
    return path.resolve(os.homedir(), ".cache", RELATIVE_SCREENSHOT_DIR);
}
function toArtifactDisplayPath(filePath) {
    return filePath;
}
async function createScreenshotPath() {
    const dir = artifactDirectory();
    await fs.mkdir(dir, { recursive: true });
    const safeId = randomUUID().slice(0, 8);
    return path.join(dir, `steel-computer-${Date.now()}-${safeId}.png`);
}
function decodeBase64Png(raw) {
    const text = raw.trim();
    if (!text) {
        throw new Error("empty base64_image payload.");
    }
    const payload = text.startsWith("data:")
        ? text.slice(text.indexOf(",") + 1)
        : text;
    const decoded = Buffer.from(payload, "base64");
    if (decoded.length === 0) {
        throw new Error("invalid base64_image payload.");
    }
    return decoded;
}
async function persistScreenshotArtifact(base64Image) {
    const buffer = decodeBase64Png(base64Image);
    const targetPath = await createScreenshotPath();
    await fs.writeFile(targetPath, buffer);
    const displayPath = toArtifactDisplayPath(targetPath);
    return {
        path: displayPath,
        fileName: path.basename(displayPath),
        mimeType: "image/png",
        sizeBytes: buffer.length,
        type: "image",
    };
}
export function computerTool(client) {
    return {
        name: "steel_computer",
        label: "Computer Action",
        description: "Execute low-level computer actions (mouse, keyboard, scroll, screenshot) by sending raw input events to the browser. Requires a paid Steel plan — self-hosted instances do not support this endpoint. Coordinates are [x, y] pixel positions relative to the page. Pass `screenshot: true` on most actions to return a screenshot after the action. Supported actions:\n  - move_mouse: requires `coordinates`\n  - click_mouse: requires `coordinates` + `button` (left|right|middle|back|forward); optional `click_type` (click|down|up), `num_clicks`\n  - drag_mouse: requires `path` (array of 2+ [x,y] points)\n  - scroll: requires `delta_x` and/or `delta_y`; optional `coordinates`\n  - press_key: requires `keys` (array of key names); optional `duration`\n  - type_text: requires `text`\n  - wait: requires `duration` (seconds)\n  - take_screenshot: no extra params\n  - get_cursor_position: no extra params\nWhen a screenshot is captured, the image path is at the end of the output — use the Read tool to view the image from that path.",
        parameters: Type.Object({
            action: Type.Union(SUPPORTED_ACTIONS.map((value) => Type.Literal(value)), { description: "Computer action type to execute" }),
            screenshot: Type.Optional(Type.Boolean({
                description: "Request screenshot output after the action (supported by most actions)",
            })),
            hold_keys: Type.Optional(Type.Array(Type.String(), {
                description: "Modifier keys to hold while performing supported actions",
            })),
            coordinates: Type.Optional(Type.Array(Type.Number(), {
                minItems: 2,
                maxItems: 2,
                description: "Target coordinates as [x, y]",
            })),
            button: Type.Optional(Type.Union([
                Type.Literal("left"),
                Type.Literal("right"),
                Type.Literal("middle"),
                Type.Literal("back"),
                Type.Literal("forward"),
            ], { description: "Mouse button for click_mouse" })),
            click_type: Type.Optional(Type.Union([Type.Literal("click"), Type.Literal("down"), Type.Literal("up")], { description: "Click type for click_mouse" })),
            num_clicks: Type.Optional(Type.Integer({
                minimum: 1,
                description: "Number of clicks for click_mouse",
            })),
            path: Type.Optional(Type.Array(Type.Array(Type.Number(), { minItems: 2, maxItems: 2 }), {
                minItems: 2,
                description: "Drag path as array of [x, y] points for drag_mouse",
            })),
            delta_x: Type.Optional(Type.Number({ description: "Horizontal scroll amount for scroll" })),
            delta_y: Type.Optional(Type.Number({ description: "Vertical scroll amount for scroll" })),
            keys: Type.Optional(Type.Array(Type.String(), {
                minItems: 1,
                description: "Keys for press_key",
            })),
            duration: Type.Optional(Type.Number({
                exclusiveMinimum: 0,
                description: "Duration in seconds for wait/press_key",
            })),
            text: Type.Optional(Type.String({ description: "Text for type_text action" })),
        }),
        async execute(_toolCallId, params, signal, onUpdate, _ctx) {
            return withToolError("steel_computer", async () => {
                throwIfAborted(signal);
                await emitProgress(onUpdate, "steel_computer", `Preparing action ${params.action}`);
                const session = (await withAbortSignal(client.getOrCreateSession(), signal));
                if (typeof session.computer !== "function") {
                    throw new Error("Current Steel client does not expose sessions.computer(). Upgrade steel-sdk to a newer version.");
                }
                const requestBody = buildActionRequest(params);
                await emitProgress(onUpdate, "steel_computer", `Dispatching ${requestBody.action}`);
                let response;
                try {
                    response = await withAbortSignal(session.computer(requestBody), signal);
                }
                catch (err) {
                    const is404 = err?.status === 404 || (err?.message && err.message.includes("Not Found"));
                    if (is404) {
                        throw new Error("Computer actions require a paid Steel plan. Self-hosted instances do not support this endpoint. Use steel_click, steel_screenshot, steel_scroll, or steel_type instead.");
                    }
                    throw err;
                }
                if (response.error) {
                    throw new Error(response.error);
                }
                let artifact;
                if (typeof response.base64_image === "string" && response.base64_image.trim()) {
                    await emitProgress(onUpdate, "steel_computer", "Persisting screenshot artifact");
                    artifact = await persistScreenshotArtifact(response.base64_image);
                }
                const outputParts = [response.output, response.system]
                    .filter((item) => typeof item === "string" && item.trim().length > 0)
                    .map((item) => item.trim());
                const outputSuffix = outputParts.length > 0 ? ` ${outputParts.join(" ")}` : "";
                const artifactSuffix = artifact ? `\n\nUse the Read tool to view the screenshot: ${artifact.path}` : "";
                return {
                    content: [
                        {
                            type: "text",
                            text: `Computer action ${requestBody.action} completed.${outputSuffix}${artifactSuffix}`,
                        },
                    ],
                    details: {
                        ...sessionDetails(session),
                        action: requestBody.action,
                        request: requestBody,
                        output: response.output ?? null,
                        system: response.system ?? null,
                        hasScreenshot: Boolean(artifact),
                        ...(artifact
                            ? {
                                filePath: artifact.path,
                                fileName: artifact.fileName,
                                artifact,
                            }
                            : {}),
                    },
                };
            }, signal);
        },
    };
}
//# sourceMappingURL=computer.js.map