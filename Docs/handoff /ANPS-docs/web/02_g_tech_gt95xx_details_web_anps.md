# GALAXY TOOLS HUB: G-TECH GT95XX PDP — ANPS (WEB)
> **Format Version:** 1.2.0-antigravity
> **Target Consumer:** UI/UX Generation Agents, Design Systems Compilers, and Google Stitch Engines
> **Project Identity:** B2B Industrial E-Commerce — Desktop Web Product Detail Page
> **Screen:** G-Tech GT95XX Professional Insulation Tester — PDP

---

## 1. SYSTEM ARCHETYPE & DESIGN TOKENS

```yaml
system:
  project_name: "Galaxy Tools Hub"
  screen: "Product Detail Page (PDP)"
  archetype: "Technical Brutalism, B2B Catalog, High-Data-Density"
  viewport: { type: "desktop", max_width: 1280px }

layout_grid:
  content_split: { gallery: "60%", buy_panel: "40%" }
  gallery_aspect: "4:3"
  thumbnail_row: { count: 4, size: "80x80px", gap: "8px" }
  spec_table: { max_width: "896px", zebra_stripe: "surface_container_low" }

color_tokens:
  # Inherits from Titan Industrial design system
  canvas_base: "#FFFFFF"
  product_image_bg: "#F5F5F7"
  primary: "#000000"
  secondary_container: "#FCD400"     # Golden CTA
  on_secondary_container: "#6E5C00"
  outline_variant: "#C4C7C7"
```

---

## 2. SYSTEM-WIDE ATOMIC COMPONENTS

### 2.1 Product Gallery (60% Left)
```xml
<component id="product_gallery" width="60%" layout="vertical" gap="8px">
  <main_image background="#F5F5F7" border="1px solid outline_variant" rounded="DEFAULT" padding="stack_lg" aspect_ratio="4:3" position="relative" overflow="hidden">
    <badge position="absolute top-16px left-16px" background="primary" color="on_primary" font_size="10px" weight="700" transform="uppercase" padding="4px 8px" value="In Stock"/>
    <image src="{product_image}" object_fit="contain" width="100%" height="100%" mix_blend_mode="multiply" drop_shadow="xl"/>
  </main_image>
  <thumbnail_row layout="horizontal" gap="8px" overflow_x="auto" padding_y="8px">
    <thumbnail state="active" size="80x80px" background="#F5F5F7" border="2px solid primary" rounded="DEFAULT" padding="8px"/>
    <thumbnail state="inactive" size="80x80px" background="#F5F5F7" border="1px solid outline_variant" rounded="DEFAULT" padding="8px" hover_border="primary"/>
    <thumbnail state="video" size="80x80px" overlay_icon="play_circle" opacity="0.5"/>
  </thumbnail_row>
</component>
```

