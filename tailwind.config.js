/**
 * AgriPulse Precision tokens, taken from stitch_agropulse_analytics_dashboard:
 * - the palette + component specs in agripulse_precision/DESIGN.md
 * - the colour map, type scale and spacing cadence Stitch actually emitted in
 *   each screen's generated HTML.
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
          forest: "#064E3B",
        },
        /* Telemetry status */
        optimal: { DEFAULT: "#16A34A", text: "#15803D", bg: "#F0FDF4", line: "#BBF7D0" },
        warn: { DEFAULT: "#D97706", text: "#B45309", bg: "#FEF3C7", line: "#FDE68A" },
        loss: { DEFAULT: "#DC2626", text: "#DC2626", bg: "#FEF2F2", line: "#FECACA" },
        info: { DEFAULT: "#0369A1", text: "#075985", bg: "#F0F9FF", line: "#BAE6FD" },
        /* Accents the screens use for crop tiles, icons and chart series. */
        amber: {
          DEFAULT: "#D97706",
          deep: "#B45309",
          text: "#92400E",
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
        },
        sky: {
          DEFAULT: "#0284C7",
          deep: "#0369A1",
          50: "#F0F9FF",
          100: "#E0F2FE",
          200: "#BAE6FD",
          700: "#0C4A6E",
        },
        leaf: {
          DEFAULT: "#22C55E",
          deep: "#15803D",
          ink: "#047857",
          50: "#ECFDF5",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          600: "#16A34A",
          700: "#15803D",
          800: "#065F46",
        },
      },
      borderRadius: {
        chip: "4px",
        input: "6px",
        card: "8px",
        panel: "12px",
        shell: "16px",
        tile: "16px",
        hero: "24px",
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
        "display-lg": ["36px", { lineHeight: "44px", letterSpacing: "-0.025em", fontWeight: "700" }],
        "display-md": ["28px", { lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["24px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-md": ["20px", { lineHeight: "28px", letterSpacing: "-0.015em", fontWeight: "600" }],
        "headline-sm": ["16px", { lineHeight: "24px", letterSpacing: "-0.01em", fontWeight: "600" }],
        metric: ["30px", { lineHeight: "36px", letterSpacing: "-0.03em", fontWeight: "600" }],
        "metric-sm": ["24px", { lineHeight: "30px", letterSpacing: "-0.02em", fontWeight: "600" }],
        /* The oversized numerals the overview and storage screens use. */
        readout: ["44px", { lineHeight: "48px", letterSpacing: "-0.035em", fontWeight: "800" }],
        "readout-lg": ["56px", { lineHeight: "60px", letterSpacing: "-0.04em", fontWeight: "800" }],
        "readout-sm": ["36px", { lineHeight: "40px", letterSpacing: "-0.03em", fontWeight: "800" }],
        "label-md": ["13px", { lineHeight: "16px", letterSpacing: "0.01em", fontWeight: "500" }],
        "label-sm": ["11px", { lineHeight: "14px", letterSpacing: "0.04em", fontWeight: "600" }],
        code: ["13px", { lineHeight: "18px", letterSpacing: "0em", fontWeight: "500" }],
      },
      maxWidth: {
        /* Keep horizontal visual tracking on ultra-wide dashboards. */
        board: "1600px",
        /* The page column the desktop screens clamp to. */
        page: "1400px",
      },
      spacing: {
        /* DESIGN.md spacing cadence, named so the screens read literally. */
        "2xs": "0.125rem",
        xs: "0.25rem",
        sm: "0.5rem",
        md: "0.75rem",
        base: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "3rem",
      },
    },
  },
  plugins: [],
};
