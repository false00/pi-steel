import { Type } from "@sinclair/typebox";
import { sessionDetails } from "../steel-client.js";
import { runWithCaptchaRecovery } from "./captcha-guard.js";
import { emitProgress, isAbortError, throwIfAborted, withAbortSignal, withToolError, } from "./tool-runtime.js";
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
function normalizeValue(raw) {
    return raw;
}
function asArray(input) {
    if (!Array.isArray(input)) {
        return [];
    }
    return input
        .map((entry) => {
        if (typeof entry !== "object" || entry === null) {
            return null;
        }
        const record = entry;
        if (typeof record.selector !== "string" || typeof record.value !== "string") {
            return null;
        }
        return {
            selector: normalizeSelector(record.selector),
            value: normalizeValue(record.value),
        };
    })
        .filter((entry) => Boolean(entry));
}
async function ensureField(session, selector, timeoutMs) {
    if (typeof session.waitForSelector === "function") {
        await session.waitForSelector(selector, { state: "visible", timeout: timeoutMs });
        return;
    }
    if (typeof session.page?.waitForSelector === "function") {
        await session.page.waitForSelector(selector, { state: "visible", timeout: timeoutMs });
        return;
    }
    const evaluate = session.evaluate ?? session.page?.evaluate;
    if (typeof evaluate !== "function") {
        return;
    }
    const valid = await evaluate((rawSelector) => {
        const element = document.querySelector(rawSelector);
        return Boolean(element);
    }, selector);
    if (!valid) {
        throw new Error(`No element matched selector: ${selector}`);
    }
}
async function fill(session, selector, value) {
    if (typeof session.fill === "function") {
        await session.fill(selector, value);
        return;
    }
    if (typeof session.page?.fill === "function") {
        await session.page.fill(selector, value);
        return;
    }
    const locator = typeof session.locator === "function"
        ? session.locator(selector)
        : session.page?.locator?.(selector);
    const locatorFill = locator?.fill;
    if (typeof locatorFill === "function") {
        await locatorFill.call(locator, value);
        return;
    }
    const evaluate = session.evaluate ?? session.page?.evaluate;
    if (typeof evaluate !== "function") {
        throw new Error("Session does not support setting input values.");
    }
    const ok = await evaluate((input) => {
        const element = document.querySelector(input.selector);
        if (!element) {
            return false;
        }
        element.value = input.value;
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
    }, { selector, value });
    if (!ok) {
        throw new Error(`Could not set value for selector: ${selector}`);
    }
}
export function fillFormTool(client) {
    return {
        name: "steel_fill_form",
        label: "Fill Form",
        description: "Fill multiple input fields in a single tool call",
        parameters: Type.Object({
            fields: Type.Array(Type.Object({
                selector: Type.String({ description: "CSS selector for the field" }),
                value: Type.String({ description: "Value for the field" }),
            })),
            timeout: Type.Optional(Type.Integer({
                minimum: 100,
                maximum: MAX_TOOL_TIMEOUT_MS,
                description: "Maximum milliseconds to wait for each field",
            })),
        }),
        async execute(_toolCallId, params, signal, onUpdate, _ctx) {
            return withToolError("steel_fill_form", async () => {
                throwIfAborted(signal);
                const fields = asArray(params.fields);
                if (!fields.length) {
                    throw new Error("At least one field with selector and value is required.");
                }
                const timeoutMs = normalizeTimeout(params.timeout);
                await emitProgress(onUpdate, "steel_fill_form", `Preparing ${fields.length} field(s)`);
                const session = (await withAbortSignal(client.getOrCreateSession(), signal));
                const results = [];
                let successCount = 0;
                for (let index = 0; index < fields.length; index += 1) {
                    throwIfAborted(signal);
                    const entry = fields[index];
                    const result = {
                        selector: entry.selector,
                        status: "error",
                        valueLength: entry.value.length,
                    };
                    await emitProgress(onUpdate, "steel_fill_form", `Processing ${index + 1}/${fields.length}: ${entry.selector}`);
                    try {
                        const captchaRecovery = await runWithCaptchaRecovery({
                            session,
                            context: "steel_fill_form",
                            actionLabel: `fill ${entry.selector}`,
                            onUpdate,
                            signal,
                            operation: async () => {
                                throwIfAborted(signal);
                                await withAbortSignal(ensureField(session, entry.selector, timeoutMs), signal);
                                throwIfAborted(signal);
                                await withAbortSignal(fill(session, entry.selector, entry.value), signal);
                            },
                        });
                        result.status = "success";
                        result.captchaRecovery = compactCaptchaRecovery(captchaRecovery);
                        successCount += 1;
                        await emitProgress(onUpdate, "steel_fill_form", `Filled ${entry.selector}`);
                    }
                    catch (error) {
                        if (isAbortError(error)) {
                            throw error;
                        }
                        result.reason = error instanceof Error ? error.message : "Unknown error";
                    }
                    results.push(result);
                }
                if (successCount === 0) {
                    throw new Error("No form fields were filled successfully.");
                }
                await emitProgress(onUpdate, "steel_fill_form", `Filled ${successCount}/${fields.length} field(s).`);
                return {
                    content: [
                        {
                            type: "text",
                            text: successCount === fields.length
                                ? `Filled ${fields.length} form field(s).`
                                : `Filled ${successCount}/${fields.length} form fields. Some fields failed.`,
                        },
                    ],
                    details: {
                        ...sessionDetails(session),
                        timeoutMs,
                        total: fields.length,
                        successCount,
                        results,
                    },
                };
            }, signal);
        },
    };
}
//# sourceMappingURL=fill-form.js.map