export declare const MIN_TOOL_TIMEOUT_MS = 100;
export declare const MAX_TOOL_TIMEOUT_MS = 120000;
export declare function getDefaultToolTimeoutMs(): number;
export declare function resolveToolTimeoutMs(rawTimeout: number | undefined): number;