### 2.2 Buy Panel (40% Right)
```xml
<component id="buy_panel" width="40%" layout="vertical" gap="stack_md">
  <!-- Header Info -->
  <group border_bottom="1px solid outline_variant" padding_bottom="stack_md">
    <row layout="horizontal" justify="space-between" alignment="center">
      <image src="{brand_logo}" height="32px"/>
      <sku_badge font="technical_data" color="on_surface_variant" background="surface_container" border="1px solid outline_variant" padding="4px 8px" rounded="sm" value="SKU: GT-95XX-PRO"/>
    </row>
    <title value="Professional Digital Insulation Tester" font="headline_lg" weight="700" margin_top="8px"/>
    <rating_row margin_top="4px">
      <stars count="4.5" color="secondary_container" size="18px"/>
      <text value="48 Technical Reviews" font="body_sm" color="on_surface_variant" text_decoration="underline"/>
    </rating_row>
    <price value="₹12,450" font="display_lg" weight="700" margin_top="16px"/>
    <text value="Incl. GST & Shipping" font="body_sm" color="on_surface_variant" transform="uppercase" letter_spacing="wider"/>
  </group>

  <!-- Variant Selectors -->
  <group padding_y="16px">
    <variant_group label="TEST VOLTAGE RANGE" font_label="label_caps" color_label="on_surface_variant">
      <chip state="active" border="2px solid primary" background="primary_fixed" color="primary" value="250V/500V/1000V"/>
      <chip state="inactive" border="1px solid outline_variant" background="surface" color="on_surface" value="500V/1000V/2500V" hover_border="primary"/>
      <chip state="inactive" value="Solar Special"/>
    </variant_group>
    <variant_group label="DIAGNOSTIC CAPABILITY" margin_top="stack_md">
      <chip state="inactive" value="Standard"/>
      <chip state="active" border="2px solid primary" value="PI/DAR + Rechargeable" icon_right="info" icon_size="14px"/>
    </variant_group>
  </group>

  <!-- Key Specs Strip -->
  <spec_strip background="surface_container_low" border="1px solid outline_variant" rounded="sm" padding="12px">
    <layout type="horizontal-wrap" justify="space-between" gap="8px" font="technical_data" color="on_surface">
      <spec icon="bolt" value="CAT IV 600V"/>
      <spec icon="speed" value="Up to 20GΩ"/>
      <spec icon="battery_charging_full" value="Li-ion"/>
    </layout>
  </spec_strip>

  <!-- Action Buttons -->
  <group layout="vertical" gap="8px" margin_top="8px">
    <button label="ADD TO CART" icon_left="add_shopping_cart" background="secondary_container" color="on_secondary_container" font="body_lg" weight="700" padding_y="12px" rounded="sm" border_bottom="2px solid secondary"/>
    <button label="BUY NOW" icon_left="flash_on" background="primary" color="on_primary" font="body_lg" weight="700" padding_y="12px" rounded="sm" hover_border_bottom="2px solid secondary_container"/>
    <button label="Request Bulk Quote" border="1px solid primary" color="primary" font="body_lg" weight="500" padding_y="8px" rounded="sm" hover_bg="surface_container_low"/>
  </group>

  <!-- Trust Badges -->
  <group layout="horizontal" justify="space-between" margin_top="16px" padding_top="16px" border_top="1px solid outline_variant" font="label_caps" color="on_surface_variant">
    <badge icon="verified" value="1 YR WARRANTY"/>
    <badge icon="assignment_return" value="7 DAY RETURN"/>
    <badge icon="support_agent" value="24/7 SUPPORT"/>
  </group>
</component>
```

### 2.3 Technical Specifications Table
```xml
<component id="spec_table" type="data-table" max_width="896px" margin_top="stack_lg" border_top="1px solid outline_variant" padding_top="stack_lg">
  <title value="Technical Specifications" font="headline_md" weight="700" margin_bottom="16px"/>
  <table border="1px solid outline_variant" rounded="sm" overflow="hidden" font="technical_data">
    <row background="surface_container_low">
      <th width="33%" padding="12px 16px" weight="700" color="on_surface">Test Voltage</th>
      <td padding="12px 16px" color="on_surface_variant">250V / 500V / 1000V</td>
    </row>
    <row>
      <th>Insulation Resistance</th>
      <td>0.1MΩ to 20GΩ</td>
    </row>
    <!-- Alternating zebra rows continue -->
  </table>
</component>
```

---

## 3. DESKTOP PDP WIREFLOW

