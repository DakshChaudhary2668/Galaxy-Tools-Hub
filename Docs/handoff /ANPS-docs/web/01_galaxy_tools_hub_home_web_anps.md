# GALAXY TOOLS HUB: HOME PAGE — AI-NATIVE PRODUCT SPECIFICATION (ANPS)
> **Format Version:** 1.2.0-antigravity
> **Target Consumer:** UI/UX Generation Agents, Design Systems Compilers, and Google Stitch Engines
> **Project Identity:** B2B Industrial E-Commerce Platform — Desktop Web
> **Screen:** Home / Landing Page

---

## 1. SYSTEM ARCHETYPE & DESIGN TOKENS

This section defines the master visual specifications for the Galaxy Tools Hub desktop home page — a high-impact commercial landing surface for B2B industrial tool procurement.

```yaml
system:
  project_name: "Galaxy Tools Hub"
  archetype: "Industrial Premium, Technical Brutalism, B2B E-Commerce"
  viewport: { type: "desktop", max_width: 1280px, state: "centered-container" }

layout_grid:
  announcement_bar: { height: 32px, background: "secondary_container" }
  header: { height: "auto", type: "multi-row", sticky: true }
  nav_links: { border_top: "1px solid outline_variant" }
  content_max: 1280px
  gutter: 24px
  margin_desktop: 40px
  margin_mobile: 16px

color_tokens:
  canvas_base: "#FFFFFF"
  surface: "#F9F9FB"
  surface_container_lowest: "#FFFFFF"
  surface_container_low: "#F3F3F5"
  surface_container: "#EEEEF0"
  surface_container_high: "#E8E8EA"
  on_surface: "#1A1C1D"
  on_surface_variant: "#444748"
  primary: "#000000"                  # Ink Primary — heavy, grounded
  on_primary: "#FFFFFF"
  primary_container: "#1C1B1B"       # Dark container (footer, header dark areas)
  secondary: "#705D00"
  secondary_container: "#FCD400"     # Golden Yellow CTA accent
  on_secondary_container: "#6E5C00"
  outline: "#747878"
  outline_variant: "#C4C7C7"
  error: "#BA1A1A"
  error_container: "#FFDAD6"

  ui_feedback:
    hover_lift: "box-shadow: 0px 4px 8px rgba(0,0,0,0.08); translateY(-2px)"
    btn_primary_hover: "border-bottom-color: #FFD700"

typography_matrix:
  display_lg: { family: "Roboto", size: 48px, weight: 700, leading: 56px, tracking: "-0.02em" }
  headline_lg: { family: "Roboto", size: 32px, weight: 700, leading: 40px }
  headline_md: { family: "Roboto", size: 20px, weight: 500, leading: 28px }
  body_lg: { family: "Roboto", size: 16px, weight: 400, leading: 24px }
  body_sm: { family: "Roboto", size: 14px, weight: 400, leading: 20px }
  label_caps: { family: "Roboto", size: 12px, weight: 700, leading: 16px, tracking: "0.08em" }
  technical_data: { family: "Noto Sans Mono", size: 13px, weight: 500, leading: 16px, tracking: "0.02em" }
```

---

## 2. SYSTEM-WIDE ATOMIC COMPONENTS

### 2.1 Announcement Bar
```xml
<component id="announcement_bar" height="32px" background="secondary_container" layout="horizontal" alignment="center" justify="center">
  <icon type="local_shipping" size="16px" filled="true" margin_right="8px"/>
  <text value="FREE SHIPPING ON BULK ORDERS ABOVE ₹50,000 | GST INVOICE AVAILABLE" font="label_caps" weight="700"/>
</component>
```

