/**
 * Defined by Vite via define config
 */
declare const __APP_VERSION__: string;
declare const __IS_UNSTABLE__: boolean;

/**
 * Tampermonkey GM storage API
 */
declare function GM_setValue(name: string, value: string): void;
declare function GM_getValue(name: string, defaultValue?: string): string | undefined;
declare function GM_deleteValue(name: string): void;
