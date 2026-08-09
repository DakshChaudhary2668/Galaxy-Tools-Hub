# GALAXY TOOLS HUB: DESIGN SYSTEM SPECIFICATION — ANPS
> **Version:** 1.0.0-alpha
> **Role:** Master Design System Definition — Industrial Premium
> **Theme:** Industrial Premium / Aeronautical Light Mode
> **Platform:** Android / Mobile Web (4-column fluid grid)

---

## SECTION 1: SYSTEM ARCHETYPE & HIGH-DENSITY DESIGN TOKENS

This document defines the complete "Galaxy Tools Hub Industrial Premium" design system. It serves as the canonical token reference for all mobile/Android screens in the Galaxy Tools Hub e-commerce platform, engineered for the industrial/B2B sector.

### 1.1 Brand & Style

The design system is engineered for the **Industrial Premium** sector, catering to professionals who demand precision, durability, and high-performance equipment. The brand personality is authoritative and functional, evoking the feeling of a high-end workshop or an aerospace facility.

The visual style is a hybrid of **Minimalism** and **Modern Corporate**, utilizing heavy whitespace to emphasize technical clarity. It avoids decorative flourishes in favor of structural integrity.

### 1.2 Layout Architecture
- **Grid System:** 4-column fluid grid for mobile with 12px gutters and 16px outer margins.
- **Vertical Rhythm:** 4px baseline grid. All spacing in multiples of 4 (8, 12, 16, 24, 32).
- **Safe Zones:** All touch targets minimum 48x48dp.
- **Sticky Elements:** Bottom bars for primary actions; TopAppBar sticky at 56px.

### 1.3 Complete Color Token Map

```yaml
color_tokens:
  # Surface System
  surface: "#F9F9F9"
  surface-dim: "#DADADA"
  surface-bright: "#F9F9F9"
  surface-container-lowest: "#FFFFFF"
  surface-container-low: "#F3F3F3"
  surface-container: "#EEEEEE"
  surface-container-high: "#E8E8E8"
  surface-container-highest: "#E2E2E2"
  surface-variant: "#E2E2E2"
  surface-tint: "#705D00"
  
  # On-Surface System
  on-surface: "#1A1C1C"
  on-surface-variant: "#4D4732"
  on-background: "#1A1C1C"
  background: "#F9F9F9"
  
  # Inverse System
  inverse-surface: "#2F3131"
  inverse-on-surface: "#F1F1F1"
  inverse-primary: "#E9C400"
  
  # Primary System
  primary: "#705D00"
  on-primary: "#FFFFFF"
  primary-container: "#FFD700"        # Golden Yellow — Primary CTA
  on-primary-container: "#705E00"
  primary-fixed: "#FFE16D"
  primary-fixed-dim: "#E9C400"
  on-primary-fixed: "#221B00"
  on-primary-fixed-variant: "#544600"
  
  # Secondary System
  secondary: "#5F5E5E"
  on-secondary: "#FFFFFF"
  secondary-container: "#E5E2E1"
  on-secondary-container: "#656464"
  secondary-fixed: "#E5E2E1"
  secondary-fixed-dim: "#C8C6C5"
  on-secondary-fixed: "#1C1B1B"
  on-secondary-fixed-variant: "#474646"
  
  # Tertiary System
  tertiary: "#00696F"
  on-tertiary: "#FFFFFF"
  tertiary-container: "#00F1FF"
  on-tertiary-container: "#006A70"
  tertiary-fixed: "#79F5FF"
  tertiary-fixed-dim: "#00DBE8"
  on-tertiary-fixed: "#002022"
  on-tertiary-fixed-variant: "#004F54"
  
  # Error System
  error: "#BA1A1A"
  on-error: "#FFFFFF"
  error-container: "#FFDAD6"
  on-error-container: "#93000A"
  
  # Outline System
  outline: "#7E775F"
  outline-variant: "#D0C6AB"
```

### 1.4 Typography Matrix

