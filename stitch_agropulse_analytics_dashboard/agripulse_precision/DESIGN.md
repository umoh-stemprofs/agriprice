---
name: AgriPulse Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3f493f'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6f7a6e'
  outline-variant: '#becabc'
  surface-tint: '#006d30'
  primary: '#00652c'
  on-primary: '#ffffff'
  primary-container: '#15803d'
  on-primary-container: '#d3ffd5'
  inverse-primary: '#79db8d'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#854600'
  on-tertiary: '#ffffff'
  tertiary-container: '#a95b00'
  on-tertiary-container: '#fff1e9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#95f8a7'
  primary-fixed-dim: '#79db8d'
  on-primary-fixed: '#00210a'
  on-primary-fixed-variant: '#005323'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  metric-numeral:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.03em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-tabular:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.25rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style
The design system establishes a high-performance, clinical-grade interface engineered for agricultural enterprise operations, agronomy intelligence, and field-level telemetry. The aesthetic merges precision minimalism with utilitarian clarity, stripping away visual noise to allow critical metric shifts, crop health indices, and predictive harvest models to command immediate operator attention.

Rooted in a refined Border-Focused Minimalist architecture, the system replaces decorative elements and heavy surface elevation with disciplined hairline structural dividers, generous negative space, and crisp typographic weight distribution. The resulting operational tone is dependable, objective, and surgically precise—evoking the reliability of specialized industrial instrumentation combined with the ergonomics of a modern software workspace.

## Colors
The palette balances an organic botanical grounding with austere technical slate neutrals.

- **Canvas & Surface Architecture**:
  - Application Canvas: `#F8FAFC` (Off-white/slate baseline, eliminating eye fatigue in high-ambient-light farm office settings).
  - Surface/Card Fill: `#FFFFFF` (Pure flat white for distinct visual anchoring).
  - Hairline Boundaries: `#E2E8F0` (Default perimeter stroke) and `#CBD5E1` (Active/focused divider line).

- **Primary Action System**:
  - Primary Brand Accent: Deep Forest Green `#15803D` (Applied strictly to intentional user commits, primary triggers, and active system states).
  - Primary Hover: `#166534`.
  - Primary Active/Pressed: `#14532D`.
  - Subtle Primary Tint: `#DCFCE7` (Used for active row selections and background pill badges).

- **Telemetry & Status System**:
  - Optimal / Positive Yield: Muted Green `#16A34A` (Indicator text/dot), `#F0FDF4` (Background tint).
  - Moderate / Warning / Soil Stress: Warm Amber `#D97706` (Indicator text/dot), `#FEF3C7` (Background tint).
  - Stressed / Depleted / Yield Loss: Muted Crimson `#DC2626` (Indicator text/dot), `#FEF2F2` (Background tint).

- **Typography & Content Hierarchy**:
  - Primary Readout / High-Contrast Headings: `#0F172A` (Deep Slate).
  - Secondary Metadata / Labels / Units: `#64748B` (Muted Slate).
  - Disabled / Watermark Labels: `#94A3B8`.

## Typography
Typographic discipline underpins the interface's information density. The dual pairing of **Plus Jakarta Sans** for structural headers and **Inter** for core analytical readouts provides both architectural elegance and data readability.

- **Tabular Figures & Metrics**: All quantitative outputs (acreage, yield percentages, soil moisture indices, flow rates) must strictly enforce OpenType tabular figures (`font-variant-numeric: tabular-nums;`). This prevents column jitter during real-time data polling.
- **Micro-Labels**: The `label-sm` style uses uppercase transformations paired with `0.04em` tracking for sensor tags, quadrant identifiers, and telemetry status headings.
- **Hierarchy Rules**: Primary metrics pair an oversized `metric-numeral` value directly with an adjacent `label-sm` baseline indicator to prioritize scan speed across dense analytical grids.

## Layout & Spacing
The layout follows an adaptive 12-column analytical grid tuned for continuous monitoring displays, tablets, and ruggedized fieldwork screens.

- **Breakpoints**:
  - `Mobile` (< 768px): 4-column layout, `1rem` outer canvas margins, `0.75rem` vertical cell stack gaps.
  - `Tablet` (768px – 1024px): 8-column layout, `1.5rem` outer margins, `1rem` gutter.
  - `Desktop / Command Hub` (> 1024px): 12-column layout, `2rem` outer margins, `1.5rem` fluid gutters. Maximum layout clamp: `1600px` for ultra-wide dashboards to preserve horizontal visual tracking.

- **Spacing Cadence**:
  - Component padding utilizes an 8px base rhythm: internal card padding is anchored to `space-lg` (24px) on desktop and `space-base` (16px) on compact screens.
  - Tight spatial coupling (`space-xs` to `space-sm`) binds descriptive labels to their corresponding telemetry digits, preventing detached readouts.

## Elevation & Depth
In alignment with the border-focused minimalist doctrine, the design system eliminates traditional soft drop shadows and layered blur treatments. Depth is achieved entirely through clean boundaries, contrasting surface fills, and hairline framing.

