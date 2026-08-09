# GALAXY TOOLS HUB: ADMIN PAYMENT VERIFICATION — ANPS (WEB)
> **Format Version:** 1.2.0-antigravity
> **Target Consumer:** UI/UX Generation Agents, Design Systems Compilers, and Google Stitch Engines
> **Project Identity:** B2B Industrial E-Commerce — Desktop Admin Console
> **Screen:** Admin Payment Verification Task Page

---

## 1. SYSTEM ARCHETYPE & DESIGN TOKENS

This section defines the master visual specifications for the Admin Payment Verification Desk — an internal finance operations page for reviewing UTR references and approving/rejecting manual bank transfer receipts.

```yaml
system:
  project_name: "Galaxy Tools Hub"
  screen: "Admin Payment Verification Task"
  archetype: "Technical Brutalism, Operations Desk, Dual-Pane Console"
  viewport: { type: "desktop", max_width: 1280px }

layout_grid:
  header: { height: 56px, type: "admin-minimal", background: "primary_container" }
  content_max: 1280px
  split_ratio: "50/50 (6 cols left / 6 cols right)"
  gutter: 24px
  margin_desktop: 40px

color_tokens:
  canvas_base: "#F9F9FB"
  surface_container_lowest: "#FFFFFF"  # Panel card background
  surface_container_low: "#F3F3F5"     # Console header & viewer background
  surface_container_high: "#E8E8EA"    # Image workspace background
  surface_variant: "#E2E2E4"
  on_surface: "#1A1C1D"
  on_surface_variant: "#444748"
  primary: "#000000"                  # Ink Primary
  on_primary: "#FFFFFF"
  primary_container: "#1C1B1B"        # Admin header background
  on_primary_container: "#858383"
  secondary_container: "#FCD400"      # Status bar & approve CTA border
  on_secondary_container: "#6E5C00"
  outline_variant: "#C4C7C7"
  outline: "#747878"
  error: "#BA1A1A"
  on_error: "#FFFFFF"
  error_container: "#FFDAD6"

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

### 2.1 Admin Console Header
```xml
<component id="admin_header" background="primary_container" border_bottom="1px solid primary" padding_x="40px" padding_y="16px">
  <layout type="horizontal" justify="space-between" alignment="center" max_width="1280px">
    <brand layout="horizontal" alignment="center" gap="8px">
      <icon type="admin_panel_settings" size="24px" color="#FFFFFF"/>
      <text value="GALAXY TOOLS HUB // ADMIN CONSOLE" font="label_caps" color="#FFFFFF" tracking="widest"/>
    </brand>
    <status layout="horizontal" alignment="center" gap="16px">
      <text value="SYS_TIME: 14:32:00" id="clock" font="technical_data" color="on_tertiary_container"/>
      <avatar size="32px" background="surface_variant" icon="person"/>
    </status>
  </layout>
</component>
```

### 2.2 Task Title & Reference Bar
```xml
<component id="task_title_bar" border_bottom="1px solid outline_variant" padding_bottom="8px" margin_bottom="32px">
  <layout type="horizontal" justify="space-between" alignment="end">
    <group>
      <link label="RETURN TO QUEUE" icon_left="arrow_back" font="technical_data" color="on_surface_variant" hover_color="primary" margin_bottom="4px"/>
      <title value="Payment Verification Task" font="headline_lg" color="primary" transform="uppercase" tracking="tight"/>
    </group>
    <task_badge layout="horizontal" alignment="center" gap="8px">
      <text value="TASK ID:" font="label_caps" color="on_surface_variant"/>
      <text value="TSK-8839-B" font="technical_data" background="surface_container_high" border="1px solid outline_variant" padding="4px 8px" rounded="sm"/>
    </task_badge>
  </layout>
