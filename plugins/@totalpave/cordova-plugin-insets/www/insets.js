'use strict';

/*
   Copyright 2022-2024 Total Pave Inc.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
const SERVICE_NAME = "Inset";
class Inset {
    constructor() {
        this.$id = null;
        this.$listeners = [];
        this.$currentInset = {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        };
    }
    /**
     * Gets the native identifier
     *
     * @returns
     */
    getID() {
        return this.$id;
    }
    /**
     * Gets the last emitted inset information
     *
     * @returns
     */
    getInsets() {
        console.warn('getInsets() is deprecated, use getInset instead()', new Error().stack);
        return this.getInset();
    }
    getInset() {
        return this.$currentInset;
    }
    /**
     * See the static Inset.free method for details
     *
     * This is the equivilant of calling Inset.free(insetInstance)
     *
     * @returns
     */
    async free() {
        return await Inset.free(this);
    }
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
    addListener(listener) {
        this.$listeners.push(listener);
        listener(this.$currentInset);
    }
    /**
     * Frees the listener reference
     *
     * @param listener
     */
    removeListener(listener) {
        let idx = this.$listeners.indexOf(listener);
        if (idx > -1) {
            this.$listeners.splice(idx, 1);
        }
    }
    $onUpdate(insets) {
        this.$currentInset = insets;
        for (let i = 0; i < this.$listeners.length; i++) {
            this.$listeners[i](insets);
        }
    }
    static $generateID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
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
    static create(config) {
        return new Promise((resolve, reject) => {
            if (!config) {
                config = {};
            }
            if (cordova.platformId === 'ios') {
                let instance = new Inset();
                instance.$id = Inset.$generateID();
                resolve(instance);
                return;
            }
            let inset = new Inset();
            cordova.exec((e) => {
                if (Inset.$isInitEvent(e)) {
                    inset.$id = e.data;
                    resolve(inset);
                }
                else if (Inset.$isUpdateEvent(e)) {
                    inset.$onUpdate(e.data);
                }
            }, reject, SERVICE_NAME, "create", [config]);
        });
    }
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
    static free(inset) {
        let id = null;
        if (typeof inset === 'string') {
            id = inset;
        }
        else {
            id = inset.getID();
        }
        return new Promise((resolve, reject) => {
            if (cordova.platformId === 'ios') {
                resolve();
                return;
            }
            cordova.exec(() => {
                resolve();
            }, reject, SERVICE_NAME, "delete", [id]);
        });
    }
    static $isInitEvent(e) {
        return e.type === 'init';
    }
    static $isUpdateEvent(e) {
        return e.type === 'update';
    }
}

/*
   Copyright 2022 Total Pave Inc.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
/**
 * An enumeration of Inset Types.
 * These are mapped to android's native WindowInsetsCompat.TYPE
 *
 * See https://developer.android.com/reference/androidx/core/view/WindowInsetsCompat.Type
 * for more information.
 *
 * Note that the native constant values is an implementation detail,
 * therefore the values here isn't a direct mapping, but will be resolved
 * appropriately.
 */
exports.InsetMask = void 0;
(function (InsetMask) {
    InsetMask[InsetMask["CAPTION_BAR"] = 1] = "CAPTION_BAR";
    InsetMask[InsetMask["DISPLAY_CUTOUT"] = 2] = "DISPLAY_CUTOUT";
    InsetMask[InsetMask["IME"] = 4] = "IME";
    InsetMask[InsetMask["MANDATORY_SYSTEM_GESTURES"] = 8] = "MANDATORY_SYSTEM_GESTURES";
    InsetMask[InsetMask["NAVIGATION_BARS"] = 16] = "NAVIGATION_BARS";
    InsetMask[InsetMask["STATUS_BARS"] = 32] = "STATUS_BARS";
    InsetMask[InsetMask["SYSTEM_BARS"] = 64] = "SYSTEM_BARS";
    InsetMask[InsetMask["SYSTEM_GESTURES"] = 128] = "SYSTEM_GESTURES";
    InsetMask[InsetMask["TAPPABLE_ELEMENT"] = 256] = "TAPPABLE_ELEMENT";
})(exports.InsetMask || (exports.InsetMask = {}));

exports.Inset = Inset;
//# sourceMappingURL=insets.js.map
