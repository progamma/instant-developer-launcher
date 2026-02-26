import { IInsetConfiguration } from './IInsetConfiguration';
import { IInsetCallbackFunc } from './IInsetCallbackFunc';
import { IInset } from './IInset';
export declare const SERVICE_NAME: string;
export declare class Inset {
    private $currentInset;
    private $listeners;
    private $id;
    private constructor();
    /**
     * Gets the native identifier
     *
     * @returns
     */
    getID(): string;
    /**
     * Gets the last emitted inset information
     *
     * @returns
     */
    getInsets(): IInset;
    getInset(): IInset;
    /**
     * See the static Inset.free method for details
     *
     * This is the equivilant of calling Inset.free(insetInstance)
     *
     * @returns
     */
    free(): Promise<void>;
    /**
     * Adds a listener to this inset configuration.
     *
     * Note that this may fire even if nothing has actually
     * changed.
     *
     * Retain the listener reference to remove it later if
     * necessary.
     *
     * @param listener
     */
    addListener(listener: IInsetCallbackFunc): void;
    /**
     * Frees the listener reference
     *
     * @param listener
     */
    removeListener(listener: IInsetCallbackFunc): void;
    private $onUpdate;
    private static $generateID;
    /**
     * Configures a new Inset instance to listen for inset changes
     * It's valid to have multiple instances, with different configurations
     * Each instance may have 0-to-many listeners attached via addListener
     *
     * If this instance is no longer needed/used, call `free` to free
     * resources.
     *
     * It will be more performant to keep the instance count low. If only one
     * configuration set is needed, then it would be recommended to create a
     * single instance and share it rather than every object having it's own
     * inset listener instance.
     *
     * @param config
     * @returns
     */
    static create(config: IInsetConfiguration): Promise<Inset>;
    /**
     * Frees the native resources associated with the given
     * inset.
     *
     * After freeing, the inset is no longer usable and it will
     * not receive anymore inset updates. If you retain any
     * references to inset listeners, they should also be dereferenced
     * to allow for garbage collection.
     *
     * This is the equivilant of calling `await inset.free()`
     *
     * @param inset
     * @returns
     */
    static free(inset: Inset | string): Promise<void>;
    private static $isInitEvent;
    private static $isUpdateEvent;
}
declare global {
    interface ITotalpave {
        Inset: Inset;
    }
    interface Window {
        totalpave: ITotalpave;
    }
}