</component>
```

### 2.3 Order Manifest Panel (50% Left)
```xml
<component id="order_manifest_panel" col_span="6" background="surface_container_lowest" border="1px solid outline_variant" rounded="sm" shadow="sm" position="relative" overflow="hidden">
  <status_bar position="absolute top-0 left-0" width="100%" height="4px" background="secondary_container"/>
  <header padding="16px" layout="horizontal" justify="space-between" alignment="start">
    <title value="Order Manifest" icon_left="receipt_long" font="headline_md" color="primary"/>
    <badge value="Pending Payment" icon_left="pending" background="secondary_container" color="on_secondary_container" font="label_caps" border="1px solid secondary" padding="4px 8px"/>
  </header>

  <meta_grid grid="2-col" gap="16px" padding="16px" border_bottom="1px solid outline_variant">
    <field label="ORDER ID" value="#GTH-2026-10492" font_value="technical_data"/>
    <field label="TIMESTAMP" value="2024-10-24 14:32:00 IST" font_value="technical_data"/>
    <field col_span="2" label="CUSTOMER ENTITY" value="Apex Heavy Industries Pvt. Ltd." font_value="body_lg" sub_value="GSTIN: 27AADCB2230M1Z2" sub_font="technical_data"/>
  </meta_grid>

  <line_items padding="16px">
    <table border="1px solid outline_variant" rounded="sm" overflow="hidden">
      <thead background="primary" color="on_primary" font="label_caps">
        <th width="58%">DESCRIPTION</th>
        <th width="16%" alignment="center">QTY</th>
        <th width="26%" alignment="right">TOTAL</th>
      </thead>
      <tbody>
        <row background="surface_container_lowest" font_desc="body_sm" font_data="technical_data">
          <td>Bosch GSB 18V-150 C Professional Impact Drill</td>
          <td alignment="center">1</td>
          <td alignment="right">₹6,228.81</td>
        </row>
        <row background="surface_container_low">
          <td>DeWalt Titanium Drill Bit Set (14-Piece)</td>
          <td alignment="center">1</td>
          <td alignment="right">₹1,121.19</td>
        </row>
      </tbody>
    </table>
  </line_items>

  <financial_summary background="surface_container" padding="16px" border_top="1px solid outline_variant" font="technical_data">
    <row label="SUBTOTAL (EXCL. TAX)" value="₹6,228.81" color="on_surface_variant"/>
    <row label="CGST (9%)" value="₹560.59" color="on_surface_variant"/>
    <row label="SGST (9%)" value="₹560.60" color="on_surface_variant" border_bottom="1px solid outline_variant" padding_bottom="8px"/>
    <row label="GRAND TOTAL" value="₹7,350.00" font="headline_md" color="primary" weight="700" margin_top="8px"/>
  </financial_summary>
</component>
```

### 2.4 Evidence Console Panel (50% Right)
```xml
<component id="evidence_console_panel" col_span="6" background="surface_container_lowest" border="1px solid outline_variant" rounded="sm" shadow="sm" layout="vertical">
  <header background="surface_container_low" padding="16px" border_bottom="1px solid outline_variant">
    <title value="Verification Evidence" icon_left="policy" font="headline_md" color="primary"/>
  </header>

  <utr_section padding="16px" border_bottom="1px solid outline_variant">
    <label value="SUBMITTED UTR REFERENCE" font="label_caps" color="on_surface_variant" margin_bottom="8px"/>
    <layout type="horizontal" gap="8px">
      <display_box flex="1" background="surface_container" border="1px solid outline" padding="8px 12px" font="technical_data" font_size="18px" tracking="wider" value="610492857211"/>
      <button label="COPY" icon_left="content_copy" background="surface_variant" border="1px solid outline_variant" font="label_caps" padding="8px 16px" onclick="alert('UTR Copied')"/>
    </layout>
  </utr_section>

  <image_workspace flex="1" min_height="400px" background="surface_container_high" position="relative" overflow="hidden">
    <toolbar position="absolute top-16px right-16px" z_index="10" background="surface_container_lowest" border="1px solid outline_variant" padding="4px" rounded="sm" shadow="md">
      <icon_button icon="zoom_in" title="Zoom In"/>
      <icon_button icon="zoom_out" title="Zoom Out"/>
      <divider height="1px" margin_y="4px"/>
      <icon_button icon="rotate_right" title="Rotate"/>
      <icon_button icon="fullscreen" title="Fullscreen"/>
    </toolbar>
    <viewport alignment="center" padding="16px">
      <image_wrapper border="2px solid outline_variant" background="#FFFFFF" padding="8px" shadow="lg">
        <image src="{receipt_screenshot}" max_height="500px" object_fit="contain" cursor="zoom-in"/>
      </image_wrapper>
    </viewport>
    <crosshair_guides position="absolute" color="outline_variant" opacity="0.3" pointer_events="none"/>
  </image_workspace>

  <action_bar padding="16px" border_top="1px solid outline_variant" background="surface_container_lowest">
    <label value="FINAL VERIFICATION DECISION" font="label_caps" color="on_surface_variant" alignment="center" margin_bottom="16px"/>
    <grid columns="2" gap="16px">
      <button id="btn_reject" label="REJECT" icon_left="cancel" background="error" color="on_error" font="headline_md" padding_y="12px" border_bottom="4px solid #730005" active_translate_y="1px" hover_bg="#93000A"/>
      <button id="btn_approve" label="APPROVE" icon_left="check_circle" background="primary" color="on_primary" font="headline_md" padding_y="12px" border_bottom="4px solid secondary_container" active_translate_y="1px" hover_bg="#333333"/>
    </grid>
  </action_bar>
