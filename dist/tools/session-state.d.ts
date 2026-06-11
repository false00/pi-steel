type SessionGetter = (() => Promise<string> | string) | string;
export type SessionStateLike = {
    url?: SessionGetter;
    title?: SessionGetter;
    getCurrentUrl?: () => Promise<string> | string;
};
export declare function readSessionUrl(session: SessionStateLike): Promise<string>;
export declare function readSessionTitle(session: SessionStateLike): Promise<string>;
export declare function isBlankPageUrl(url: string): boolean;
export declare function freshSessionHint(): string;
export declare function blankPageError(action: string): Error;
export declare function describeBlankPage(url: string): string;
export {};
