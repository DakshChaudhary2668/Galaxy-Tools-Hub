# GALAXY TOOLS HUB: HOME SCREEN — AI-NATIVE PRODUCT SPECIFICATION (ANPS)
> **Version:** 1.0.0-alpha
> **Role:** Master Architectural Specification — Mobile Home / Landing Screen
> **Theme:** Industrial Premium / High-Density Light Mode
> **Platform:** Android / Mobile Web (4-column fluid grid)

---

## SECTION 1: SYSTEM ARCHETYPE & DESIGN TOKENS

The Galaxy Tools Hub Home screen is the primary commercial entry point for a B2B industrial tools e-commerce platform. It must render as a high-confidence, data-dense product discovery surface — clean, functional, and engineered for rapid vertical scrolling on Android devices.

### 1.1 Layout Architecture
- **Viewport:** Mobile-first, max-width 480px logical, full-bleed.
- **TopAppBar:** 56px sticky header. Hamburger left, brand center, cart right.
- **Content Canvas:** 4-column grid, 12px gutters, 16px outer margins.
- **BottomNavBar:** 64px fixed footer. 4 icons: Home (active), Search, Orders, Profile.
- **Vertical Rhythm:** 4px baseline grid; all spacing in multiples of 4 (8, 12, 16, 24).

### 1.2 Color & Contrast Tokens
| Token | Value | Application |
| :--- | :--- | :--- |
| **Surface** | `#F9F9F9` | Main canvas background. |
| **Surface Container Lowest** | `#FFFFFF` | Cards, input fields, elevated containers. |
| **Surface Container Low** | `#F3F3F3` | Product image backgrounds, secondary surfaces. |
| **On-Surface** | `#1A1C1C` | Primary text, headlines, product names. |
| **On-Surface-Variant** | `#4D4732` | Secondary labels, category descriptions. |
| **Primary** | `#705D00` | Brand accent in text/icons (e.g., active category). |
| **Primary Container** | `#FFD700` | Golden Yellow. CTAs, active nav, badges, "Shop Now". |
| **On-Primary-Container** | `#705E00` | Text on golden CTA surfaces. |
| **Outline Variant** | `#D0C6AB` | Card borders, dividers, input strokes. |
| **Secondary** | `#5F5E5E` | Muted text, inactive nav labels. |
| **Inverse Surface** | `#2F3131` | Dark-fill add-to-cart buttons, hero overlays. |

### 1.3 Typography Matrix
- **Interface UI:** `Roboto, sans-serif`
  - *Headline MD:* 24px / 32px / 600 (Section headers: "GALAXY TOOLS", "Featured Deals")
  - *Body MD:* 14px / 20px / 400 (Product names, category items)
  - *Label Caps:* 12px / 16px / 700, letter-spacing: 1px (Overlines, badges, nav labels)
- **Monospace Engine:** `Noto Sans Mono, monospace`
  - *Tech Data:* 13px / 18px / 500 (SKU specs, count data: "6000 Counts")

---

## SECTION 2: SYSTEM-WIDE ATOMIC COMPONENTS

### 2.1 TOP_APP_BAR
```xml
<component id="top_app_bar" type="sticky-header" height="56px" background="surface" border_bottom="1px solid outline_variant">
  <layout type="horizontal" alignment="center" justify="space-between" padding_x="margin">
    <button icon="menu" size="24px" color="on_surface_variant" touch_target="48x48"/>
    <text value="GALAXY TOOLS" font="headline_md" weight="900" color="on_surface"/>
    <button icon="shopping_cart" size="24px" color="on_surface_variant" touch_target="48x48">
      <badge type="dot" size="8px" background="primary_container" position="top-right"/>
    </button>
  </layout>
</component>
```

### 2.2 SEARCH_FIELD
```xml
<component id="search_field" type="input" col_span="4" background="surface_container_lowest" border="1px solid outline_variant" rounded="DEFAULT">
  <layout type="horizontal" alignment="center" padding="12px">
    <icon id="search_icon" type="search" size="24px" color="on_surface_variant" position="left"/>
    <input placeholder="Search 100+ tools or SKUs..." font="body_md" color="on_surface"/>
    <icon id="mic_icon" type="mic" size="24px" color="on_surface_variant" position="right"/>
  </layout>
  <state focus="true" border="primary_container" ring="1px primary_container"/>
</component>
```

