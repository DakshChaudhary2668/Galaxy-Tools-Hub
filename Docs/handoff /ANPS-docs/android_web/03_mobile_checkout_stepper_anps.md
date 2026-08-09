# GALAXY TOOLS HUB: MOBILE CHECKOUT STEPPER — ANPS
> **Version:** 1.0.0-alpha
> **Role:** Checkout / Payment Evidence Step — Mobile
> **Theme:** Industrial Premium / High-Density Light Mode
> **Platform:** Android / Mobile Web (4-column fluid grid)

---

## SECTION 1: SYSTEM ARCHETYPE & DESIGN TOKENS

The Checkout Stepper represents Step 3 of the Galaxy Tools Hub B2B order flow — "Payment Evidence." This screen surfaces bank transfer details, UPI payment options, and a receipt upload mechanism. The design prioritizes trust, clarity of financial data, and a clear path to order completion.

### 1.1 Layout Architecture
- **Viewport:** Mobile-first, max-width 672px (max-w-2xl).
- **TopAppBar:** 56px sticky header with back arrow, brand, and cart icon.
- **Content Canvas:** Vertical stack with 16px horizontal margins, 24px vertical gaps.
- **Sticky Bottom Bar:** 80px fixed footer with disabled/enabled CTA.
- **Body Padding Bottom:** 100px to clear the sticky bar.

### 1.2 Color & Contrast Tokens
| Token | Value | Application |
| :--- | :--- | :--- |
| **Surface** | `#F9F9F9` | Main canvas, stepper background. |
| **Surface Container Lowest** | `#FFFFFF` | Summary card, bank details card, input fields. |
| **Surface Container Low** | `#F3F3F3` | Card section headers (Bank Transfer, UPI). |
| **Primary** | `#705D00` | Completed step circles, active step border, upload icon. |
| **Primary Container** | `#FFD700` | Active step 3 circle, upload progress bar fill. |
| **On-Primary** | `#FFFFFF` | Checkmark icons inside completed steps. |
| **Outline Variant** | `#D0C6AB` | Card borders, step connecting line, dashed upload border. |
| **Secondary Container** | `#E5E2E1` | Disabled CTA button background. |
| **Success Green** | `#E8F5E9` bg / `#2E7D32` text | "FREE SHIPPING UNLOCKED" banner. |

### 1.3 Typography Matrix
- **Roboto:** Headlines (24px), body labels (14px), section caps (12px)
- **Noto Sans Mono:** Financial data (13px) — subtotal, tax, total, account numbers, IFSC codes, UTR input

---

## SECTION 2: SYSTEM-WIDE ATOMIC COMPONENTS

### 2.1 STEP_PROGRESS_INDICATOR
```xml
<component id="stepper" type="progress-indicator" width="100%">
  <layout type="horizontal" alignment="center" justify="space-between" position="relative">
    <line position="absolute" top="50%" width="100%" height="2px" background="outline_variant" z_index="-1"/>
    <step state="completed" size="32px" background="primary" color="on_primary" rounded="full">
      <icon type="check" size="16px"/>
    </step>
    <step state="completed" size="32px" background="primary" color="on_primary" rounded="full">
      <icon type="check" size="16px"/>
    </step>
    <step state="active" size="32px" background="primary_container" color="on_primary_container" border="2px solid primary_container" rounded="full" shadow="0 0 0 4px rgba(255,215,0,0.3)">
      <text value="3"/>
    </step>
    <step state="inactive" size="32px" background="surface" border="1px solid outline_variant" color="on_surface_variant" rounded="full">
      <text value="4"/>
    </step>
  </layout>
  <text value="Payment Evidence" font="label_caps" color="on_surface_variant" alignment="center" transform="uppercase" margin_top="8px"/>
</component>
```