### 2.2 Desktop Navigation Header
```xml
<component id="nav_header" background="surface" border_bottom="1px solid outline_variant" sticky="true" z_index="50">
  <row id="top_row" layout="horizontal" justify="space-between" alignment="center" max_width="1280px" padding_x="40px" padding_y="8px">
    <brand>
      <image src="{logo}" height="40px" object_fit="contain"/>
    </brand>
    <search_bar flex="1" max_width="640px" margin_x="32px">
      <input type="text" placeholder="Search SKU or Product Name..." font="body_sm" border="1px solid #E5E5E7" padding_left="40px">
        <icon type="search" position="absolute-left" margin_left="12px" color="on_surface_variant"/>
      </input>
      <state focus="true" border_color="primary" border_left="2px solid #FFD700"/>
    </search_bar>
    <actions layout="horizontal" gap="16px">
      <icon_button icon="person" color="on_surface_variant" hover_bg="surface_container_low"/>
      <icon_button icon="notifications" color="on_surface_variant" hover_bg="surface_container_low"/>
      <icon_button icon="shopping_cart" color="on_surface_variant" hover_bg="surface_container_low">
        <badge type="dot" size="8px" background="secondary_container" position="top-right"/>
      </icon_button>
    </actions>
  </row>
  <row id="nav_links" layout="horizontal" gap="32px" border_top="1px solid outline_variant" padding_top="12px" padding_x="40px">
    <nav_link value="Power Tools" font="label_caps" color="on_surface_variant" transform="uppercase"/>
    <nav_link value="Hand Tools" font="label_caps" color="on_surface_variant" transform="uppercase"/>
    <nav_link value="Testing Eq." font="label_caps" color="primary" weight="700" border_bottom="2px solid secondary_container" state="active"/>
    <nav_link value="Measuring" font="label_caps" color="on_surface_variant" transform="uppercase"/>
    <nav_link value="Safety" font="label_caps" color="on_surface_variant" transform="uppercase"/>
    <nav_link value="Machinery" font="label_caps" color="on_surface_variant" transform="uppercase"/>
  </row>
</component>
```

### 2.3 Hero Split Section
```xml
<component id="hero_section" type="split-layout" grid="12-col" gap="gutter" min_height="500px">
  <left_panel col_span="5" border="1px solid #E5E5E7" background="surface_container_lowest" padding="32px" position="relative">
    <badge value="INDUSTRIAL GRADE" background="secondary_container" color="on_secondary_container" font="label_caps"/>
    <title value="Professional Grade Testing & Soldering Instruments" font="display_lg" color="primary" transform="uppercase" margin_top="24px"/>
    <body value="{description}" font="body_lg" color="on_surface_variant" max_width="448px" margin_top="16px"/>
    <actions layout="horizontal" gap="16px" margin_top="32px">
      <button type="primary" label="Explore Catalog" icon_right="arrow_forward" background="#111111" color="#FFFFFF" font="label_caps" padding="12px 24px"/>
      <button type="tertiary" label="Request Quote" border="1px solid #E5E5E7" font="label_caps" padding="12px 24px" hover_bg="surface_container_low"/>
    </actions>
  </left_panel>
  <right_panel col_span="7" grid="2-col" gap="16px">
    <image_card border="1px solid #E5E5E7" position="relative" overflow="hidden" min_height="240px">
      <image src="{brand_hero_1}" object_fit="cover" hover_scale="1.05" transition="transform 500ms"/>
      <gradient_overlay background="linear-gradient(transparent, rgba(0,0,0,0.6))"/>
      <caption position="bottom-left" padding="16px">
        <text value="{brand_name}" font="headline_md" color="#FFFFFF"/>
        <text value="{spec_line}" font="technical_data" color="surface_container_low"/>
      </caption>
    </image_card>
    <image_card border="1px solid #E5E5E7" position="relative" overflow="hidden" min_height="240px">
      <!-- Same structure as above -->
    </image_card>
  </right_panel>
</component>
```

