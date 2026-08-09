# Screen 02: Product Detail Page (PDP) — G-Tech GT95XX
> **Images:** `02_pdp_gt95xx_desktop.png` · `02_pdp_gt95xx_mobile.png`  
> **Route:** `/product/:slug` (e.g., `/product/g-tech-gt95xx-insulation-tester`)  
> **Priority:** P0 — Primary conversion screen

---

## Layout Structure

### Desktop (≥1280px)
```
┌─────────────────────────────────────────────────────────────────┐
│ Announcement Bar + Header (same as Home)                        │
├─────────────────────────────────────────────────────────────────┤
│ Home > Testing Equipment > Insulation Testers   ← Breadcrumbs  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────────────────────────┐ ┌────────────────────────┐    │
│ │        60% — GALLERY         │ │   40% — BUY PANEL      │    │
│ │                              │ │                        │    │
│ │  ┌────────────────────────┐  │ │ [G-TECH Logo] SKU:XX   │    │
│ │  │   [IN STOCK]           │  │ │                        │    │
│ │  │                        │  │ │ Professional Digital   │    │
│ │  │   [Main Product Image] │  │ │ Insulation Tester      │    │
│ │  │   4:3 on #F5F5F7       │  │ │ ★★★★☆ 48 Reviews      │    │
│ │  │                        │  │ │                        │    │
│ │  └────────────────────────┘  │ │ ₹12,450                │    │
│ │  [T1●] [T2] [T3] [▶T4]     │ │ Incl. GST & Shipping   │    │
│ │                              │ │                        │    │
│ └──────────────────────────────┘ │ TEST VOLTAGE RANGE     │    │
│                                  │ [250V●] [500V] [Solar] │    │
│                                  │                        │    │
│                                  │ DIAGNOSTIC CAPABILITY  │    │
│                                  │ [Standard] [PI/DAR●]   │    │
│                                  │                        │    │
│                                  │ ⚡CAT IV | ⚡20GΩ | 🔋  │    │
│                                  │                        │    │
│                                  │ [🛒 ADD TO CART]       │    │
│                                  │ [⚡ BUY NOW]           │    │
│                                  │ [Request Bulk Quote]   │    │
│                                  │                        │    │
│                                  │ ✓1YR | ↩7DAY | 📞24/7 │    │
│                                  └────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│ Technical Specifications (max-width 896px, zebra table)        │
├─────────────────────────────────────────────────────────────────┤
│ Footer                                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)
- Gallery: Full-width, aspect ratio 1:1 or 4:3, swipeable carousel with dots
- Thumbnails: Horizontal scroll row below main image
- Buy panel: Full-width below gallery
- Variant chips: Horizontal wrap
- CTAs: Full-width stacked buttons
- Spec table: Full-width, horizontal scroll if needed
- Consider sticky bottom bar with "ADD TO CART" (reference: Android wireframe pattern)

---

## Component Specifications

### Breadcrumbs
- Font: `body-sm`
- Separator: `chevron_right` icon, 16px
- Last item: `color: primary`, `font-weight: 500`
- Other items: `color: on-surface-variant`, hover → `color: primary`

### Product Gallery (60% width)
- **Main image:** Aspect ratio 4:3, `background: #F5F5F7`, `border: 1px solid outline-variant`
  - `padding: stack-lg`, `overflow: hidden`
  - Image: `object-fit: contain`, `mix-blend-mode: multiply`, `drop-shadow: xl`
  - "In Stock" badge: Absolute `top: 16px left: 16px`, `bg: primary`, `color: on-primary`, 10px bold uppercase
- **Thumbnail row:** 4 thumbnails, 80×80px each, `gap: 8px`
  - Active: `border: 2px solid primary`
  - Inactive: `border: 1px solid outline-variant`, hover → `border-color: primary`
  - Video thumbnail: 50% opacity image with `play_circle` overlay icon

### Buy Panel (40% width)
- **Brand row:** Logo image (32px height) + SKU badge (`technical-data` font, `surface-container` bg, `1px solid outline-variant`)
- **Title:** `headline-lg` (32px), bold
- **Rating:** Star icons (18px, filled gold `secondary-container`), half-star last, review count as underlined text
- **Price:** `display-lg` (48px), bold
- **GST note:** `body-sm`, `on-surface-variant`, uppercase, wide tracking

### Variant Selectors
- **Group label:** `label-caps`, `on-surface-variant`, uppercase, `margin-bottom: 8px`
- **Active chip:** `border: 2px solid primary`, `bg: primary-fixed`, `color: primary`, `font-weight: 500`
- **Inactive chip:** `border: 1px solid outline-variant`, `bg: surface`, `color: on-surface`
- Hover: `border-color: primary`, `bg: surface-container-low`
- Info icon (optional): 14px, inline-end

### Key Specs Strip
- Background: `surface-container-low`
- Border: `1px solid outline-variant`, `rounded: sm`
- Content: Horizontal flex-wrap, `space-between`, `technical-data` font
- Each spec: Icon (16px, `outline` color) + text

### Action Buttons (stacked)
1. **ADD TO CART:** `bg: secondary-container` (#FCD400), `color: on-secondary-container`, bold, `border-bottom: 2px solid secondary`
2. **BUY NOW:** `bg: primary` (#000), `color: on-primary`, bold, hover → `border-bottom: 2px solid secondary-container`
3. **Bulk Quote:** Outlined, `border: 1px solid primary`, `color: primary`, hover → `bg: surface-container-low`

### Trust Badges Row
- Horizontal `space-between`, `padding-top: 16px`, `border-top: 1px solid outline-variant`
- Font: `label-caps`, `on-surface-variant`
- Each: Icon (16px) + text (e.g., "1 YR WARRANTY")

### Technical Specifications Table
- Max-width: 896px
- Border: `1px solid outline-variant`, `rounded: sm`, `overflow: hidden`
- Header column: 33% width, `font-weight: 700`, `on-surface`
- Value column: `on-surface-variant`
- Zebra striping: Alternating `surface-container-low` / transparent
- Font: `technical-data` (monospace)

---

## Interaction States

| Element | Trigger | Effect |
|---|---|---|
| Thumbnail | Click | `border: 2px solid primary`, updates main image |
| Variant chip | Click | Toggles active/inactive state, may update price |
| ADD TO CART | Hover | `background: secondary-fixed` (#FFE16D) |
| BUY NOW | Hover | `border-bottom: 2px solid secondary-container` |
| Bulk Quote | Hover | `background: surface-container-low` |
| Main image | — | `mix-blend-mode: multiply` on light bg |

---

## Data Fields

| Field | Type | Example |
|---|---|---|
| Brand logo | Image URL | G-Tech logo |
| SKU | String | "GT-95XX-PRO" |
| Product name | String | "Professional Digital Insulation Tester" |
| Rating | Float | 4.5 |
| Review count | Integer | 48 |
| Price | Currency (INR) | ₹12,450 |
| Tax note | String | "Incl. GST & Shipping" |
| Variant groups | Array<{ label, options[] }> | Test Voltage, Diagnostic Capability |
| Key specs | Array<{ icon, value }> | CAT IV 600V, Up to 20GΩ, Li-ion |
| Spec table rows | Array<{ label, value }> | Technical specification key-value pairs |
| Stock status | Enum | IN_STOCK, LOW_STOCK, SPECIAL_ORDER |
