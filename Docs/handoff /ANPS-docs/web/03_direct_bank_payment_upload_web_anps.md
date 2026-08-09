# GALAXY TOOLS HUB: DIRECT BANK PAYMENT & UPLOAD — ANPS (WEB)
> **Format Version:** 1.2.0-antigravity
> **Target Consumer:** UI/UX Generation Agents, Design Systems Compilers, and Google Stitch Engines
> **Project Identity:** B2B Industrial E-Commerce — Desktop Web Checkout & Payment Flow
> **Screen:** Direct Bank Payment & Receipt Upload Page

---

## 1. SYSTEM ARCHETYPE & DESIGN TOKENS

This section defines the master visual specifications for the B2B direct bank payment upload page — a high-trust transactional screen for submitting payment evidence.

```yaml
system:
  project_name: "Galaxy Tools Hub"
  screen: "Direct Bank Payment Upload"
  archetype: "Industrial Premium, Technical Brutalism, B2B Checkout"
  viewport: { type: "desktop", max_width: 1280px }

layout_grid:
  announcement_bar: { height: 32px, background: "secondary_container" }
  header: { height: 64px, type: "transactional", brand_only: true }
  content_max: 896px                   # Centered 8-column workspace container (col-span-8 col-start-3)
  gutter: 24px
  margin_desktop: 40px

color_tokens:
  canvas_base: "#F9F9FB"
  surface_container_lowest: "#FFFFFF"  # Primary form card background
  surface_container_low: "#F3F3F5"     # Bank details and QR card background
  surface_container: "#EEEEF0"         # File upload area background
  on_surface: "#1A1C1D"
  on_surface_variant: "#444748"
  primary: "#000000"
  on_primary: "#FFFFFF"
  primary_container: "#1C1B1B"        # Submit hover background
  secondary_container: "#FCD400"      # Stepper active step & CTA border accent
  on_secondary_container: "#6E5C00"
  outline_variant: "#C4C7C7"
  error: "#BA1A1A"
  error_container: "#FFDAD6"
  on_error_container: "#93000A"

typography_matrix:
  headline_lg: { family: "Roboto", size: 32px, weight: 700, leading: 40px }
  headline_md: { family: "Roboto", size: 20px, weight: 500, leading: 28px }
  body_lg: { family: "Roboto", size: 16px, weight: 400, leading: 24px }
  body_sm: { family: "Roboto", size: 14px, weight: 400, leading: 20px }
  label_caps: { family: "Roboto", size: 12px, weight: 700, leading: 16px, tracking: "0.08em" }
  technical_data: { family: "Noto Sans Mono", size: 13px, weight: 500, leading: 16px, tracking: "0.02em" }
```

---

## 2. SYSTEM-WIDE ATOMIC COMPONENTS

### 2.1 Warning Banner
```xml
<component id="warning_banner" background="error_container" color="on_error_container" border="1px solid error" rounded="sm" padding="16px" margin_bottom="32px">
  <layout type="horizontal" alignment="start" gap="12px">
    <icon type="warning" size="24px" color="error"/>
    <group>
      <text value="Order held under Pending Verification" font="body_lg" weight="700"/>
      <text value="Please submit evidence of direct payment to proceed with order processing." font="body_sm" margin_top="4px"/>
    </group>
  </layout>
</component>
```

### 2.2 Checkout Stepper (Desktop)
```xml
<component id="checkout_stepper" type="progress-bar" margin_bottom="32px" position="relative">
  <line position="absolute" top="50%" width="100%" height="2px" background="surface_variant" z_index="0"/>
  <layout type="horizontal" justify="space-between" alignment="center">
    <step id="step_1" state="completed">
      <circle size="32px" background="primary" color="on_primary" font_weight="700" rounded="full" value="1"/>
      <text value="REVIEW" font="label_caps" color="on_surface_variant"/>
    </step>
    <step id="step_2" state="completed">
      <circle size="32px" background="primary" color="on_primary" font_weight="700" rounded="full" value="2"/>
      <text value="BILLING" font="label_caps" color="on_surface_variant"/>
    </step>
    <step id="step_3" state="active">
      <circle size="32px" background="secondary_fixed" color="primary" border="2px solid primary" font_weight="700" rounded="full" value="3"/>
      <text value="PAYMENT" font="label_caps" color="primary" weight="700"/>
    </step>
  </layout>
</component>
```

