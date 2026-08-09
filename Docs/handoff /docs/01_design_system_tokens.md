# Titan Industrial — Design System Token Reference
> **System Name:** Titan Industrial  
> **Version:** 1.0.0  
> **Status:** Canonical — All screens reference these tokens

---

## 1. Color Tokens

### 1.1 Surface System
```css
:root {
  /* Canvas & Containers */
  --surface:                  #F9F9FB;   /* Main page background */
  --surface-dim:              #D9DADC;   /* Pressed / dimmed states */
  --surface-bright:           #F9F9FB;   /* Elevated bright surface */
  --surface-container-lowest: #FFFFFF;   /* Cards, modals, inputs */
  --surface-container-low:    #F3F3F5;   /* Section backgrounds, zebra rows */
  --surface-container:        #EEEEF0;   /* Neutral containers */
  --surface-container-high:   #E8E8EA;   /* Elevated containers */
  --surface-container-highest:#E2E2E4;   /* Highest tonal elevation */
  --surface-variant:          #E2E2E4;   /* Alternate surface fills */
  --surface-tint:             #5F5E5E;   /* Tint overlay color */
  --background:               #F9F9FB;   /* Body background */
}
```

### 1.2 Content Colors (On-Surface)
```css
:root {
  --on-surface:               #1A1C1D;   /* Primary text, headlines */
  --on-surface-variant:       #444748;   /* Secondary text, labels */
  --on-background:            #1A1C1D;   /* Body text on background */
  --inverse-surface:          #2F3132;   /* Dark fills (footer, overlays) */
  --inverse-on-surface:       #F0F0F2;   /* Text on dark fills */
}
```

### 1.3 Brand Colors
```css
:root {
  /* Primary — Ink Black (Heavy, Grounded) */
  --primary:                  #000000;
  --on-primary:               #FFFFFF;
  --primary-container:        #1C1B1B;   /* Dark containers (footer, admin header) */
  --on-primary-container:     #858383;
  --inverse-primary:          #C8C6C5;

  /* Secondary — Industrial Gold (CTA Accent) */
  --secondary:                #705D00;
  --on-secondary:             #FFFFFF;
  --secondary-container:      #FCD400;   /* ★ GOLDEN YELLOW — Primary CTA accent */
  --on-secondary-container:   #6E5C00;

  /* Tertiary — Neutral Dark */
  --tertiary:                 #000000;
  --on-tertiary:              #FFFFFF;
  --tertiary-container:       #1B1B1D;
  --on-tertiary-container:    #848385;
}
```

### 1.4 Fixed & Extended Palettes
```css
:root {
  --primary-fixed:            #E5E2E1;
  --primary-fixed-dim:        #C8C6C5;
  --on-primary-fixed:         #1C1B1B;
  --on-primary-fixed-variant: #474646;

  --secondary-fixed:          #FFE16D;   /* Lighter gold — hover state for gold CTAs */
  --secondary-fixed-dim:      #E9C400;
  --on-secondary-fixed:       #221B00;
  --on-secondary-fixed-variant:#544600;

  --tertiary-fixed:           #E4E2E4;
  --tertiary-fixed-dim:       #C7C6C8;
  --on-tertiary-fixed:        #1B1B1D;
  --on-tertiary-fixed-variant:#464648;
}
```

### 1.5 Semantic Colors
```css
:root {
  /* Error / Destructive */
  --error:                    #BA1A1A;
  --on-error:                 #FFFFFF;
  --error-container:          #FFDAD6;
  --on-error-container:       #93000A;

  /* Outline / Borders */
  --outline:                  #747878;   /* Strong borders */
  --outline-variant:          #C4C7C7;   /* Subtle borders, dividers */
}
```