```
+====================================================================================+
| [🚚] FREE SHIPPING ON BULK ORDERS ABOVE ₹50,000 | GST INVOICE AVAILABLE           |
+====================================================================================+
| GALAXY TOOLS HUB        [🔍 Search...]                    [🛒] [👤] [🔔]          |
|------------------------------------------------------------------------------------|
| Power Tools | Hand Tools | [Testing Eq.▁] | Measuring | Safety | Machinery         |
+====================================================================================+
| Home > Testing Equipment > Insulation Testers                                      |
+------------------------------------------------------------------------------------+
|                                                                                    |
| ┌──────────────────────────────────────┐ ┌──────────────────────────────┐          |
| │  [IN STOCK]                          │ │  [G-TECH Logo]   SKU:GT-95XX│          |
| │                                      │ │                              │          |
| │      [MAIN PRODUCT IMAGE]           │ │  Professional Digital        │          |
| │      (4:3 on #F5F5F7)               │ │  Insulation Tester           │          |
| │                                      │ │  ★★★★☆ 48 Technical Reviews │          |
| │                                      │ │                              │          |
| │                                      │ │  ₹12,450                     │          |
| │                                      │ │  Incl. GST & Shipping        │          |
| ├──────────────────────────────────────┤ │                              │          |
| │ [T1●] [T2] [T3] [▶T4]              │ │  TEST VOLTAGE RANGE          │          |
| └──────────────────────────────────────┘ │  [250V/500V●] [500V/2500V]  │          |
|                                          │  [Solar Special]             │          |
|                                          │                              │          |
|                                          │  DIAGNOSTIC CAPABILITY       │          |
|                                          │  [Standard] [PI/DAR + ℹ●]   │          |
|                                          │                              │          |
|                                          │  ⚡CAT IV | ⚡20GΩ | 🔋Li-ion │          |
|                                          │                              │          |
|                                          │  [🛒 ADD TO CART]            │          |
|                                          │  [⚡ BUY NOW]                │          |
|                                          │  [Request Bulk Quote]        │          |
|                                          │                              │          |
|                                          │  ✓1YR | ↩7DAY | 📞24/7     │          |
|                                          └──────────────────────────────┘          |
+------------------------------------------------------------------------------------+
| Technical Specifications                                                           |
| ┌──────────────────────────────────────────────────────────────┐                   |
| │ Test Voltage     │ 250V / 500V / 1000V                      │                   |
| │ Insulation Res.  │ 0.1MΩ to 20GΩ                            │                   |
| │ Short Circuit    │ < 1.8mA                                  │                   |
| │ Diagnostics      │ PI, DAR                                  │                   |
| │ Safety Rating    │ CAT IV 600V, CAT III 1000V               │                   |
| │ Power Source     │ Li-ion (Included) or 6x AA               │                   |
| └──────────────────────────────────────────────────────────────┘                   |
+====================================================================================+
| GALAXY TOOLS HUB  © 2024        About Us | Contact Sales | Track Order | ...      |
+====================================================================================+
```

---

## 4. INTERACTIVE WORKSPACE STATE MATRIX

| Element | Interaction | Target Style |
| :--- | :--- | :--- |
| **Thumbnail** | Selection | `border: 2px solid primary` |
| **Variant Chip Active** | Selection | `border: 2px solid primary`, `background: primary_fixed` |
| **ADD TO CART** | Hover | `background: secondary_fixed (#FFE16D)` |
| **BUY NOW** | Hover | `border-bottom: 2px solid secondary_container (#FCD400)` |
| **Bulk Quote** | Hover | `background: surface_container_low` |
| **Spec Table Rows** | Zebra | Alternating `surface_container_low` / transparent |
| **Main Image** | View | `mix-blend-mode: multiply`, `drop-shadow: xl` on `#F5F5F7` |

---

## 5. IMPLEMENTATION DIRECTION FOR GRAPHICS AGENTS

1. **The Shell:** 1280px container, announcement bar + multi-row nav header.
2. **The Gallery:** 60% left panel with main 4:3 image on `#F5F5F7` background, thumbnail row below.
3. **The Buy Panel:** 40% right panel — brand logo, SKU, title, price, variant chips, CTAs, trust badges.
4. **The Accent:** Golden `#FCD400` on active variant chips, ADD TO CART button, and nav active state.
5. **The Specs:** Below-fold zebra-striped technical data table in `Noto Sans Mono`.
