import { Type } from "@sinclair/typebox";
import { sessionDetails } from "../steel-client.js";
import { emitProgress, throwIfAborted, withAbortSignal, withToolError, } from "./tool-runtime.js";
import { blankPageError, describeBlankPage, isBlankPageUrl, readSessionTitle, readSessionUrl, } from "./session-state.js";
const GO_BACK_TIMEOUT_MS = 10_000;
function isTimeoutError(error) {
    const message = String(error instanceof Error ? error.message : error || "");
    return /timed? ?out|timeout/i.test(message);
}
export function goBackTool(client) {
    return {
        name: "steel_go_back",
        label: "Go Back",
        description: "Navigate back in browser history",
        parameters: Type.Object({}),
        async execute(_toolCallId, _params, signal, onUpdate, _ctx) {
            return withToolError("steel_go_back", async () => {
                throwIfAborted(signal);
                await emitProgress(onUpdate, "steel_go_back", "Preparing history navigation");
                const session = (await withAbortSignal(client.getOrCreateSession(), signal));
                const previousUrl = await readSessionUrl(session);
                const goBack = session.goBack ?? session.back;
                if (typeof goBack !== "function") {
                    throw new Error("Session does not support browser history navigation.");
                }
                await emitProgress(onUpdate, "steel_go_back", "Returning to previous page");
                let timeoutRecovered = false;
                try {
                    await withAbortSignal(Promise.resolve(goBack.call(session, {
                        waitUntil: "domcontentloaded",
                        timeout: GO_BACK_TIMEOUT_MS,
                    })), signal);
                }
                catch (error) {
                    const currentUrlAfterFailure = await readSessionUrl(session);
                    if (isTimeoutError(error) &&
                        currentUrlAfterFailure !== "unknown" &&
                        currentUrlAfterFailure !== previousUrl &&
                        !isBlankPageUrl(currentUrlAfterFailure)) {
                        timeoutRecovered = true;
                        await emitProgress(onUpdate, "steel_go_back", `History navigation completed after timeout; now at ${currentUrlAfterFailure}`);
                    }
                    else {
                        throw error;
                    }
                }
                const currentUrl = await readSessionUrl(session);
                await emitProgress(onUpdate, "steel_go_back", `Returned to ${currentUrl}`);
                return {
                    content: [{
                            type: "text",
                            text: `Navigated back to ${currentUrl}`,
                        }],
                    details: {
                        ...sessionDetails(session),
                        previousUrl,
                        url: currentUrl,
                        timeoutRecovered,
                    },
                };
            }, signal);
        },
    };
}
export function getUrlTool(client) {
    return {
        name: "steel_get_url",
        label: "Get URL",
        description: "Get current page URL",
        parameters: Type.Object({}),
        async execute(_toolCallId, _params, signal, onUpdate, _ctx) {
            return withToolError("steel_get_url", async () => {
                throwIfAborted(signal);
                await emitProgress(onUpdate, "steel_get_url", "Reading current URL");
                const session = (await withAbortSignal(client.getOrCreateSession(), signal));
                const url = await readSessionUrl(session);
                const isFreshSession = isBlankPageUrl(url);
                const text = isFreshSession ? describeBlankPage(url) : `Current URL: ${url}`;
                return {
                    content: [{ type: "text", text }],
                    details: {
                        ...sessionDetails(session),
                        url,
                        isFreshSession,
                    },
                };
            }, signal);
        },
    };
}
export function getTitleTool(client) {
    return {
        name: "steel_get_title",
        label: "Get Title",
        description: "Get current page title",
        parameters: Type.Object({}),
        async execute(_toolCallId, _params, signal, onUpdate, _ctx) {
            return withToolError("steel_get_title", async () => {
                throwIfAborted(signal);
                await emitProgress(onUpdate, "steel_get_title", "Reading current page title");
                const session = (await withAbortSignal(client.getOrCreateSession(), signal));
                const url = await readSessionUrl(session);
                if (isBlankPageUrl(url)) {
                    throw blankPageError("read the page title");
                }
                const title = await readSessionTitle(session);
                return {
                    content: [{ type: "text", text: `Current title: ${title}` }],
                    details: {
                        ...sessionDetails(session),
                        url,
                        title,
                    },
                };
            }, signal);
        },
    };
}
//# sourceMappingURL=navigation.js.map