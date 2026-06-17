export interface AgentToolResult<T = unknown> {
    content: Array<{
        type: string;
        [key: string]: unknown;
    }>;
    details?: T;
    terminate?: boolean;
}
export type AgentToolUpdateCallback<T = unknown> = (partialResult: AgentToolResult<T>) => void;
export interface ExtensionContext {
    [key: string]: unknown;
}
export interface ExtensionCommandContext {
    ui: {
        notify(message: string, level?: string): void;
    };
    [key: string]: unknown;
}
export interface ToolDefinition<TParams = unknown, TDetails = unknown> {
    name: string;
    label: string;
    description: string;
    promptSnippet?: string;
    promptGuidelines?: string[];
    parameters: TParams;
    renderShell?: "default" | "self";
    prepareArguments?: (args: unknown) => unknown;
    executionMode?: "sequential" | "parallel";
    execute(toolCallId: string, params: any, signal: AbortSignal | undefined, onUpdate: AgentToolUpdateCallback<TDetails> | undefined, ctx: ExtensionContext): Promise<AgentToolResult<TDetails>>;
}
export interface ExtensionAPI {
    on(event: string, handler: (...args: any[]) => any): void;
    registerTool<TParams = unknown, TDetails = unknown>(tool: ToolDefinition<TParams, TDetails>): void;
    registerCommand(name: string, options: {
        description?: string;
        handler: (...args: any[]) => any;
    }): void;
    onShutdown?(handler: () => Promise<void> | void): void;
}
