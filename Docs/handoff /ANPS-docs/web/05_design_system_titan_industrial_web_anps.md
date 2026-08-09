# GALAXY TOOLS HUB: TITAN INDUSTRIAL DESIGN SYSTEM — ANPS (WEB)
> **Format Version:** 1.2.0-antigravity
> **Target Consumer:** UI/UX Generation Agents, Design Systems Compilers, and Google Stitch Engines
> **Project Identity:** Master Design System — Titan Industrial Architecture
> **Scope:** Desktop Web & Cross-Platform Responsive Standards

---

## 1. SYSTEM ARCHETYPE & DESIGN TOKENS

This document defines the complete **Titan Industrial** design system — the canonical design token specification for the Galaxy Tools Hub web application. It embodies **Industrial Premium** credibility and **Technical Brutalism**.

```yaml
system:
  project_name: "Titan Industrial Design System"
  archetype: "Industrial Premium, Technical Brutalism, Data-Dense B2B E-Commerce"
  viewport: { desktop_max: 1280px, tablet_max: 1024px, mobile_max: 767px }

layout_grid:
  desktop: { columns: 12, gutter: 24px, margin: 40px, max_width: 1280px }
  tablet: { columns: 8, gutter: 16px, margin: 24px }
  mobile: { columns: 4, gutter: 12px, margin: 16px }
  spacing_rhythm: 8px-based (base: 8px, stack_sm: 4px, stack_md: 16px, stack_lg: 32px)

color_tokens:
  canvas_base: "#FFFFFF"
  surface: "#F9F9FB"
  surface_dim: "#D9DADC"
  surface_bright: "#F9F9FB"
  surface_container_lowest: "#FFFFFF"
  surface_container_low: "#F3F3F5"
  surface_container: "#EEEEF0"
  surface_container_high: "#E8E8EA"
  surface_container_highest: "#E2E2E4"
  surface_variant: "#E2E2E4"
  surface_tint: "#5F5E5E"

  on_surface: "#1A1C1D"
  on_surface_variant: "#444748"
  on_background: "#1A1C1D"
  background: "#F9F9FB"

  inverse_surface: "#2F3132"
  inverse_on_surface: "#F0F0F2"
  inverse_primary: "#C8C6C5"

  primary: "#000000"                  # Ink Primary — Heavy, grounded foundation
  on_primary: "#FFFFFF"
  primary_container: "#1C1B1B"
  on_primary_container: "#858383"

  secondary: "#705D00"
  on_secondary: "#FFFFFF"
  secondary_container: "#FCD400"     # ★ Golden Yellow — Industrial Cautionary/Action Accent
  on_secondary_container: "#6E5C00"

  secondary_fixed: "#FFE16D"          # Lighter Gold — Hover state for golden CTAs
  secondary_fixed_dim: "#E9C400"
  on_secondary_fixed: "#221B00"
  on_secondary_fixed_variant: "#544600"

  tertiary: "#000000"
  on_tertiary: "#FFFFFF"
  tertiary_container: "#1B1B1D"
  on_tertiary_container: "#848385"

  error: "#BA1A1A"
  on_error: "#FFFFFF"
  error_container: "#FFDAD6"
  on_error_container: "#93000A"

  outline: "#747878"
  outline_variant: "#C4C7C7"

typography_matrix:
  display_lg: { family: "Roboto", size: 48px, weight: 700, leading: 56px, tracking: "-0.02em" }
  headline_lg: { family: "Roboto", size: 32px, weight: 700, leading: 40px }
  headline_lg_mobile: { family: "Roboto", size: 24px, weight: 700, leading: 32px }
  headline_md: { family: "Roboto", size: 20px, weight: 500, leading: 28px }
  body_lg: { family: "Roboto", size: 16px, weight: 400, leading: 24px }
  body_sm: { family: "Roboto", size: 14px, weight: 400, leading: 20px }
  label_caps: { family: "Roboto", size: 12px, weight: 700, leading: 16px, tracking: "0.08em" }
  technical_data: { family: "Noto Sans Mono", size: 13px, weight: 500, leading: 16px, tracking: "0.02em" }

shapes_radius:
  sm: 0.125rem    # 2px (Tags, status badges, chips)
  DEFAULT: 0.25rem # 4px (Standard buttons, inputs, cards)
  md: 0.375rem    # 6px (Elevated containers)
  lg: 0.5rem      # 8px (Modals, main product containers)
  full: 9999px    # Pill/Circle (Icon buttons, avatar circles)

elevation:
  level_0: "background: #FFFFFF or #F9F9FB (Flat)"
  level_1: "border: 1px solid #C4C7C7 (Outlined card)"
  level_2_hover: "box-shadow: 0px 4px 8px rgba(0,0,0,0.08); translateY(-2px)"
  cta_bolted: "solid Ink Primary (#000000) or Golden Yellow (#FCD400) background"
```

