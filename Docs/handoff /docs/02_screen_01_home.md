# Screen 01: Home / Landing Page
> **Images:** `01_home_desktop.png` · `01_home_mobile.png`  
> **Route:** `/` or `/home`  
> **Priority:** P0 — Primary entry point

---

## Layout Structure

### Desktop (≥1280px)
```
┌─────────────────────────────────────────────────────────────────┐
│ Announcement Bar (32px, golden #FCD400, centered text)          │
├─────────────────────────────────────────────────────────────────┤
│ Header Row 1: [Logo] [──── Search Bar ────] [👤] [🔔] [🛒•]   │
│ Header Row 2: Power Tools | Hand Tools | Testing▁| Measuring…  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌───────────────────┐ ┌───────────────────────────────────┐    │
│ │ INDUSTRIAL GRADE  │ │ ┌──────────┐ ┌──────────┐        │    │
│ │                   │ │ │ Brand 1  │ │ Brand 2  │        │    │
│ │ Professional      │ │ │ (hover   │ │ (hover   │        │    │
│ │ Grade Testing…    │ │ │  zoom)   │ │  zoom)   │        │    │
│ │                   │ │ └──────────┘ └──────────┘        │    │
│ │ [Explore →]       │ │                                   │    │
│ │ [Request Quote]   │ │                                   │    │
│ └───────────────────┘ └───────────────────────────────────┘    │
│         5 cols                    7 cols                        │
├─────────────────────────────────────────────────────────────────┤
│ (✓ISO) (🛡SECURE) (🏭OEM) (🔧CALIB) (⚖COMPL) (⚙PRECISE) …   │ ← Trust Badges
├─────────────────────────────────────────────────────────────────┤
│ FEATURED INSTRUMENTS                              VIEW ALL →   │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                   │
│ │ Card 1 │ │ Card 2 │ │ Card 3 │ │ Card 4 │  ← 4-col grid    │
│ └────────┘ └────────┘ └────────┘ └────────┘                   │
├─────────────────────────────────────────────────────────────────┤
│ Footer (dark #1C1B1B)                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)
- Announcement bar: same, but may wrap on narrow screens
- Header: Single row — [Logo] + [🛒] (search moves below or into menu)
- Nav links: Hidden, accessible via hamburger menu
- Hero: Full-width stacked — text block first, then image cards stacked vertically
- Trust badges: Horizontal scroll
- Product grid: 2 columns
- Footer: Stacked layout

---

## Component Specifications

### Announcement Bar
- Height: 32px fixed
- Background: `--secondary-container` (#FCD400)
- Text: `label-caps`, centered, with `local_shipping` icon (filled)
- Content: "FREE SHIPPING ON BULK ORDERS ABOVE ₹50,000 | GST INVOICE AVAILABLE"

### Header (Sticky)
- **Row 1:** Logo left, flex-1 search center (max-width 640px), action icons right
- **Row 2:** Category nav links, `label-caps`, uppercase, separated by 32px gap
- Active link: `color: primary`, `border-bottom: 2px solid secondary_container`, `font-weight: 700`
- Sticky at top with `z-index: 50`

### Search Bar
- Border: `1px solid #E5E5E7`
- Search icon: Left-inset at 12px
- Focus state: `border-color: primary`, `border-left: 2px solid #FFD700`

### Hero Section (12-col grid)
- **Left panel (5 cols):** `1px solid #E5E5E7` border, white bg, gradient overlay
  - Badge: "INDUSTRIAL GRADE" in `label-caps` on `secondary_container` bg
  - Title: `display-lg` (48px), uppercase
  - Body: `body-lg`, `on-surface-variant`, max-width 448px
  - CTAs: Primary dark button + tertiary outlined button
- **Right panel (7 cols):** 2×1 image grid
  - Each image: `1px solid #E5E5E7`, hover scale 1.05 (500ms)
  - Gradient overlay: `linear-gradient(transparent, rgba(0,0,0,0.6))`
  - Caption: Bottom-left, `headline-md` white + `technical-data` light grey

### Trust Badges
- Horizontal row, `space-between` on desktop, scrollable on mobile
- Each badge: 48px circle with `10px solid #FFD700` border, `primary-container` bg, white icon
- Label: `label-caps`, `on-surface-variant`
- Separated by `border-y: 1px solid outline-variant` with `padding-y: stack-md`

### Product Cards (4-col grid)
- **Status badge:** Absolute top-left, `surface-container` bg, `1px solid outline-variant`, 10px bold uppercase
- **Image area:** 192px height, `#F5F5F7` bg, `padding: 16px`, `border-bottom: 1px solid outline-variant`, `object-fit: contain`
- **Content:** `padding: 16px`
  - Category: `label-caps`, `on-surface-variant`
  - Name: `headline-md`, `primary`, `line-clamp: 2`
  - Price: `headline-md`, bold
  - CTA: Full-width golden button (`#FFD700` bg, `label-caps`, uppercase)
- **Spec strip:** Border-top, `surface` bg, `padding: 8px`, centered, `technical-data` font

### Footer
- Background: `primary-container` (#1C1B1B)
- Left: Brand text (`headline-md`, white) + copyright (`body-sm`, `on-primary-container`)
- Right: Link grid (flex-wrap, 32px gap-x, `body-sm`, `on-primary-container`)
- Link hover: `color: secondary-fixed` (#FFE16D)

---

## Interaction States

| Element | Trigger | Effect |
|---|---|---|
| Product card | Hover | `box-shadow: 0 4px 8px rgba(0,0,0,0.08)`, `translateY(-2px)` |
| Hero images | Hover | `scale: 1.05`, `transition: 500ms` |
| Primary button | Hover | `border-bottom: 2px solid #FFD700` |
| Search input | Focus | `border-color: #111`, `border-left: 2px solid #FFD700` |
| Nav link | Hover | `background: surface-container-low` |
| Footer links | Hover | `color: #FFE16D` |
| Icon buttons | Hover | `background: surface-container-low`, `border-radius: full` |

---

## Data & Content

| Field | Example Value | Source |
|---|---|---|
| Hero headline | "Professional Grade Testing & Soldering Instruments" | CMS |
| Hero body | "Equip your workforce with precision-engineered tools…" | CMS |
| Product name | "G-Tech GT91" | Product API |
| Product price | "₹1,622" | Product API |
| Spec strip | "6000 COUNTS \| AUTO RANGING" | Product API |
| Stock status | "IN STOCK" / "LEAD: 2 DAYS" / "SPECIAL ORDER" | Inventory API |