### 1.6 Semantic Application Guide
| Semantic | Token | Usage |
|---|---|---|
| **CTA / Active** | `--secondary-container` (#FCD400) | Primary action buttons, active nav, progress indicators |
| **CTA Hover** | `--secondary-fixed` (#FFE16D) | Hover state for golden buttons |
| **Interactive Focus** | `--secondary-container` | Input focus rings, active chip borders |
| **Card Border** | `--outline-variant` (#C4C7C7) | Card edges, section dividers |
| **Error State** | `--error` (#BA1A1A) | Reject buttons, validation errors |
| **Success / In-Stock** | Custom `#2E7D32` | Stock badges, shipping confirmation |
| **Warning / Pending** | Custom `#FFD700` border + `#FFF9E6` bg | Verification pending banners |

---

## 2. Typography

### 2.1 Font Stack
```css
/* Primary UI Font */
font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Technical / Monospace Font */
font-family: 'Noto Sans Mono', 'SF Mono', 'Consolas', monospace;
```

### 2.2 Type Scale
| Token | Family | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|---|
| `display-lg` | Roboto | 48px | 700 | 56px | -0.02em | Hero headlines |
| `headline-lg` | Roboto | 32px | 700 | 40px | — | Section headers (desktop) |
| `headline-lg-mobile` | Roboto | 24px | 700 | 32px | — | Section headers (mobile) |
| `headline-md` | Roboto | 20px | 500 | 28px | — | Card titles, prices |
| `body-lg` | Roboto | 16px | 400 | 24px | — | Body paragraphs |
| `body-sm` | Roboto | 14px | 400 | 20px | — | Descriptions, meta text |
| `label-caps` | Roboto | 12px | 700 | 16px | 0.08em | Section overlines, nav items, badges |
| `technical-data` | Noto Sans Mono | 13px | 500 | 16px | 0.02em | SKUs, dimensions, UTRs, spec data |

### 2.3 Typography Rules
1. **Headlines** — Tight letter-spacing, uppercase when used for section labels
2. **Label Caps** — Always uppercase, wide tracking, mimics stamped metal plates
3. **Technical Data** — Monospace ONLY for: SKU numbers, dimensions, prices in grids, UTR references, electrical tolerances, account numbers, IFSC codes
4. **Body text** must maintain **minimum 7:1 contrast ratio** against background (WCAG AAA)

---

## 3. Spacing & Layout

### 3.1 Base Unit
All spacing derives from an **8px base unit**. Use multiples of 4 for fine adjustments.

```css
:root {
  --space-unit:       4px;
  --space-base:       8px;     /* 1× base */
  --stack-sm:         4px;     /* ½× base — tight groupings */
  --stack-md:        16px;     /* 2× base — default section gap */
  --stack-lg:        32px;     /* 4× base — major section breaks */
  --gutter:          24px;     /* Column gutter */
  --margin-desktop:  40px;     /* Page margin ≥1280px */
  --margin-mobile:   16px;     /* Page margin <768px */
  --container-max: 1280px;     /* Max content width */
}
```

### 3.2 Grid System
| Breakpoint | Columns | Gutter | Margin | Max Width |
|---|---|---|---|---|
| Desktop (≥1280px) | 12 | 24px | 40px | 1280px |
| Tablet (768–1279px) | 8 | 16px | 24px | 100% |
| Mobile (<768px) | 4 | 12px | 16px | 100% |

---

## 4. Shape & Radius

```css
:root {
  --radius-sm:      0.125rem;  /* 2px — Tags, chips, micro elements */
  --radius-default: 0.25rem;   /* 4px — Buttons, inputs, standard cards */
  --radius-md:      0.375rem;  /* 6px — Elevated cards */
  --radius-lg:      0.5rem;    /* 8px — Modals, large containers */
  --radius-xl:      0.75rem;   /* 12px — Feature highlights */
  --radius-full:    9999px;    /* Pill/Circle — Nav indicators, dots */
}
```

### Shape Rules
- Standard UI elements use **4px radius** (precision manufacturing feel)
- Avoid overly rounded corners — this is industrial, not consumer
- Status tags use **2px radius** (square-ish, like stamped labels)
- Image containers use **4px radius** with `overflow: hidden`

---

## 5. Elevation & Depth

This system avoids soft, floating elevations. Depth is communicated through **tonal layers** and **low-contrast outlines**.

| Level | Method | Token |
|---|---|---|
| **L0 — Base** | Flat, no shadow | `background: var(--surface)` |
| **L1 — Cards** | 1px solid border | `border: 1px solid var(--outline-variant)` |
| **L2 — Hover** | Crisp, low-blur shadow | `box-shadow: 0 4px 8px rgba(0,0,0,0.08); translateY(-2px)` |
| **L3 — Floating** | Reserved for modals/overlays | `box-shadow: 0 8px 24px rgba(0,0,0,0.12)` |

### Elevation Rules
1. **Cards** are defined by borders, NOT shadows (L1)
2. **Hover states** transition from L1 → L2 (shadow + lift)
3. **CTAs** appear "bolted" onto the interface (solid bg, no shadow)
4. Product image containers use `#F5F5F7` background to make silhouettes pop

---

## 6. Component Patterns

### 6.1 Buttons
| Type | Background | Text | Border | Hover |
|---|---|---|---|---|
| **Primary** | `#000000` | `#FFFFFF` | none | `border-bottom: 2px solid #FFD700` |
| **Secondary** | `#FCD400` | `#111111` | none | `background: #FFE16D` |
| **Tertiary** | transparent | `#000000` | `1px solid #000` | `background: var(--surface-container-low)` |
| **Destructive** | `var(--error)` | `#FFFFFF` | none | `background: #93000A` |

### 6.2 Product Cards
- **Status badge:** Top-left absolute, 10px uppercase bold, surface bg
- **Image area:** `#F5F5F7` background, `object-fit: contain`, `mix-blend-mode: multiply`
- **Spec strip:** Bottom row, `technical-data` font, `--outline-variant` top border
- **Hover:** translateY(-2px) + box-shadow

### 6.3 Input Fields
- **Default:** 1px `--outline-variant` border, 4px radius
- **Focus:** Border color → `--primary`, left accent → `2px solid #FFD700`
- **Label:** `label-caps` font above the input

### 6.4 Data Tables
- **Header row:** `#000000` background, white text, `label-caps`
- **Body rows:** Zebra striping with `--surface-container-low` alternating
- **Cell font:** `technical-data` (monospace)

### 6.5 Navigation
- **Desktop:** Horizontal text links, `label-caps`, uppercase
- **Active state:** `color: var(--primary)`, `border-bottom: 2px solid var(--secondary-container)`, `font-weight: 700`
- **Hover:** `background: var(--surface-container-low)`

---

## 7. Icon System

- **Icon set:** Material Symbols Outlined
- **Default settings:** `FILL: 0, wght: 400, GRAD: 0, opsz: 24`
- **Filled variant:** `FILL: 1` (used for star ratings, active nav icons)
- **Sizes:** 16px (inline), 24px (standard), 32px (feature), 64px (hero states)
- **Colors:** Inherit from text color unless specified
