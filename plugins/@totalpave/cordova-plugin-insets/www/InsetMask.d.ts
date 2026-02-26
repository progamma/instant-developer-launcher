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
export declare enum InsetMask {
    CAPTION_BAR = 1,
    DISPLAY_CUTOUT = 2,
    IME = 4,
    MANDATORY_SYSTEM_GESTURES = 8,
    NAVIGATION_BARS = 16,
    STATUS_BARS = 32,
    SYSTEM_BARS = 64,
    SYSTEM_GESTURES = 128,
    TAPPABLE_ELEMENT = 256
}
