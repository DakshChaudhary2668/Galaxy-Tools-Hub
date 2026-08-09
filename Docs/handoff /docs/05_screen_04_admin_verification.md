# Screen 04: Admin — Payment Verification
> **Images:** `04_admin_payment_verification_desktop.png` · `04_admin_payment_verification_mobile.png`  
> **Route:** `/admin/verify/:taskId` (e.g., `/admin/verify/TSK-8839-B`)  
> **Priority:** P1 — Internal operations screen  
> **Access:** Admin only (authenticated)

---

## Layout Structure

### Desktop (≥1280px)
```
┌─────────────────────────────────────────────────────────────────┐
│ [🛡] GALAXY TOOLS HUB // ADMIN CONSOLE    SYS_TIME: 14:32:00  │ ← Dark admin header
├─────────────────────────────────────────────────────────────────┤
│ ← RETURN TO QUEUE                                              │
│ PAYMENT VERIFICATION TASK                  TASK ID: TSK-8839-B │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌────────────────────────────┐ ┌────────────────────────────┐  │
│ │  50% — ORDER MANIFEST     │ │  50% — EVIDENCE CONSOLE    │  │
│ │                            │ │                            │  │
│ │  📋 Order Manifest         │ │  🔍 Verification Evidence  │  │
│ │  [⏳ Pending Payment]      │ │                            │  │
│ │                            │ │  UTR REFERENCE             │  │
│ │  ORDER ID    TIMESTAMP     │ │  ┌──────────────────────┐  │  │
│ │  #GTH-10492  14:32 IST     │ │  │ 610492857211  [📋]   │  │  │
│ │                            │ │  └──────────────────────┘  │  │
│ │  CUSTOMER ENTITY           │ │                            │  │
│ │  Apex Heavy Industries     │ │  ┌──────────────────────┐  │  │
│ │  GSTIN: 27AADCB2230M1Z2   │ │  │                      │  │  │
│ │                            │ │  │  [Receipt Image]     │  │  │
│ │  LINE ITEMS                │ │  │  (with zoom tools)   │  │  │
│ │  ┌────────────────────┐   │ │  │  🔍+ 🔍- ↻ ⛶       │  │  │
│ │  │ DESC    QTY  TOTAL │   │ │  │                      │  │  │
│ │  │ Bosch…   1  ₹6,228 │   │ │  │  [Crosshair guides] │  │  │
│ │  │ DeWalt…  1  ₹1,121 │   │ │  │                      │  │  │
│ │  └────────────────────┘   │ │  └──────────────────────┘  │  │
│ │                            │ │                            │  │
│ │  SUBTOTAL        ₹6,228   │ │  FINAL VERIFICATION        │  │
│ │  CGST (9%)         ₹560   │ │  DECISION                  │  │
│ │  SGST (9%)         ₹560   │ │                            │  │
│ │  ─────────────────────    │ │  [✕ REJECT] [✓ APPROVE]   │  │
│ │  GRAND TOTAL     ₹7,350   │ │                            │  │
│ └────────────────────────────┘ └────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)
- Admin header: Compact, single row
- "RETURN TO QUEUE" link: Full-width, smaller text
- Content: Full-width stacked — Order Manifest card first, Evidence Console second
- Action buttons: Full-width stacked at bottom (Reject first, Approve second)
- Receipt image: Full-width with horizontal scroll for zoom
- Line items table: Horizontal scroll if needed

---

## Component Specifications

### Admin Header
- Background: `primary-container` (#1C1B1B)
- Text: `on-primary-container` for secondary, white for icons/brand
- Left: `admin_panel_settings` icon + "GALAXY TOOLS HUB // ADMIN CONSOLE" (`label-caps`)
- Right: System clock (`technical-data` font, updates every second) + user avatar circle
- Height: Auto, `padding: stack-md margin-desktop`

### Task Header
- "RETURN TO QUEUE" link: `technical-data` font, `on-surface-variant`, with `arrow_back` icon
  - Hover: `color: primary`
- Title: `headline-lg-mobile` (mobile) / `headline-lg` (desktop), `primary`, uppercase
- Task ID badge: `technical-data` font, `surface-container-high` bg, `1px solid outline-variant`
- Bottom border: `1px solid outline-variant`

### Order Manifest Panel (50% left on desktop)
- Container: `surface-container-lowest`, `1px solid outline-variant`, `shadow: sm`
- **Status indicator bar:** `height: 4px`, full width at top, `bg: secondary-container` (#FCD400)
- **Status badge:** `bg: secondary-container`, `on-secondary-container`, `label-caps`, with `pending` icon
- **Meta data grid:** 2-column on desktop
  - Label: `label-caps`, `on-surface-variant`
  - Value: `technical-data`, `primary`
  - Customer: `body-lg`, medium weight + GSTIN in `technical-data`

### Line Items Table
- Header: `bg: primary` (#000), `on-primary`, `label-caps`
- Columns: Description (7/12), Qty (2/12, centered), Total (3/12, right-aligned)
- Rows: Alternating `surface-container-lowest` / `surface-container-low`
- Description: `body-sm`
- Qty & Total: `technical-data`

### Financial Summary
- Container: `surface-container`, `1px solid outline-variant`, `rounded: DEFAULT`
- Rows: `technical-data`, `on-surface-variant`, flex `space-between`
- Divider before total: `1px solid outline-variant`
- Grand Total: `headline-md`, `primary`, bold

### Evidence Console Panel (50% right on desktop)
- Container: `surface-container-lowest`, `1px solid outline-variant`, `shadow: sm`
- **Console header:** `surface-container-low`, `headline-md` with `policy` icon
- **UTR section:** Label in `label-caps`, value in `technical-data` large (18px), wide letter-spacing
  - Copy button: `surface-variant` bg, `1px solid outline-variant`, `content_copy` icon + "COPY" label
  - Click: Alert "UTR Copied to clipboard"

### Receipt Image Viewer
- Container: `min-height: 400px`, `surface-container-high` bg
- **Toolbar (floating):** Absolute top-right, `surface-container-lowest` bg, column layout
  - Buttons: `zoom_in`, `zoom_out`, divider, `rotate_right`, `fullscreen`
  - Opacity: 50% → 100% on hover
- **Image:** Centered, max-height 500px, `border: 2px solid outline-variant`, white bg, `padding: 8px`
  - Hover: `scale: 1.05`, `cursor: zoom-in`
- **Crosshair guides:** Two lines (horizontal + vertical center), `outline-variant/30`, `pointer-events: none`

### Verification Action Buttons
- Label: `label-caps`, centered, "FINAL VERIFICATION DECISION"
- 2-column grid:
  - **REJECT:** `bg: error` (#BA1A1A), `on-error`, `headline-md`, `cancel` icon
    - Border-bottom: `4px solid #730005`
    - Active: `border-bottom: 0`, `translateY(1px)` (pressed effect)
    - Hover: `bg: #93000A`
  - **APPROVE:** `bg: primary` (#000), `on-primary`, `headline-md`, `check_circle` icon
    - Border-bottom: `4px solid secondary-container` (#FCD400)
    - Active: `border-bottom: 0`, `translateY(1px)` (pressed effect)
    - Hover: `bg: #333333`

---

## Interaction States

| Element | Trigger | Effect |
|---|---|---|
| REJECT button | Hover | `bg: #93000A` |
| REJECT button | Active | `border-bottom: 0`, `translateY(1px)` |
| APPROVE button | Hover | `bg: #333333` |
| APPROVE button | Active | `border-bottom: 0`, `translateY(1px)` |
| Copy UTR | Click | Copies UTR to clipboard, shows confirmation |
| Receipt image | Hover | `scale: 1.05`, `cursor: zoom-in` |
| Zoom toolbar | Hover (parent) | `opacity: 50% → 100%` |
| Return link | Hover | `color: primary` |

---

## System Clock (JavaScript)
```javascript
// Real-time clock in admin header
function updateClock() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour12: false });
  document.getElementById('clock').textContent = timeString;
}
setInterval(updateClock, 1000);
```

---

## Data Fields

| Field | Type | Example |
|---|---|---|
| Task ID | String | "TSK-8839-B" |
| Order ID | String | "#GTH-2026-10492" |
| Timestamp | DateTime | "2024-10-24 14:32:00 IST" |
| Customer Entity | String | "Apex Heavy Industries Pvt. Ltd." |
| GSTIN | String | "27AADCB2230M1Z2" |
| Line items | Array<{ description, qty, total }> | From order API |
| Subtotal | Currency | ₹6,228.81 |
| CGST / SGST | Currency | ₹560.59 / ₹560.60 |
| Grand Total | Currency | ₹7,350.00 |
| UTR Reference | String | "610492857211" |
| Receipt Image | Image URL | From upload storage |
