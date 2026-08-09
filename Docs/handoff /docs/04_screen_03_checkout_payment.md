# Screen 03: Checkout — Payment Evidence Upload
> **Images:** `03_checkout_payment_upload_desktop.png` · `03_checkout_payment_upload_mobile.png`  
> **Route:** `/checkout/payment` (Step 3 of checkout flow)  
> **Priority:** P0 — Critical conversion path

---

## Layout Structure

### Desktop (≥1280px)
```
┌─────────────────────────────────────────────────────────────────┐
│ Announcement Bar (same as global)                               │
├─────────────────────────────────────────────────────────────────┤
│                     GALAXY TOOLS HUB                            │ ← Centered brand only
├─────────────────────────────────────────────────────────────────┤
│ ⚠ Order held under Pending Verification                        │ ← Error banner
│ Please submit evidence of direct payment to proceed.            │
├─────────────────────────────────────────────────────────────────┤
│ (①)────────(②)────────(③●)                                     │ ← 3-step stepper
│                  PAYMENT                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              CENTERED CONTAINER (8 cols)                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Payment Evidence Upload                (headline-lg)    │  │
│  │                                                           │  │
│  │  ┌─────────────────────┐ ┌────────────────────────────┐  │  │
│  │  │ 🏦 Bank Details     │ │ 📱 QR Code               │  │  │
│  │  │ Beneficiary: MECO…  │ │ ┌────────┐               │  │  │
│  │  │ Bank: Canara, Vashi │ │ │  [QR]  │               │  │  │
│  │  │ Acct: 0213456789…   │ │ └────────┘               │  │  │
│  │  │ IFSC: CNRB0000213   │ │ mecotools@canarabank     │  │  │
│  │  └─────────────────────┘ └────────────────────────────┘  │  │
│  │                                                           │  │
│  │  UTR / Transaction Reference Number *                    │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ Enter 12-22 digit reference number                 │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  Upload Payment Screenshot *                              │  │
│  │  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │  │
│  │  │  ☁ Drag and drop file here                         │  │  │
│  │  │    or click to browse                              │  │  │
│  │  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │  │
│  │  [📎 payment_receipt_meco.jpg ✕]                          │  │
│  │                                                           │  │
│  │                        [Cancel]  [Submit Evidence]         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Footer                                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)
- Centered container fills full width with 16px margins
- Bank details and QR code stack vertically (bank first, QR second)
- Stepper stays horizontal but compact
- Upload zone same but touch-optimized (large tap target)
- Action buttons stack: Cancel full-width, Submit full-width below

---

## Component Specifications

### Warning Banner
- Background: `error-container` (#FFDAD6)
- Border: `1px solid error`
- Icon: `warning` (Material Symbols), `color: error`
- Title: `body-lg`, bold
- Body: `body-sm`
- Rounded: 4px
- Margin-bottom: `stack-lg`

### Checkout Stepper (3-step)
- Steps arranged horizontally with connecting line
- Connecting line: `height: 2px`, `bg: surface-variant`, positioned behind circles
- **Completed step:** 32px circle, `bg: primary` (#000), white number, bold
- **Active step:** 32px circle, `bg: secondary-fixed` (#FFE16D), `border: 2px solid primary`, bold number
- **Active label:** Below, `label-caps`, `primary` color, bold
- Step labels: REVIEW → BILLING → PAYMENT

### Bank Transfer Details Card
- Background: `surface-container-low`
- Border: `1px solid outline-variant`
- Rounded: 4px
- Header: `headline-md` with `account_balance` icon
- Rows: Label-value pairs in `technical-data` font
  - Label: `on-surface-variant`
  - Value: `primary`, bold
- Row separator: `border-bottom: 1px solid surface-variant`

### QR Code Card
- Same container style as bank details
- QR image: 192×192px, `1px solid outline-variant` border, `padding: 8px`, white bg
- UPI address: `technical-data`, `primary`, bold
- Helper text: `body-sm`, `on-surface-variant`

### UTR Input Field
- Label: `body-sm`, bold, `on-surface`
- Input: `1px solid outline-variant`, `rounded: 4px`, `padding: 12px`
- Font: `technical-data` (monospace — for reference number)
- Attributes: `minlength="12"`, `maxlength="22"`, `required`
- Focus: `border-color: primary`, `ring: 1px primary`
- Helper text: `label-caps`, `on-surface-variant`, "Found on your bank transfer receipt."

### File Upload Zone
- Border: `2px dashed outline-variant`
- Background: `surface-container`
- Padding: `stack-lg` (32px)
- Rounded: 4px
- Hover: `bg: surface-container-low`
- Content centered:
  - Icon: `cloud_upload`, 36px, `on-surface-variant`
  - Primary: `body-lg`, "Drag and drop file here"
  - Secondary: `body-sm`, `on-surface-variant`, "or click to browse"
- Hidden file input: `accept=".jpg,.jpeg,.png,.pdf"`

### File Badge (after upload)
- Background: `surface-variant`
- Padding: `4px 12px`
- Rounded: 4px
- Content: `image` icon (16px) + filename (`body-sm`) + close button (`close` icon, `color: error`)

### Action Buttons
- **Cancel:** `border: 1px solid primary`, `color: primary`, bold, `padding: 12px 24px`
  - Hover: `bg: surface-container-low`
- **Submit Evidence:** `bg: primary`, `color: on-primary`, bold, `padding: 12px 24px`
  - Hover: `bg: primary-container`, `border-bottom: 2px solid secondary-container`

---

## Interaction States

| Element | Trigger | Effect |
|---|---|---|
| UTR Input | Focus | `border-color: primary`, `ring: 1px` |
| Upload zone | Hover | `bg: surface-container-low` |
| Upload zone | Drag over | `border-color: primary`, `bg: surface-container-low` |
| Upload zone | Click | Opens native file picker |
| File badge ✕ | Click | Removes file from upload list |
| Cancel button | Hover | `bg: surface-container-low` |
| Submit button | Hover | `bg: primary-container` |
| Submit button | Disabled | `opacity: 0.5`, `cursor: not-allowed` (when no UTR + no file) |

---

## Validation Rules

| Field | Rule | Error Message |
|---|---|---|
| UTR Number | Required, 12–22 digits only | "Please enter a valid UTR reference (12-22 digits)" |
| File Upload | Required, max 5MB, .jpg/.jpeg/.png/.pdf only | "Please upload a valid receipt image (JPG, PNG, or PDF, max 5MB)" |
| Submit | Both fields must be valid | Button remains disabled until both fields are filled |

---

## Data Fields

| Field | Type | Example |
|---|---|---|
| Beneficiary Name | Static String | "MECO Instruments" |
| Bank Name | Static String | "Canara Bank, Vashi" |
| Account Number | Static String | "02134567890123" |
| IFSC Code | Static String | "CNRB0000213" |
| UPI Address | Static String | "mecotools@canarabank" |
| UTR Input | User Input (String) | "610492857211" |
| Screenshot File | User Upload (File) | payment_receipt_meco.jpg |
