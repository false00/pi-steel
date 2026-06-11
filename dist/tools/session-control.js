import { Type } from "@sinclair/typebox";
import { withToolError } from "./tool-runtime.js";
function buildPinMessage(sessionId) {
    if (sessionId) {
        return `Enabled Steel session persistence for this Pi session. Current session: ${sessionId}.`;
    }
    return "Enabled Steel session persistence for this Pi session.";
}
function buildReleaseMessage(sessionId, nextMode) {
    if (sessionId) {
        return `Released Steel session ${sessionId}. Runtime session mode reset to ${nextMode}.`;
    }
    return `No active Steel session to release. Runtime session mode reset to ${nextMode}.`;
}
export function pinSessionTool(client, controller) {
    return {
        name: "steel_pin_session",
        label: "Pin Session",
        description: "Keep the current Steel browser session alive across prompts until explicitly released",
        parameters: Type.Object({}),
        async execute(_toolCallId, _params, _signal, _onUpdate, _ctx) {
            return withToolError("steel_pin_session", async () => {
                const previousMode = controller.getSessionMode();
                controller.setSessionMode("session");
                const sessionId = client.getCurrentSessionId();
                return {
                    content: [{ type: "text", text: buildPinMessage(sessionId) }],
                    details: {
                        previousMode,
                        mode: "session",
                        defaultMode: controller.getDefaultSessionMode(),
                        sessionId,
                        hasActiveSession: client.hasActiveSession(),
                    },
                };
            });
        },
    };
}
export function releaseSessionTool(client, controller) {
    return {
        name: "steel_release_session",
        label: "Release Session",
        description: "Close the current Steel browser session immediately and restore the default runtime session mode",
        parameters: Type.Object({}),
        async execute(_toolCallId, _params, _signal, _onUpdate, _ctx) {
            return withToolError("steel_release_session", async () => {
                const previousMode = controller.getSessionMode();
                const defaultMode = controller.getDefaultSessionMode();
                const sessionId = client.getCurrentSessionId();
                await controller.closeSessions("steel_release_session");
                controller.setSessionMode(defaultMode);
                return {
                    content: [{ type: "text", text: buildReleaseMessage(sessionId, defaultMode) }],
                    details: {
                        previousMode,
                        mode: defaultMode,
                        defaultMode,
                        releasedSessionId: sessionId,
                        hadActiveSession: Boolean(sessionId),
                    },
                };
            });
        },
    };
}
//# sourceMappingURL=session-control.js.map