### 2.3 Bank Details Block (50% Split)
```xml
<component id="bank_details_card" background="surface_container_low" border="1px solid outline_variant" rounded="sm" padding="24px">
  <title value="Bank Details" icon_left="account_balance" font="headline_md" margin_bottom="16px"/>
  <details_list font="technical_data" layout="vertical" gap="12px">
    <row label="Beneficiary Name" value="MECO Instruments" border_bottom="1px solid surface_variant" padding_bottom="8px"/>
    <row label="Bank Name" value="Canara Bank, Vashi" border_bottom="1px solid surface_variant" padding_bottom="8px"/>
    <row label="Account Number" value="02134567890123" border_bottom="1px solid surface_variant" padding_bottom="8px"/>
    <row label="IFSC Code" value="CNRB0000213" border_bottom="1px solid surface_variant" padding_bottom="8px"/>
  </details_list>
</component>
```

### 2.4 UPI QR Code Block (50% Split)
```xml
<component id="upi_qr_card" background="surface_container_low" border="1px solid outline_variant" rounded="sm" padding="24px" alignment="center">
  <qr_container width="192px" height="192px" background="#FFFFFF" border="1px solid outline_variant" padding="8px" margin_bottom="16px">
    <image src="{qr_code}" width="100%" height="100%" object_fit="cover"/>
  </qr_container>
  <text value="Scan to pay via UPI" font="body_sm" color="on_surface_variant" margin_bottom="8px"/>
  <text value="mecotools@canarabank" font="technical_data" weight="700" color="primary"/>
</component>
```

### 2.5 Evidence Form & Drag-and-Drop Zone
```xml
<component id="evidence_upload_form" type="form" layout="vertical" gap="24px">
  <input_group label="UTR / Transaction Reference Number *" label_font="body_sm" label_weight="700">
    <input type="text" id="utrNumber" placeholder="Enter 12-22 digit reference number" font="technical_data" border="1px solid outline_variant" rounded="sm" padding="12px" minlength="12" maxlength="22" required="true"/>
    <helper_text value="Found on your bank transfer receipt." font="label_caps" color="on_surface_variant" margin_top="8px"/>
  </input_group>

  <upload_group label="Upload Payment Screenshot *" label_font="body_sm" label_weight="700">
    <dropzone border="2px dashed outline_variant" rounded="sm" padding="32px" alignment="center" background="surface_container" hover_bg="surface_container_low" cursor="pointer" onclick="fileUpload.click()">
      <icon type="cloud_upload" size="36px" color="on_surface_variant" margin_bottom="8px"/>
      <text value="Drag and drop file here" font="body_lg" margin_bottom="4px"/>
      <text value="or click to browse" font="body_sm" color="on_surface_variant"/>
      <input type="file" id="fileUpload" accept=".jpg,.jpeg,.png,.pdf" hidden="true"/>
    </dropzone>
    <badge_container margin_top="16px" layout="horizontal-wrap" gap="8px">
      <file_badge background="surface_variant" padding="4px 12px" rounded="sm" font="body_sm">
        <icon type="image" size="14px" margin_right="8px"/>
        payment_receipt_meco.jpg
        <remove_button icon="close" size="14px" color="error" margin_left="8px"/>
      </file_badge>
    </badge_container>
  </upload_group>

  <actions layout="horizontal" justify="end" gap="16px" border_top="1px solid outline_variant" padding_top="16px">
    <button type="tertiary" label="Cancel" border="1px solid primary" color="primary" font="body_lg" weight="700" padding="12px 24px" hover_bg="surface_container_low"/>
    <button type="submit" label="Submit Evidence" background="primary" color="on_primary" font="body_lg" weight="700" padding="12px 24px" hover_bg="primary_container" hover_border_bottom="2px solid secondary_container"/>
  </actions>
</component>
```

