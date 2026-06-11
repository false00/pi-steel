import type { AgentToolUpdateCallback } from "@mariozechner/pi-coding-agent";
export type ToolErrorCategory = "validation" | "timeout" | "network" | "tool_execution" | "unknown";
export type ToolProgressUpdater = AgentToolUpdateCallback<{
    context: string;
    kind: "progress";
    message: string;
}> | undefined;
export declare function toolErrorMessage(context: string, error: unknown): string;
export declare function toolError(context: string, error: unknown): Error;
export declare function isAbortError(error: unknown): boolean;
export declare function throwIfAborted(signal: AbortSignal | undefined): void;
export declare function sleepWithSignal(ms: number, signal: AbortSignal | undefined): Promise<void>;
export declare function withAbortSignal<T>(promise: Promise<T>, signal: AbortSignal | undefined): Promise<T>;
export declare function withToolError<T>(context: string, operation: () => Promise<T>, signal?: AbortSignal): Promise<T>;
export declare function emitProgress(onUpdate: ToolProgressUpdater, context: string, message: string): void;
