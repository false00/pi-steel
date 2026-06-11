import { type ToolProgressUpdater } from "./tool-runtime.js";
export type CaptchaAwareSession = {
    id: string;
    captchasStatus?: () => Promise<unknown>;
    captchasSolve?: () => Promise<unknown>;
};
export type CaptchaRecoverySummary = {
    triggered: boolean;
    retries: number;
    solveAttempts: number;
    statusChecks: number;
    waitTimedOut: boolean;
};
type CaptchaRecoveryOptions<T> = {
    session: CaptchaAwareSession;
    context: string;
    actionLabel: string;
    onUpdate: ToolProgressUpdater;
    operation: () => Promise<T>;
    signal?: AbortSignal;
    shouldRetry?: (error: unknown) => boolean;
};
export declare function isCaptchaInterferenceError(error: unknown): boolean;
export declare function runWithCaptchaRecovery<T>(options: CaptchaRecoveryOptions<T>): Promise<CaptchaRecoverySummary>;
export {};