- **Structural Framing**:
  - Baseline Depth: Surface containers employ a single `1px solid #E2E8F0` border against the `#F8FAFC` foundation.
  - Interactive Hover / Focus: Upon pointer intersection, interactive cards do not cast a drop shadow; instead, their perimeter border transitions cleanly to `#CBD5E1`, signaling tactile readiness.
- **Modal & Popover Layering**:
  - Floating command palettes, filter flyouts, and calibration dialogs float on `#FFFFFF` surfaces defined by a crisp `1px solid #CBD5E1` boundary paired with an ultra-faint ambient offset (`box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05)`). No heavy diffusion or skeuomorphic gradients are permitted.

## Shapes
The visual geometry standardizes on a measured 8px radius (`0.5rem` / roundedness level `2`), offering a modern edge profile that balances engineered precision with contemporary software standards.

- **Standard Cards & Containers**: Fixed at `8px` (`0.5rem`).
- **Input Fields & Action Controls**: Standardized at `6px` to `8px` for geometric cohesion.
- **Status Indicators & Micro-Chips**: `4px` corner radius for structured tabular chips, or fully circular (`9999px`) exclusively for live telemetry ping indicators.
- **No pill-shaped controls**: Action buttons, tabs, and filters maintain unified geometric angles without bulbous extremities.

## Components

### Buttons & Interactive Triggers
- **Primary Action**: Solid `#15803D` background, `#FFFFFF` text (`label-md`), `0.5rem` border-radius, zero border. Hover transitions to `#166534`. Active press shifts to `#14532D`.
- **Secondary Button**: `#FFFFFF` background, `1px solid #E2E8F0`, `#0F172A` text. Hover shifts to `#F8FAFC` background and `#CBD5E1` border.
- **Tertiary / Utility**: Background transparent, `#64748B` text, padding `space-xs space-sm`. Hover introduces `#F1F5F9` background and `#0F172A` text color.

### Data Cards & Telemetry Containers
- **Anatomy**: Base `#FFFFFF` background, `1px solid #E2E8F0` perimeter border, `8px` radius, padding `space-lg`.
- **Header Structure**: Left-aligned upper section featuring `label-sm` in `#64748B`, uppercase tracking, paired with right-aligned action icon or contextual live dot.
- **KPI Readout**: `metric-numeral` anchored below the label, accompanied by inline trend indicator pill.

### Status Badges & Telemetry Chips
- **Geometry**: Compact padding (`2px 8px`), `4px` border-radius, `label-sm` font.
- **Optimal State**: Background `#F0FDF4`, border `1px solid #BBF7D0`, text `#15803D`. Live dot: solid `#16A34A`.
- **Warning / Moderate State**: Background `#FEF3C7`, border `1px solid #FDE68A`, text `#B45309`. Live dot: solid `#D97706`.
- **Critical / Loss State**: Background `#FEF2F2`, border `1px solid #FECACA`, text `#DC2626`. Live dot: solid `#DC2626`.

### Form Fields & Filter Menus
- **Text Inputs**: `#FFFFFF` surface, `1px solid #E2E8F0`, `6px` radius, internal padding `0.5rem 0.75rem`. Text color `#0F172A`, placeholder `#94A3B8`.
- **Focus State**: `1px solid #15803D` boundary with a matching `0 0 0 1px #15803D` ring highlight.
- **Drop-down Selectors**: Matching form input specs with a minimal slate arrow chevron right-aligned.

### Selection Controls (Checkboxes & Radios)
- **Checkbox**: `16px x 16px` dimension, `4px` corner radius, `1px solid #CBD5E1` rest state. Checked state: `#15803D` fill with white `2px` check icon.
- **Radio Button**: `16px x 16px` dimension, full circle, `1px solid #CBD5E1` perimeter. Checked state: `#FFFFFF` fill with an inset `6px` centered dot of `#15803D` bordered by `#15803D`.

### Analytical Data Tables
- **Header Row**: `#F8FAFC` background fill, `1px solid #E2E8F0` bottom boundary, `label-sm` text color `#64748B`, non-bold uppercase tracking.
- **Data Rows**: `#FFFFFF` background, `1px solid #F1F5F9` bottom divider, `body-md` typography. Numerical columns strictly right-aligned with `code-tabular` weights.
- **Row Interaction**: Hover state tints row to `#F8FAFC`; selected row applies `#F0FDF4` tint with a left inset `3px` marker in `#15803D`.

### Specialized Agri-Analytics Elements
- **Soil Moisture / Canopy Bar Gauges**: Segmented horizontal track, `6px` track height, `#E2E8F0` trough background, fill dictated strictly by status color tokens (`#16A34A`, `#D97706`, `#DC2626`).
- **Field Parcel Polygon Badges**: Outlined square tag (`1px solid #E2E8F0`) containing sector ID (`body-sm`, bold) paired with a `6px` circular health state ping.