</component>
```

---

## 3. DESKTOP WORKSPACE WIREFLOW

```
+====================================================================================+
| [🛡] GALAXY TOOLS HUB // ADMIN CONSOLE                 SYS_TIME: 14:32:00 [👤]    | ← Admin Header
+====================================================================================+
| ← RETURN TO QUEUE                                                                  |
| PAYMENT VERIFICATION TASK                              TASK ID: TSK-8839-B         |
+------------------------------------------------------------------------------------+
|                                                                                    |
| ┌──────────────────────────────────────┐ ┌──────────────────────────────────────┐ |
| │ [🟡 STATUS BAR]                       │ │ Verification Evidence                │ |
| │ Order Manifest      [⏳ Pending]     │ │ ──────────────────────────────────── │ |
| │ ──────────────────────────────────── │ │ SUBMITTED UTR REFERENCE              │ |
| │ ORDER ID: #GTH-2026-10492            │ │ ┌──────────────────────┐ ┌─────────┐ │ |
| │ TIMESTAMP: 2024-10-24 14:32 IST       │ │ │ 610492857211         │ │ [📋COPY]│ │ |
| │ CUSTOMER: Apex Heavy Industries      │ │ └──────────────────────┘ └─────────┘ │ |
| │                                      │ │ ──────────────────────────────────── │ |
| │ LINE ITEMS                           │ │ ┌──────────────────────────────────┐ │ |
| │ ┌──────────────────────────────────┐ │ │  [RECEIPT SCREENSHOT WORKSPACE]    │ │ |
| │ │ Bosch GSB 18V-150 C  1  ₹6,228.81│ │ │  [🔍+] [🔍-] [↻] [⛶]               │ │ |
| │ │ DeWalt Bit Set 14P   1  ₹1,121.19│ │ │                                    │ │ |
| │ └──────────────────────────────────┘ │ │  [Image Preview]                   │ │ |
| │ SUBTOTAL              ₹6,228.81      │ │                                    │ │ |
| │ CGST (9%)               ₹560.59      │ │ └──────────────────────────────────┘ │ |
| │ SGST (9%)               ₹560.60      │ │ FINAL VERIFICATION DECISION          │ |
| │ GRAND TOTAL           ₹7,350.00      │ │ [✕ REJECT]         [✓ APPROVE]     │ |
| └──────────────────────────────────────┘ └──────────────────────────────────────┘ |
|                                                                                    |
+====================================================================================+
```

---

## 4. INTERACTIVE WORKSPACE STATE MATRIX

| Element | Interaction | Target Style |
| :--- | :--- | :--- |
| **Copy Button** | Click | Triggers clipboard copy, displays toast alert |
| **Receipt Image** | Hover | `scale: 1.05`, `cursor: zoom-in` |
| **Zoom Controls** | Hover (Workspace) | Toolbar opacity transitions from `0.5` → `1.0` |
| **REJECT Button** | Active | `border-bottom: 0`, `translateY(1px)`, `background: #93000A` |
| **APPROVE Button** | Active | `border-bottom: 0`, `translateY(1px)`, `background: #333333` |

---

## 5. IMPLEMENTATION DIRECTION FOR GRAPHICS AGENTS

1. **The Shell:** 1280px container with dark `#1C1B1B` admin header and task ID title bar.
2. **Left Panel (Manifest):** Order details grid, line item table, monospace tax/total calculation.
3. **Right Panel (Evidence):** Large UTR copy box, receipt screenshot viewer with floating tool overlays.
4. **The Actions:** Bolted-on dual decision buttons — red REJECT (4px dark red border-bottom) and black APPROVE (4px golden border-bottom).
