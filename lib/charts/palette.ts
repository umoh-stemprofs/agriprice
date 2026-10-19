/**
 * Chart tokens (docs/design.md §4): color-blind safe series colours, light
 * gridlines, axis text at least 12 px. One place so every chart in the app
 * looks the same and re-checking contrast is a single edit.
 */

export const SERIES_COLORS = ["#0072B2", "#E69F00", "#009E73", "#D55E00", "#CC79A7", "#56B4E9"] as const;

/** The rolled-up tail slice of a pie. Deliberately not in the series colours. */
export const OTHER_COLOR = "#98A2B3";

export const GRID_COLOR = "#E4E7EC";

/** Chart axis text: 12 px minimum, muted text colour. */
export const AXIS_TICK = { fontSize: 12, fill: "#475467" } as const;
