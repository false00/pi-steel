import { Type } from "@sinclair/typebox";
import { sessionDetails } from "../steel-client.js";
import { runWithCaptchaRecovery } from "./captcha-guard.js";
import { emitProgress, throwIfAborted, withAbortSignal, withToolError, } from "./tool-runtime.js";
import { MAX_TOOL_TIMEOUT_MS, resolveToolTimeoutMs, } from "./tool-settings.js";
function compactCaptchaRecovery(summary) {
    return {
        triggered: summary.triggered,
        retries: summary.retries,
        solveAttempts: summary.solveAttempts,
        statusChecks: summary.statusChecks,
        waitTimedOut: summary.waitTimedOut,
    };
}
function normalizeSelector(selector) {
    const trimmed = selector.trim();
    if (!trimmed) {
        throw new Error("Selector cannot be empty.");
    }
    return trimmed;
}
function normalizeTimeout(timeoutMs) {
    return resolveToolTimeoutMs(timeoutMs);
}
async function ensureField(session, selector, timeoutMs) {
    if (typeof session.waitForSelector === "function") {
        await session.waitForSelector(selector, { state: "visible", timeout: timeoutMs });
    }
    else if (typeof session.page?.waitForSelector === "function") {
        await session.page.waitForSelector(selector, { state: "visible", timeout: timeoutMs });
    }
    const evaluate = session.evaluate ?? session.page?.evaluate;
    if (typeof evaluate !== "function") {
        return { found: true, editable: true };
    }
    return evaluate((rawSelector) => {
        const element = document.querySelector(rawSelector);
        if (!element) {
            return { found: false, editable: false };
        }
        const tag = element.tagName.toLowerCase();
        const isInputLike = tag === "input" ||
            tag === "textarea" ||
            element.isContentEditable;
        const htmlInput = element;
        const editable = isInputLike && htmlInput.readOnly !== true;
        const disabled = element.disabled === true ||
            element.getAttribute("aria-disabled") === "true";
        return { found: true, editable: editable && !disabled };
    }, selector);
}
async function setValue(session, selector, text) {
    if (typeof session.fill === "function") {
        await session.fill(selector, text);
        return;
    }
    if (typeof session.page?.fill === "function") {
        await session.page.fill(selector, text);
        return;
    }
    const locator = typeof session.locator === "function"
        ? session.locator(selector)
        : session.page?.locator?.(selector);
    const locatorFill = locator?.fill;
    if (typeof locatorFill === "function") {
        await locatorFill.call(locator, text);
        return;
    }
    const evaluate = session.evaluate ?? session.page?.evaluate;
    if (typeof evaluate !== "function") {
        throw new Error("Session does not support setting input values.");
    }
    const result = await evaluate((input) => {
        const element = document.querySelector(input.selector);
        if (!element) {
            return false;
        }
        element.focus();
        element.value = input.value;
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
    }, { selector, value: text });
    if (!result) {
        throw new Error(`Element not found: ${selector}`);
    }
}
async function typeValue(session, selector, text) {
    if (typeof session.type === "function") {
        await session.type(selector, text);
        return;
    }
    if (typeof session.page?.type === "function") {
        await session.page.type(selector, text);
        return;
    }
    const locator = typeof session.locator === "function"
        ? session.locator(selector)
        : session.page?.locator?.(selector);
    const locatorType = locator?.type;
    if (typeof locatorType === "function") {
        await locatorType.call(locator, text);
        return;
    }
    await setValue(session, selector, text);
}
export function typeTool(client) {
    return {
        name: "steel_type",
        label: "Type",
        description: "Type text into an input element",
        parameters: Type.Object({
            selector: Type.String({ description: "CSS selector for the input field" }),
            text: Type.String({ description: "Text to type into the field" }),
            clear: Type.Optional(Type.Boolean({ description: "Whether to clear the field before typing" })),
            timeout: Type.Optional(Type.Integer({
                minimum: 100,
                maximum: MAX_TOOL_TIMEOUT_MS,
                description: "Maximum milliseconds to wait for the input",
            })),
        }),
        async execute(_toolCallId, params, signal, onUpdate, _ctx) {
            return withToolError("steel_type", async () => {
                throwIfAborted(signal);
                const selector = normalizeSelector(params.selector);
                const timeoutMs = normalizeTimeout(params.timeout);
                const text = params.text;
                const shouldClear = params.clear ?? true;
                await emitProgress(onUpdate, "steel_type", `Preparing input for ${selector}`);
                const session = (await withAbortSignal(client.getOrCreateSession(), signal));
                await emitProgress(onUpdate, "steel_type", "Running field input sequence");
                const captchaRecovery = await runWithCaptchaRecovery({
                    session,
                    context: "steel_type",
                    actionLabel: `type into ${selector}`,
                    onUpdate,
                    signal,
                    operation: async () => {
                        throwIfAborted(signal);
                        const fieldState = await withAbortSignal(ensureField(session, selector, timeoutMs), signal);
                        if (!fieldState.found) {
                            throw new Error(`No element matched selector: ${selector}`);
                        }
                        if (!fieldState.editable) {
                            throw new Error(`Element is not editable: ${selector}`);
                        }
                        await emitProgress(onUpdate, "steel_type", shouldClear ? "Clearing existing value" : "Typing into field");
                        if (shouldClear) {
                            await withAbortSignal(setValue(session, selector, text), signal);
                        }
                        else {
                            await withAbortSignal(typeValue(session, selector, text), signal);
                        }
                    },
                });
                await emitProgress(onUpdate, "steel_type", `Input applied to ${selector}`);
                return {
                    content: [{ type: "text", text: `Typed into ${selector}` }],
                    details: {
                        ...sessionDetails(session),
                        selector,
                        timeoutMs,
                        clear: shouldClear,
                        textLength: text.length,
                        captchaRecovery: compactCaptchaRecovery(captchaRecovery),
                    },
                };
            }, signal);
        },
    };
}
//# sourceMappingURL=type.js.map