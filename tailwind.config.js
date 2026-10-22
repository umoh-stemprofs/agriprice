/**
 * AgriPulse Precision tokens, taken from stitch_agropulse_analytics_dashboard:
 * - the palette + component specs in agripulse_precision/DESIGN.md
 * - the colour map Stitch actually emitted in each screen's generated HTML.
 *
 * Plain JS on purpose: postcss-load-config 6 evaluates a .ts config as plain
 * JavaScript, so an `import type` line throws and the whole config is dropped.
 *
 * Depth is hairline borders only - no drop shadows on cards (DESIGN.md,
 * "Elevation & Depth"). Every quantitative readout uses tabular figures.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Canvas & surfaces */
        canvas: "#F4F7FB",
        surface: {
          DEFAULT: "#FFFFFF",
          low: "#FAFCFF",
          lower: "#F8FAFC",
          dim: "#F1F5F9",
          container: "#EFF4FF",
        },
        /* Hairline structure */
        line: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
          soft: "#F1F5F9",
        },
        /* Text */
        ink: {
          DEFAULT: "#0F172A",
          muted: "#64748B",
          faint: "#94A3B8",
        },
        /* Brand action system */
        brand: {
          DEFAULT: "#15803D",
          hover: "#166534",
          active: "#14532D",
          tint: "#DCFCE7",
          tintline: "#86EFAC",
          soft: "#F0FDF4",
          softline: "#BBF7D0",
          deep: "#00652C",
        },
        /* Telemetry status */
        optimal: { DEFAULT: "#16A34A", text: "#15803D", bg: "#F0FDF4", line: "#BBF7D0" },
        warn: { DEFAULT: "#D97706", text: "#B45309", bg: "#FEF3C7", line: "#FDE68A" },
        loss: { DEFAULT: "#DC2626", text: "#DC2626", bg: "#FEF2F2", line: "#FECACA" },
        info: { DEFAULT: "#0369A1", text: "#075985", bg: "#F0F9FF", line: "#BAE6FD" },
      },
      borderRadius: {
        chip: "4px",
        input: "6px",
        card: "8px",
        panel: "12px",
        shell: "16px",
      },
      boxShadow: {
        /* Only floating layers get the ultra-faint ambient offset. */
        pop: "0 4px 12px rgba(15, 23, 42, 0.05)",
        lift: "0 1px 2px rgba(15, 23, 42, 0.04)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        /* DESIGN.md type scale */
        metric: ["30px", { lineHeight: "36px", letterSpacing: "-0.03em", fontWeight: "600" }],
        "metric-sm": ["24px", { lineHeight: "30px", letterSpacing: "-0.02em", fontWeight: "600" }],
      },
      maxWidth: {
        /* Keep horizontal visual tracking on ultra-wide dashboards. */
        board: "1600px",
      },
    },
  },
  plugins: [],
};