### 2.2 ORDER_SUMMARY_CARD
```xml
<component id="order_summary" type="card" background="surface_container_lowest" border="1px solid outline_variant" rounded="lg" padding="margin" shadow="sm">
  <layout type="vertical" gap="stack_sm">
    <line_item label="Subtotal" value="₹5,750.00" font="tech_data" color="on_surface_variant"/>
    <line_item label="CGST (9%)" value="₹517.50" font="tech_data" color="on_surface_variant"/>
    <line_item label="SGST (9%)" value="₹517.50" font="tech_data" color="on_surface_variant"/>
    <divider height="1px" background="outline_variant" margin_y="4px"/>
    <line_item label="Total" value="₹6,785.00" font="headline_md" color="on_surface" weight="bold"/>
    <banner background="#E8F5E9" border="1px solid #C8E6C9" color="#2E7D32" font="label_caps" rounded="DEFAULT" padding="8px 12px" margin_top="8px">
      <icon type="local_shipping" size="16px" margin_right="8px"/>
      FREE SHIPPING UNLOCKED
    </banner>
  </layout>
</component>
```

### 2.3 BANK_TRANSFER_BLOCK
```xml
<component id="bank_transfer" type="card" border="1px solid outline_variant" rounded="lg" background="surface_container_lowest" overflow="hidden">
  <header background="surface_container_low" padding_x="margin" padding_y="stack_sm" border_bottom="1px solid outline_variant">
    <layout type="horizontal" alignment="center" gap="8px">
      <icon type="account_balance" size="24px"/>
      <text value="BANK TRANSFER DETAILS" font="label_caps" weight="700" transform="uppercase"/>
    </layout>
  </header>
  <content padding="margin">
    <detail_row label="Beneficiary Name" value="MECO INSTRUMENTS PRIVATE LIMITED" font_value="tech_data" copyable="true"/>
    <detail_row label="Bank & Branch" value="Canara Bank, Vashi" font_value="tech_data" copyable="false"/>
    <detail_row label="Account Number" value="0110261020612" font_value="tech_data" copyable="true"/>
    <detail_row label="IFSC Code" value="CNRB0003302" font_value="tech_data" copyable="true"/>
  </content>
</component>
```

### 2.4 UPI_PAYMENT_BLOCK
```xml
<component id="upi_block" type="card" border="1px solid outline_variant" rounded="lg" background="surface_container_lowest" overflow="hidden">
  <header background="surface_container_low" padding_x="margin" padding_y="stack_sm" border_bottom="1px solid outline_variant">
    <layout type="horizontal" alignment="center" gap="8px">
      <icon type="qr_code_scanner" size="24px"/>
      <text value="UPI PAYMENT" font="label_caps" weight="700" transform="uppercase"/>
    </layout>
  </header>
  <content padding="margin" alignment="center">
    <qr_code width="160px" height="160px" border="2px dashed outline_variant" rounded="DEFAULT" background="surface_container_lowest"/>
    <text value="Scan to pay using GPay, PhonePe, or Paytm" font="body_md" color="on_surface_variant" margin_top="stack_md"/>
  </content>
</component>
```

### 2.5 EVIDENCE_UPLOAD_FORM
```xml
<component id="evidence_form" type="form">
  <label value="PROVIDE PAYMENT EVIDENCE" font="label_caps" transform="uppercase"/>
  <input_field label="UTR / Reference Number *" font_label="label_caps" color_label="on_surface_variant" placeholder="e.g. 123456789012" font_input="tech_data" border="1px solid outline_variant" focus_border="primary_container" focus_border_bottom="2px"/>
  <upload_zone border="2px dashed outline_variant" rounded="lg" background="surface_container_lowest" padding="stack_lg" hover_background="surface_container_low">
    <icon type="upload_file" size="32px" color="primary"/>
    <text value="Drag & Drop receipt here" font="body_md" weight="700"/>
    <text value="JPG, PNG, PDF up to 5MB" font="label_caps" color="on_surface_variant"/>
    <progress_overlay background="surface_container_lowest/90" visibility="on_upload">
      <text value="{percent}% uploading {filename}..." font="tech_data"/>
      <progress_bar height="4px" background="surface_container_high" fill="primary_container" rounded="full"/>
    </progress_overlay>
  </upload_zone>
</component>
```

### 2.6 DISABLED_CTA_BAR
```xml
<component id="submit_bar" type="fixed-footer" height="80px" background="surface" border_top="1px solid outline_variant" z_index="50">
  <button width="100%" max_width="672px" background="secondary_container" color="on_secondary_container" font="label_caps" transform="uppercase" padding_y="16px" rounded="lg" disabled="true" opacity="0.5">
    <icon type="lock" size="18px" margin_right="8px"/>
    Submit Payments Details & Place Order
  </button>
</component>
```

