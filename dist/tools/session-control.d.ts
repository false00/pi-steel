import type { ToolDefinition } from "../pi-types";
import type { SteelSessionMode } from "../session-mode.js";
import type { SteelClient } from "../steel-client.js";
export type SteelSessionController = {
    getDefaultSessionMode: () => SteelSessionMode;
    getSessionMode: () => SteelSessionMode;
    setSessionMode: (mode: SteelSessionMode) => void;
    closeSessions: (reason: string) => Promise<void>;
};
export declare function pinSessionTool(client: SteelClient, controller: SteelSessionController): ToolDefinition<any, any>;
export declare function releaseSessionTool(client: SteelClient, controller: SteelSessionController): ToolDefinition<any, any>;
