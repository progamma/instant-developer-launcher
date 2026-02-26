export interface IInsetsAPI {
    addListener: (callback: IInsetCallbackFunc) => void;
    removeListener: (callback: IInsetCallbackFunc) => void;
    getInsets: () => IInsets;
}
declare global {
    interface ITotalpave {
        Insets: IInsetsAPI;
    }
    interface Window {
        totalpave: ITotalpave;
    }
}
export declare const SERVICE_NAME: string;
export interface IInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export type IInsetCallbackFunc = (inset: IInsets) => void;
declare class InsetsAPI implements IInsetsAPI {
    private initPromise;
    private listeners;
    private insets;
    /**
     * Initializes javascript side of the plugin.
     *
     * This function is called automatically on deviceready.
     * @internal
     */
    __init(): Promise<void>;
    addListener(callback: IInsetCallbackFunc): void;
    removeListener(callback: IInsetCallbackFunc): void;
    /**
     * @returns Last emitted insets.
     */
    getInsets(): IInsets;
}
export declare const Insets: InsetsAPI;
export {};
