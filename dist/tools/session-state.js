export async function readSessionUrl(session) {
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
    if (typeof session.getCurrentUrl === "function") {
        const value = await session.getCurrentUrl.call(session);
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }
    return "unknown";
}
export async function readSessionTitle(session) {
    const direct = session.title;
    if (typeof direct === "string" && direct.trim()) {
        return direct;
    }
    if (typeof direct === "function") {
        const value = await direct.call(session);
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }
    return "unknown";
}
export function isBlankPageUrl(url) {
    const normalized = url.trim().toLowerCase();
    return normalized === "about:blank" || normalized === "about:srcdoc";
}
export function freshSessionHint() {
    return "This usually means Pi started a fresh Steel session or the runtime is using a non-persistent session mode. Navigate to a page first, or enable persistence with steel_pin_session or STEEL_SESSION_MODE=session.";
}
export function blankPageError(action) {
    return new Error(`Cannot ${action} because the current page is about:blank. ${freshSessionHint()}`);
}
export function describeBlankPage(url) {
    return `Current URL: ${url} (fresh Steel session; navigate first or enable persistence with steel_pin_session or STEEL_SESSION_MODE=session)`;
}
//# sourceMappingURL=session-state.js.map