---

## 2. COMPONENT DESIGN STANDARDS

### 2.1 Primary & Secondary Buttons
- **Primary CTA:** Background `#000000`, text `#FFFFFF`, bold font. Hover state adds a `border-bottom: 2px solid #FCD400`.
- **Secondary CTA:** Background `#FCD400`, text `#111111`, bold font. High-visibility action for "ADD TO CART" or "Add to Quote." Hover transitions to `#FFE16D`.
- **Tertiary Button:** 1px border (`#000000`), transparent background. Hover adds `surface-container-low` background.

### 2.2 Product Cards & Spec Strips
- Cards feature a dedicated **Spec Strip** at the bottom rendered in `Noto Sans Mono` (e.g., "6000 COUNTS | AUTO RANGING").
- Image containers use `#F5F5F7` background to ensure crisp silhouette display.
- Card edges use 4px radius with 1px `#C4C7C7` border.

### 2.3 Status Tags & Chips
- Status tags ("IN STOCK", "LEAD: 2 DAYS") use uppercase `label-caps` in Roboto Bold at 10px with 2px radius corners (`rounded-sm`).

### 2.4 Form Inputs
- Boxed with 1px `#747878` or `#C4C7C7` border. Focus state changes border to `#000000` with a 2px `#FCD400` golden accent indicator.

### 2.5 Data Tables
- High-density zebra-striped layouts alternating between `#F3F3F5` and `#FFFFFF`. Headers rendered in Ink Primary (`#000000`) with white uppercase text.

---

## 3. DESIGN SYSTEM TOKEN ARCHITECTURE

```
                               ┌─────────────────────────┐
                               │ TITAN INDUSTRIAL SYSTEM │
                               └────────────┬────────────┘
                                            │
           ┌────────────────────────────────┼────────────────────────────────┐
           │                                │                                │
┌──────────▼──────────┐          ┌──────────▼──────────┐          ┌──────────▼──────────┐
│   COLOR SYSTEM      │          │  TYPOGRAPHY MATRIX  │          │  SHAPE & ELEVATION  │
├─────────────────────┤          ├─────────────────────┤          ├─────────────────────┤
│ Ink Primary (#000)  │          │ Roboto (UI Text)    │          │ 2px / 4px / 8px     │
│ Golden Yellow (#FCD)│          │ Noto Mono (Specs)   │          │ Outlined (Level 1)  │
│ Surface (#F9F9FB)   │          │ Label Caps (Tracked)│          │ Hover Lift (Level 2)│
└─────────────────────┘          └─────────────────────┘          └─────────────────────┘
```

---

## 4. IMPLEMENTATION DIRECTION FOR GRAPHICS & CODE AGENTS

1. **Brand Anchor:** Always ground pages with solid Ink Primary (`#000000`) structural elements.
2. **Caution Accent:** Apply Golden Yellow (`#FCD400`) strictly to high-priority action CTAs, focus indicators, active nav states, and status accents.
3. **Monospace Rigor:** All SKU identifiers, financial subtotals/taxes/totals, UTR references, and technical dimensions MUST use `Noto Sans Mono`.
4. **Architectural Elevation:** Avoid soft, heavy drop shadows; rely on 1px crisp borders (`#C4C7C7`) and subtle tonal background layers.