### 2.3 HERO_CAROUSEL_SLIDE
```xml
<component id="hero_carousel" type="image-overlay-card" col_span="4" aspect_ratio="16:9" rounded="DEFAULT" overflow="hidden">
  <image src="{hero_image}" object_fit="cover" width="100%" height="100%"/>
  <overlay background="linear-gradient(transparent, rgba(0,0,0,0.4))"/>
  <content position="bottom-left" padding="stack_md" z_index="10">
    <text value="{headline}" font="headline_md" weight="700" color="on_primary" multiline="true"/>
    <button label="SHOP NOW" background="primary_container" color="on_primary_container" font="label_caps" padding="8px 16px" rounded="DEFAULT" shadow="md"/>
  </content>
  <pagination_dots position="bottom-center" active_color="primary_container" inactive_color="outline_variant" size="8px" gap="8px"/>
</component>
```

### 2.4 TRUST_SYMBOL_ROW
```xml
<component id="trust_symbol" type="horizontal-scroll-item" min_width="72px">
  <layout type="vertical" alignment="center" gap="8px">
    <circle size="48px" border="1px solid primary_container" background="surface_container_lowest">
      <icon type="{icon_name}" size="24px" color="primary" filled="true"/>
    </circle>
    <text value="{label}" font="label_caps" size="10px" color="on_surface_variant" alignment="center"/>
  </layout>
</component>
```

### 2.5 CATEGORY_ACCORDION
```xml
<component id="category_accordion" type="expandable-list" col_span="4" border="1px solid outline_variant" rounded="DEFAULT" background="surface_container_lowest">
  <item state="collapsed">
    <layout type="horizontal" alignment="center" justify="space-between" padding="16px" border_bottom="1px solid outline_variant">
      <text value="{category_name}" font="body_md" weight="700" transform="uppercase"/>
      <icon type="expand_more" size="24px" color="secondary"/>
    </layout>
  </item>
  <item state="expanded">
    <header background="surface_container_low">
      <text value="{category_name}" font="body_md" weight="700" transform="uppercase" color="primary"/>
      <icon type="expand_less" color="primary"/>
    </header>
    <children padding_left="24px" padding_right="16px" padding_y="8px">
      <link value="{subcategory}" font="body_md" color="on_surface_variant" padding_y="8px" hover_color="primary"/>
    </children>
  </item>
</component>
```

### 2.6 PRODUCT_CARD_GRID
```xml
<component id="product_card" type="interactive-card" col_span="2" border="1px solid outline_variant" rounded="DEFAULT" background="surface_container_lowest" padding="8px">
  <badge id="status_badge" position="top-left" background="primary_container" color="on_primary_container" font="label_caps" size="10px" padding="2px 6px" z_index="10" value="{status}"/>
  <image_container aspect_ratio="1:1" background="surface_container_low" padding="8px" rounded="sm" margin_bottom="8px">
    <image src="{product_image}" object_fit="contain" width="100%" height="100%"/>
  </image_container>
  <content layout="vertical" flex_grow="1" justify="space-between">
    <group>
      <text value="{product_name}" font="body_md" weight="700" line_clamp="2"/>
      <text value="{spec_summary}" font="tech_data" color="secondary" margin_top="4px"/>
    </group>
    <group layout="horizontal" justify="space-between" alignment="center" margin_top="8px" padding_top="8px" border_top="1px solid outline_variant">
      <text value="₹{price}" font="body_md" weight="700"/>
      <button icon="add" size="18px" width="32px" height="32px" background="inverse_surface" color="on_primary" rounded="DEFAULT"/>
    </group>
  </content>
</component>
```

### 2.7 BOTTOM_NAV_BAR
```xml
<component id="bottom_nav_bar" type="fixed-footer" height="64px" background="surface" border_top="1px solid outline_variant" z_index="50">
  <layout type="horizontal" justify="space-around" alignment="center" padding_x="8px">
    <nav_item state="active" icon="home" label="Home" icon_filled="true" color="primary" background="primary_container/20" rounded="xl" padding="4px 16px"/>
    <nav_item state="inactive" icon="search" label="Search" color="secondary"/>
    <nav_item state="inactive" icon="package_2" label="Orders" color="secondary"/>
    <nav_item state="inactive" icon="person" label="Profile" color="secondary"/>
  </layout>
</component>
```