### 2.4 Trust Badge Row
```xml
<component id="trust_badges" type="horizontal-scroll" padding_y="stack_md" border_y="1px solid outline_variant">
  <layout type="horizontal" justify="space-between" gap="32px" min_width="max-content">
    <badge_item>
      <circle size="48px" border="10px solid #FFD700" background="primary_container">
        <icon type="{icon}" color="#FFFFFF"/>
      </circle>
      <text value="{label}" font="label_caps" color="on_surface_variant"/>
    </badge_item>
    <!-- Repeat: ISO 9001, SECURE, OEM DIRECT, CALIBRATED, COMPLIANT, PRECISE, TESTED -->
  </layout>
</component>
```

### 2.5 Product Card (Desktop)
```xml
<component id="product_card" type="interactive-card" border="1px solid #E5E5E7" background="surface_container_lowest" rounded="sm" hover_effect="hover_lift">
  <status_badge position="absolute top-8px left-8px" background="surface_container" border="1px solid outline_variant" font_size="10px" weight="700" transform="uppercase" padding="2px 8px"/>
  <image_container height="192px" background="#F5F5F7" padding="16px" border_bottom="1px solid outline_variant">
    <image src="{product_image}" object_fit="contain"/>
  </image_container>
  <content padding="16px" flex_grow="1">
    <text value="{category}" font="label_caps" color="on_surface_variant" margin_bottom="4px"/>
    <text value="{product_name}" font="headline_md" color="primary" line_clamp="2" margin_bottom="8px"/>
    <group margin_top="auto">
      <text value="₹{price}" font="headline_md" weight="700" color="primary"/>
      <text value="GST Inc." font="body_sm" color="on_surface_variant" margin_left="4px"/>
      <button label="Add to Quote" icon_left="shopping_cart" background="#FFD700" color="#111111" font="label_caps" transform="uppercase" width="100%" padding_y="8px" rounded="sm" margin_top="12px"/>
    </group>
  </content>
  <spec_strip border_top="1px solid outline_variant" background="surface" padding="8px" alignment="center" font="technical_data" color="on_surface_variant">
    {spec_summary}
  </spec_strip>
</component>
```

### 2.6 Footer
```xml
<component id="footer" background="primary_container" padding_x="40px" padding_y="32px" border_top="1px solid outline_variant">
  <layout type="horizontal" justify="space-between">
    <group>
      <text value="GALAXY TOOLS HUB" font="headline_md" color="#FFFFFF" transform="uppercase"/>
      <text value="© 2024 Galaxy Tools Hub. Industrial Grade Precision." font="body_sm" color="on_primary_container" margin_top="8px"/>
    </group>
    <link_group layout="horizontal-wrap" gap_x="32px" gap_y="16px" max_width="512px">
      <link value="About Us" font="body_sm" color="on_primary_container" hover_color="secondary_fixed"/>
      <link value="Contact Sales" font="body_sm" color="on_primary_container" hover_color="secondary_fixed"/>
      <link value="Track Order" font="body_sm" color="on_primary_container" hover_color="secondary_fixed"/>
      <link value="Refund Policy" font="body_sm" color="on_primary_container" hover_color="secondary_fixed"/>
      <link value="GST Compliance" font="body_sm" color="on_primary_container" hover_color="secondary_fixed"/>
      <link value="Authorized Dealer" font="body_sm" color="on_primary_container" hover_color="secondary_fixed"/>
    </link_group>
  </layout>
</component>
```

---

## 3. MULTI-PANE WORKSPACE WIREFLOW