```yaml
typography:
  headline-lg:
    family: "Roboto"
    size: 32px
    weight: 700
    line-height: 40px
    letter-spacing: -0.5px
    
  headline-lg-mobile:
    family: "Roboto"
    size: 28px
    weight: 700
    line-height: 36px
    
  headline-md:
    family: "Roboto"
    size: 24px
    weight: 600
    line-height: 32px
    
  body-lg:
    family: "Roboto"
    size: 16px
    weight: 400
    line-height: 24px
    
  body-md:
    family: "Roboto"
    size: 14px
    weight: 400
    line-height: 20px
    
  label-caps:
    family: "Roboto"
    size: 12px
    weight: 700
    line-height: 16px
    letter-spacing: 1px
    
  tech-data:
    family: "Noto Sans Mono"
    size: 13px
    weight: 500
    line-height: 18px
```

### 1.5 Border Radius Tokens

```yaml
rounded:
  sm: 0.125rem    # 2px
  DEFAULT: 0.25rem # 4px
  md: 0.375rem    # 6px
  lg: 0.5rem      # 8px
  xl: 0.75rem     # 12px
  full: 9999px    # Pill/Circle
```

### 1.6 Spacing Tokens

```yaml
spacing:
  unit: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  margin: 16px
  gutter: 12px
  columns: 4
```

---

## SECTION 2: COMPONENT DESIGN RULES

### 2.1 Buttons
- **Primary:** Solid `#111111` background with white text. High-priority action buttons may use `#FFD700` accent with `#111111` text.
- **Secondary:** Outlined with 1px `#111111` or `#E0E0E0`.

### 2.2 Circular Badges
- Thin 1px outline of `#FFD700` with white or accent background depending on state.

### 2.3 Collapsible Accordions
- Flat with 1px bottom border. Chevron-down for expansion. Header text: `body-md` Bold.

### 2.4 Sticky Bottom Bars
- Anchored to viewport bottom. Contains primary industrial action (e.g., Add to Order, Confirm Specs).
- Design: Solid `#FFFFFF` with 1px top border `#E0E0E0` or subtle soft shadow.

### 2.5 Multi-Step Progress Indicators
- Linear, top-aligned. Active steps: solid `#FFD700` circle. Inactive: `#E0E0E0` hollow circle.
- Connecting lines: 2dp thick.

### 2.6 Input Fields
- Label in `label-caps`. Bordered on four sides with 1px `#E0E0E0` stroke.
- Active state: 2px `#FFD700` bottom border or focus ring.

---

## SECTION 3: ELEVATION & DEPTH

- **Surfaces:** `#F4F4F4` for secondary containers; differentiate from white canvas.
- **Borders:** 1px solid `#E0E0E0` for cards and section dividers.
- **Elevation:** Only for floating action buttons or transient menus. "Hard Shadow" style: low blur (2-4px), high opacity (15-20% black).

---

## SECTION 4: SEMANTIC COLOR APPLICATION

| Semantic | Color | Usage |
| :--- | :--- | :--- |
| **Success / Available** | `#34C759` | In-stock badges, success states |
| **Warning / Pending** | `#FF9500` | Maintenance, verification pending |
| **Error / Failure** | `#FF3B30` | Out of stock, system failures |
| **Accent / CTA** | `#FFD700` | Primary CTAs, active states, focus rings |

---

## SECTION 5: IMPLEMENTATION DIRECTION FOR GRAPHICS AGENTS

1. **Step 1:** Canvas Base — Clean `#FFFFFF` or `#F9F9F9` background for high readability.
2. **Step 2:** Typography Hierarchy — Heavy weights (600+) for headlines; `label-caps` for section overlines.
3. **Step 3:** Golden Thread — Use `#FFD700` sparingly but impactfully — only for CTAs, active focus, and progress indicators.
4. **Step 4:** Monospace Technical Data — All SKUs, serial numbers, UTR refs, and dimensions in `Noto Sans Mono`.
5. **Step 5:** Elevation Discipline — Avoid heavy shadows; use tonal layers and border outlines for depth.
