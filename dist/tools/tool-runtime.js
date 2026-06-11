const ABORT_ERROR_NAME = "AbortError";
const ABORT_ERROR_MESSAGE = "Tool execution cancelled.";
const TOOL_ERROR_PATTERNS = {
    validation: [
        "bad request",
        "invalid",
        "missing",
        "required",
        "schema",
        "format",
        "validation",
        "unsupported value",
        "not allowed",
    ],
    timeout: [
        "timed out",
        "timeout",
        "timed-out",
        "deadline",
        "time out",
    ],
    network: [
        "network",
        "connection",
        "econn",
        "enotfound",
        "dns",
        "econnreset",
        "econnrefused",
        "proxy",
        "ssl",
        "certificate",
    ],
    tool_execution: [
        "selector",
        "tool",
        "navigation",
        "screenshot",
        "pdf",
        "session",
        "click",
        "extract",
        "not supported",
        "page",
    ],
    unknown: [],
};
const TOOL_ERROR_LABELS = {
    validation: "Validation failed",
    timeout: "Timed out",
    network: "Network issue",
    tool_execution: "Tool execution failed",
    unknown: "Tool error",
};
const TOOL_ERROR_GUIDANCE = {
    validation: "Check required inputs and retry with corrected values.",
    timeout: "Retry with narrower scope or longer timeout values.",
    network: "Retry once connectivity is stable.",
    tool_execution: "Retrying usually succeeds; if selector-based operations fail, refresh page state and try again.",
    unknown: "Retry the action and, if it repeats, rerun with simplified inputs.",
};
function normalizeErrorMessage(error) {
    if (error instanceof Error) {
        return error.message?.trim() || "Unknown error";
    }
    if (typeof error === "string") {
        return error.trim() || "Unknown error";
    }
    if (error === undefined || error === null) {
        return "Unknown error";
    }
    try {
        return JSON.stringify(error);
    }
    catch {
        return String(error);
    }
}
function classifyError(message) {
    const normalized = message.toLowerCase();
    for (const [category, markers] of Object.entries(TOOL_ERROR_PATTERNS)) {
        if (markers.some((marker) => normalized.includes(marker))) {
            return category;
        }
    }
    return "unknown";
}
export function toolErrorMessage(context, error) {
    const message = normalizeErrorMessage(error);
    const category = classifyError(message);
    const label = TOOL_ERROR_LABELS[category];
    const guidance = TOOL_ERROR_GUIDANCE[category];
    return `${context}: ${label}. ${message}. Retry guidance: ${guidance}`;
}
export function toolError(context, error) {
    return new Error(toolErrorMessage(context, error));
}
function abortError(message = ABORT_ERROR_MESSAGE) {
    const error = new Error(message);
    error.name = ABORT_ERROR_NAME;
    return error;
}
export function isAbortError(error) {
    if (!(error instanceof Error)) {
        return false;
    }
    if (error.name === ABORT_ERROR_NAME) {
        return true;
    }
    const message = error.message.toLowerCase();
    return message.includes("cancelled") || message.includes("canceled");
}
export function throwIfAborted(signal) {
    if (signal?.aborted) {
        throw abortError();
    }
}
export function sleepWithSignal(ms, signal) {
    if (!signal) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    throwIfAborted(signal);
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            signal.removeEventListener("abort", onAbort);
            resolve();
        }, ms);
        const onAbort = () => {
            clearTimeout(timer);
            signal.removeEventListener("abort", onAbort);
            reject(abortError());
        };
        signal.addEventListener("abort", onAbort, { once: true });
    });
}
export function withAbortSignal(promise, signal) {
    if (!signal) {
        return promise;
    }
    throwIfAborted(signal);
    return new Promise((resolve, reject) => {
        const onAbort = () => {
            signal.removeEventListener("abort", onAbort);
            reject(abortError());
        };
        signal.addEventListener("abort", onAbort, { once: true });
        promise.then((value) => {
            signal.removeEventListener("abort", onAbort);
            resolve(value);
        }, (error) => {
            signal.removeEventListener("abort", onAbort);
            reject(error);
        });
    });
}
export function withToolError(context, operation, signal) {
    try {
        throwIfAborted(signal);
        return operation().catch((error) => {
            if (isAbortError(error) || signal?.aborted) {
                throw abortError(`${context}: ${ABORT_ERROR_MESSAGE}`);
            }
            throw toolError(context, error);
        });
    }
    catch (error) {
        if (isAbortError(error) || signal?.aborted) {
            throw abortError(`${context}: ${ABORT_ERROR_MESSAGE}`);
        }
        throw toolError(context, error);
    }
}
export function emitProgress(onUpdate, context, message) {
    if (!onUpdate) {
        return;
    }
    const trimmed = message.trim();
    onUpdate({
        content: [{ type: "text", text: `${context}: ${trimmed}` }],
        details: {
            context,
            kind: "progress",
            message: trimmed,
        },
    });
}
//# sourceMappingURL=tool-runtime.js.map