import Steel from "steel-sdk";
import type { CaptchaSolveResponse, CaptchaStatusResponse } from "steel-sdk/resources/sessions";
import { type Page } from "playwright-core";
type SessionCreateOptions = Steel.SessionCreateParams;
type SessionGotoOptions = Parameters<Page["goto"]>[1];
type SessionWaitForSelectorOptions = Parameters<Page["waitForSelector"]>[1];
type SessionClickOptions = Parameters<Page["click"]>[1];
type SessionTypeOptions = Parameters<Page["type"]>[2];
type SessionScreenshotOptions = Parameters<Page["screenshot"]>[0];
type SessionPdfOptions = Parameters<Page["pdf"]>[0];
type SessionComputerParams = Steel.SessionComputerParams;
type SessionComputerResponse = Steel.SessionComputerResponse;
export interface LiveSteelSession {
    id: string;
    sessionViewerUrl: string;
    debugUrl: string;
    page: Page;
    goto: (url: string, options?: SessionGotoOptions) => Promise<unknown>;
    goBack: (options?: Parameters<Page["goBack"]>[0]) => Promise<unknown>;
    back: (options?: Parameters<Page["goBack"]>[0]) => Promise<unknown>;
    url: () => string;
    title: () => Promise<string>;
    waitForSelector: (selector: string, options?: SessionWaitForSelectorOptions) => Promise<unknown>;
    click: (selector: string, options?: SessionClickOptions) => Promise<unknown>;
    fill: (selector: string, text: string) => Promise<unknown>;
    type: (selector: string, text: string, options?: SessionTypeOptions) => Promise<unknown>;
    evaluate: <T>(fn: (...args: any[]) => T, ...args: any[]) => Promise<T>;
    locator: (selector: string) => ReturnType<Page["locator"]>;
    content: () => Promise<string>;
    screenshot: (options?: SessionScreenshotOptions) => Promise<unknown>;
    pdf: (options?: SessionPdfOptions) => Promise<unknown>;
    computer: (body: SessionComputerParams) => Promise<SessionComputerResponse>;
    captchasStatus: () => Promise<CaptchaStatusResponse>;
    captchasSolve: () => Promise<CaptchaSolveResponse>;
}
export interface SteelClientOptions {
    apiKey?: string | null;
    baseURL?: string;
    sessionTimeoutMs?: number;
    sessionCreateOptions?: Partial<SessionCreateOptions>;
}
export interface SessionRefreshOptions {
    useProxy?: boolean;
    proxyUrl?: string | null;
}
export declare function resolveSessionId(session: Record<string, unknown>): string | undefined;
export declare function resolveSessionConnectURL(session: Record<string, unknown>): string | undefined;
export declare function buildSessionConnectURL(session: Record<string, unknown>, apiKey?: string | null): string | undefined;
export declare function resolveSessionViewerURL(session: Record<string, unknown>, viewerBaseURL?: string): string | undefined;
export declare function sessionDetails(session: {
    id: string;
    sessionViewerUrl?: string | null;
}): {
    sessionId: string;
    sessionViewerUrl: string;
};
export declare class SteelClient {
    private static readonly DEFAULT_SESSION_TIMEOUT_MS;
    private readonly client;
    private readonly apiKey;
    private readonly sessionTimeoutMs;
    private readonly sessionCreateOptions;
    private readonly viewerBaseURL?;
    private currentSession;
    private readonly sessions;
    private creatingSession;
    constructor(apiKey?: string, options?: SteelClientOptions);
    getOrCreateSession(): Promise<LiveSteelSession>;
    getCurrentSessionId(): string | null;
    hasActiveSession(): boolean;
    isProxyConfigured(): boolean;
    refreshSession(options?: SessionRefreshOptions): Promise<LiveSteelSession>;
    closeSession(sessionId?: string): Promise<void>;
    closeAllSessions(): Promise<void>;
    private resolveSessionCreateOptions;
    private createSession;
    private buildLiveSession;
}
export {};