---

## SECTION 3: FULL SCREEN WIREFLOW

```
+--------------------------------------------------+
| [☰]         GALAXY TOOLS          [🛒•]          | ← 56px TopAppBar (sticky)
+--------------------------------------------------+
| [🔍] Search 100+ tools or SKUs...         [🎤]   | ← Search Field
+--------------------------------------------------+
| ┌──────────────────────────────────────────────┐ |
| │  [Background: Hero Image — Multimeter]       │ |
| │                                              │ |
| │  Professional Grade                          │ |
| │  Testing Instruments                         │ |
| │  [ SHOP NOW ]                                │ |
| └──────────────────────────────────────────────┘ |
|              ● ○ ○ ○                            | ← Carousel Dots
+--------------------------------------------------+
| (💳)    (🔧)    (🚚)    (✓)    (📞)            | ← Trust Symbols (h-scroll)
| Pricing  Solutions Delivery Quality Support      |
+--------------------------------------------------+
| ┌──────────────────────────────────────────────┐ |
| │ SOLDERING                              ▼     │ |
| ├──────────────────────────────────────────────┤ |
| │ TESTING & DIAGNOSTIC                   ▲     │ | ← Expanded (active: primary)
| │   Multimeters                                │ |
| │   Clamp Meters                               │ |
| │   Insulation Testers                         │ |
| │   Earth Testers                              │ |
| ├──────────────────────────────────────────────┤ |
| │ PRECISION MEASURING                    ▼     │ |
| ├──────────────────────────────────────────────┤ |
| │ POWER TOOLS                            ▼     │ |
| └──────────────────────────────────────────────┘ |
+--------------------------------------------------+
| Featured Deals                                   |
| ┌──────────┐ ┌──────────┐                       |
| │ [IN STOCK]│ │          │                       |
| │ [Image]  │ │ [Image]  │                       |
| │ G-Tech   │ │ MECO     │                       |
| │ GT91     │ │ 108P+    │                       |
| │ 6000 Cnt │ │ NCV      │                       |
| │ ₹1,622[+]│ │ ₹1,890[+]│                       |
| └──────────┘ └──────────┘                       |
+--------------------------------------------------+
| [🏠]    [🔍]    [📦]    [👤]                     | ← 64px BottomNavBar (fixed)
|  Home   Search  Orders  Profile                  |
+--------------------------------------------------+
```

---

## SECTION 4: INTERACTIVE WORKSPACE STATE MATRIX

| Interaction | Visual Change | CSS / Token Rule |
| :--- | :--- | :--- |
| **Search Focus** | Border: `primary_container`, Ring: 1px | `focus:border-primary-container focus:ring-1` |
| **Hero CTA Tap** | Scale: 0.95 | `active:scale-95 transition-transform` |
| **Category Expand** | BG: `surface_container_low`, text: `primary` | Toggle `expand_more`↔`expand_less` icon |
| **Product Card Hover** | No hover on mobile; tap feedback via opacity | `active:opacity-80` |
| **Add Button Tap** | Scale: 0.95 | `active:scale-95 transition-transform` |
| **Bottom Nav Active** | BG tint: `primary_container/20`, icon filled | `font-variation-settings: 'FILL' 1` |

---

## SECTION 5: IMPLEMENTATION DIRECTION FOR GRAPHICS AGENTS

1. **Step 1:** Establish the light industrial canvas `#F9F9F9` with edge-to-edge layout.
2. **Step 2:** Render the TopAppBar with centered bold "GALAXY TOOLS" wordmark — this is the brand anchor.
3. **Step 3:** Build the search field with left search icon and right microphone icon, bordered with `outline_variant`.
4. **Step 4:** Hero carousel with dark overlay gradient and golden CTA button — the primary conversion driver.
5. **Step 5:** Trust symbols in a horizontally scrollable row, each icon inside a golden-bordered circle.
6. **Step 6:** Category accordion with clean expand/collapse states; active category text in `primary`.
7. **Step 7:** Product cards in a 2-column grid, each with status badge, image, name, specs, price, and add button.
8. **Step 8:** Fixed bottom navigation with 4 items; active item highlighted with golden tint background.