---

## 3. DESKTOP WORKSPACE WIREFLOW

```
+====================================================================================+
| [🚚] FREE SHIPPING ON BULK ORDERS ABOVE ₹50,000 | GST INVOICE AVAILABLE           |
+====================================================================================+
|                                GALAXY TOOLS HUB                                    | ← Minimal Brand Header
+====================================================================================+
|                                                                                    |
|                         [896px CENTERED CONTAINER]                                 |
|                                                                                    |
|  ┌──────────────────────────────────────────────────────────────────────────────┐  |
|  │ ⚠ Order held under Pending Verification                                      │  |
|  │ Please submit evidence of direct payment to proceed with order processing.   │  |
|  └──────────────────────────────────────────────────────────────────────────────┘  |
|                                                                                    |
|       (① REVIEW) ─────────────── (② BILLING) ─────────────── (③ PAYMENT●)         | ← Stepper
|                                                                                    |
|  ┌──────────────────────────────────────────────────────────────────────────────┐  |
|  │ Payment Evidence Upload                                                      │  |
|  │                                                                              │  |
|  │ ┌──────────────────────────────────────┐ ┌────────────────────────────────┐ │  |
|  │ │ 🏦 Bank Details                      │ │ 📱 Scan to pay via UPI         │ │  |
|  │ │ Beneficiary Name: MECO Instruments   │ │ ┌──────────────────────────┐   │ │  |
|  │ │ Bank Name: Canara Bank, Vashi        │ │ │       [QR CODE]          │   │ │  |
|  │ │ Account Number: 02134567890123       │ │ └──────────────────────────┘   │ │  |
|  │ │ IFSC Code: CNRB0000213               │ │ mecotools@canarabank           │ │  |
|  │ └──────────────────────────────────────┘ └────────────────────────────────┘ │  |
|  │                                                                              │  |
|  │ UTR / Transaction Reference Number *                                         │  |
|  │ ┌──────────────────────────────────────────────────────────────────────────┐ │  |
|  │ │ Enter 12-22 digit reference number                                   │ │  |
|  │ └──────────────────────────────────────────────────────────────────────────┘ │  |
|  │ Found on your bank transfer receipt.                                         │  |
|  │                                                                              │  |
|  │ Upload Payment Screenshot *                                                  │  |
|  │ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │  |
|  │ │                       ☁ Drag and drop file here                            │ │  |
|  │ │                             or click to browse                             │ │  |
|  │ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │  |
|  │ [📎 payment_receipt_meco.jpg ✕]                                             │  |
|  │                                                                              │  |
|  │ ───────────────────────────────────────────────────────────────────────────  │  |
|  │                                              [Cancel]  [Submit Evidence]     │  |
|  └──────────────────────────────────────────────────────────────────────────────┘  |
|                                                                                    |
+====================================================================================+
| GALAXY TOOLS HUB  © 2024        About Us | Contact Sales | Track Order | ...      |
+====================================================================================+
```

---

## 4. INTERACTIVE WORKSPACE STATE MATRIX

| Element | Interaction | Target Style |
| :--- | :--- | :--- |
| **UTR Input** | Focus | `border-color: primary`, `ring: 1px primary` |
| **Dropzone** | Hover / Dragover | `background: surface_container_low`, `transition: colors` |
| **Dropzone** | Click | Triggers native file selector input |
| **File Badge ✕** | Click | Removes selected file badge |
| **Submit Button** | Hover | `background: primary_container`, `border-bottom: 2px solid secondary_container` |
| **Cancel Button** | Hover | `background: surface_container_low` |

---

## 5. IMPLEMENTATION DIRECTION FOR GRAPHICS AGENTS

1. **The Shell:** Centered 8-column layout (max 896px) on clean `#F9F9FB` canvas.
2. **The Stepper:** Top progress line with gold active step 3 circle.
3. **The Cards:** Dual split row — bank specs in monospace left, centered QR code right.
4. **The Form:** Technical reference input field and dashed dropzone showing file badge.
5. **The Action:** Right-aligned Cancel and dark Submit CTA with golden border hover state.
