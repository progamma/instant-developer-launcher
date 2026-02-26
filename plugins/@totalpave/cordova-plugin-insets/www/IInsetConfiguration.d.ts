export interface IInsetConfiguration {
    /**
     * A bit mask of InsetMask
     *
     * @defaults DISPLAY_CUTOUT | SYSTEM_BARS
     */
    mask?: number;
    /**
     * If true, includes rounded corners in the inset information
     * Only available on Android API 31 ("S") and later.
     *
     * @defaults true
     */
    includeRoundedCorners?: boolean;
}