```
+====================================================================================+
| [🚚] FREE SHIPPING ON BULK ORDERS ABOVE ₹50,000 | GST INVOICE AVAILABLE           | ← 32px Announcement Bar (#FCD400)
+====================================================================================+
| [LOGO]                [🔍 Search SKU or Product...]            [👤] [🔔] [🛒•]    | ← Nav Header Row 1
|------------------------------------------------------------------------------------|
| Power Tools | Hand Tools | [Testing Eq.▁] | Measuring | Safety | Machinery         | ← Nav Links
+====================================================================================+
|                                                                                    |
| ┌─────────────────────────┐ ┌──────────────────────────────────────────────┐       |
| │  INDUSTRIAL GRADE       │ │ ┌──────────────────┐ ┌──────────────────┐   │       |
| │                         │ │ │                  │ │                  │   │       |
| │  Professional Grade     │ │ │  MECO Precision  │ │  HTC Diagnostics │   │       |
| │  Testing & Soldering    │ │ │  CAT III 600V    │ │  HEAVY DUTY|NCV  │   │       |
| │  Instruments            │ │ └──────────────────┘ └──────────────────┘   │       |
| │                         │ │                                            │       |
| │  [Explore Catalog →]    │ │                                            │       |
| │  [Request Quote]        │ │                                            │       |
| └─────────────────────────┘ └──────────────────────────────────────────────┘       |
|                                                                                    |
+------------------------------------------------------------------------------------+
| (✓ISO) (🛡SECURE) (🏭OEM) (🔧CALIB) (⚖COMPL) (⚙PRECISE) (🔬TESTED)              | ← Trust Badges
+------------------------------------------------------------------------------------+
| FEATURED INSTRUMENTS                                             VIEW ALL →        |
|------------------------------------------------------------------------------------| 
| ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                               |
| │[IN STOCK]│ │[LEAD:2D] │ │[IN STOCK]│ │[SPECIAL] │                               |
| │ [Image]  │ │ [Image]  │ │ [Image]  │ │ [Image]  │                               |
| │MULTIMETER│ │MULTIMETER│ │MULTIMETER│ │MEASURING │ ← Category Label               |
| │G-Tech    │ │HTC DM-98 │ │MECO 108P+│ │G-Tech    │                               |
| │GT91      │ │          │ │          │ │CTG999    │                               |
| │₹1,622   │ │₹2,448    │ │₹1,890    │ │₹10,738   │                               |
| │[Add Quote]│ │[Add Quote]│ │[Add Quote]│ │[Specs]  │                               |
| │6000|AUTO │ │TRMS|1000V│ │POCKET|4K │ │COAT|FeNF │ ← Spec Strip (Mono)           |
| └──────────┘ └──────────┘ └──────────┘ └──────────┘                               |
+====================================================================================+
| GALAXY TOOLS HUB                    About Us | Contact Sales | Track Order |...    | ← Dark Footer
| © 2024 Industrial Grade Precision   Refund Policy | GST Compliance | Auth Dealer   |
+====================================================================================+
```

---

## 4. INTERACTIVE WORKSPACE STATE MATRIX

| Element | Interaction | Target Style |
| :--- | :--- | :--- |
| **Product Card** | Hover | `box-shadow: 0px 4px 8px rgba(0,0,0,0.08)`, `translateY(-2px)` |
| **Primary Button** | Hover | `border-bottom-color: #FFD700` (2px golden underline) |
| **Nav Link (Active)** | Selection | `border-bottom: 2px solid #FCD400`, `color: primary`, `font-weight: 700` |
| **Search Input** | Focus | `border-color: #111`, `border-left: 2px solid #FFD700` |
| **Footer Links** | Hover | `color: secondary_fixed (#FFE16D)` |
| **Hero Images** | Hover | `scale: 1.05`, `transition: transform 500ms` |
| **Icon Buttons** | Hover | `background: surface_container_low`, `border-radius: full` |

---

## 5. IMPLEMENTATION DIRECTION FOR GRAPHICS AGENTS

1. **The Shell:** Establish the white `#FFFFFF` canvas with 1280px centered container.
2. **The Density:** Golden announcement bar at top, multi-row header with search and category nav.
3. **The Hero:** Split 5/7 grid — text-heavy CTA panel left, dual brand image cards right.
4. **The Trust Row:** Horizontal badge strip with golden ring circles containing white icons.
5. **The Products:** 4-column product card grid with spec strips, hover lift effects, and golden CTAs.
6. **The Footer:** Dark `#1C1B1B` container with white branding and link columns.