---

## SECTION 3: FULL SCREEN WIREFLOW

```
+--------------------------------------------------+
| [←] GALAXY TOOLS                           [🛒]  | ← TopAppBar
+--------------------------------------------------+
|    (✓)———(✓)———(③)———(4)                        | ← Step Progress
|            PAYMENT EVIDENCE                      |
+--------------------------------------------------+
| ┌──────────────────────────────────────────────┐ |
| │ Subtotal                      ₹5,750.00      │ |
| │ CGST (9%)                       ₹517.50      │ |
| │ SGST (9%)                       ₹517.50      │ |
| │ ──────────────────────────────────────       │ |
| │ Total                        ₹6,785.00       │ |
| │ [🚚 FREE SHIPPING UNLOCKED]                  │ |
| └──────────────────────────────────────────────┘ |
+--------------------------------------------------+
| ┌──────────────────────────────────────────────┐ |
| │ 🏦 BANK TRANSFER DETAILS                    │ |
| ├──────────────────────────────────────────────┤ |
| │ Beneficiary Name          [📋]               │ |
| │ MECO INSTRUMENTS PRIVATE LIMITED              │ |
| │                                              │ |
| │ Bank & Branch                                │ |
| │ Canara Bank, Vashi                           │ |
| │                                              │ |
| │ Account Number            [📋]               │ |
| │ 0110261020612                                │ |
| │                                              │ |
| │ IFSC Code                 [📋]               │ |
| │ CNRB0003302                                  │ |
| └──────────────────────────────────────────────┘ |
+--------------------------------------------------+
| ┌──────────────────────────────────────────────┐ |
| │ 📱 UPI PAYMENT                               │ |
| ├──────────────────────────────────────────────┤ |
| │        ┌────────────────┐                    │ |
| │        │   [QR CODE]    │                    │ |
| │        └────────────────┘                    │ |
| │   Scan to pay using GPay, PhonePe, or Paytm │ |
| └──────────────────────────────────────────────┘ |
+--------------------------------------------------+
| PROVIDE PAYMENT EVIDENCE                         |
| UTR / Reference Number *                         |
| ┌──────────────────────────────────────────────┐ |
| │ e.g. 123456789012                            │ |
| └──────────────────────────────────────────────┘ |
| ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ |
| │   75% uploading receipt_GT9511_transfer.png  │ |
| │   [████████████████████░░░░░░░]              │ |
| └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ |
+--------------------------------------------------+
| [🔒 SUBMIT PAYMENTS DETAILS & PLACE ORDER]      | ← Disabled state
+--------------------------------------------------+
```

---

## SECTION 4: INTERACTIVE WORKSPACE STATE MATRIX

| Interaction | Visual Change | CSS / Token Rule |
| :--- | :--- | :--- |
| **Copy Button Hover** | Opacity: 50% → 100% | `opacity-50 group-hover:opacity-100` |
| **Copy Button Click** | Toast: "Copied to clipboard" | `onclick` alert |
| **UTR Input Focus** | Border-bottom: 2px `primary_container` | `focus:border-primary-container focus:border-b-2` |
| **Upload Zone Hover** | BG: `surface_container_low` | `hover:bg-surface-container-low transition-colors` |
| **Upload In Progress** | Overlay with progress bar and filename | Golden bar fill from 0→100% |
| **CTA Disabled** | Opacity: 0.5, cursor: not-allowed | `opacity-50 cursor-not-allowed` |
| **CTA Enabled** | Full opacity, background: `primary_container` | Removes disabled state |

---

## SECTION 5: IMPLEMENTATION DIRECTION FOR GRAPHICS AGENTS

1. **Step 1:** Establish the surface `#F9F9F9` canvas with centered content (max-w-2xl).
2. **Step 2:** Render the 4-step linear progress indicator — golden ring on active step 3.
3. **Step 3:** Order summary card with monospace financial data and green shipping banner.
4. **Step 4:** Bank transfer block with copiable data fields in monospace.
5. **Step 5:** UPI block with centered QR code and helper text.
6. **Step 6:** Evidence form with UTR input and dashed upload zone showing progress overlay.
7. **Step 7:** Sticky bottom CTA in disabled state (locked icon, muted background).
