# GALAXY TOOLS HUB: G-TECH GT95XX PRODUCT DETAIL PAGE — ANPS
> **Version:** 1.0.0-alpha
> **Role:** Product Detail Page (PDP) Specification — Mobile
> **Theme:** Industrial Premium / High-Density Light Mode
> **Platform:** Android / Mobile Web (4-column fluid grid)

---

## SECTION 1: SYSTEM ARCHETYPE & DESIGN TOKENS

The GT95XX PDP is the core conversion screen of the Galaxy Tools Hub e-commerce platform. It must render as a high-information-density technical product page optimized for vertical scrolling on mobile devices, presenting product imagery, variant selectors, pricing, and expandable spec sheets.

### 1.1 Layout Architecture
- **Viewport:** Mobile-first, max-width 480px logical.
- **TopAppBar:** 56px sticky header. Hamburger + brand left, cart right.
- **Content Canvas:** Full-width stacked layout with 16px horizontal margins.
- **Sticky Bottom Bar:** Fixed action bar with quantity selector (35%) and "ADD TO CART" CTA (65%).
- **Body Padding Bottom:** 90px to clear the sticky bar.

### 1.2 Color & Contrast Tokens
| Token | Value | Application |
| :--- | :--- | :--- |
| **Surface** | `#F9F9F9` | Main canvas background. |
| **Surface Container Low** | `#F3F3F3` | Product image carousel background. |
| **Surface Container** | `#EEEEEE` | Spec ribbon background. |
| **Primary Container** | `#FFD700` | Active variant selector, carousel active dot, CTA. |
| **On-Primary-Container** | `#705E00` | Text on golden CTA / variant buttons. |
| **Outline Variant** | `#D0C6AB` | Borders, dividers, inactive carousel dots. |
| **Secondary** | `#5F5E5E` | Muted text, review count, strikethrough price. |
| **Error Container** | `#FFDAD6` | Discount badge background. |
| **On-Error-Container** | `#93000A` | Discount badge text ("7% OFF"). |
| **Inverse Surface** | `#2F3131` | Brand badge background ("G-Tech Instruments"). |

### 1.3 Typography Matrix
- **Interface UI:** `Roboto, sans-serif`
  - *Headline LG Mobile:* 28px / 36px / 700 (Product title: "GT95XX Professional Series")
  - *Headline MD:* 24px / 32px / 600 (Price display, quantity counter)
  - *Body MD:* 14px / 20px / 400 (Variant button labels, accordion headers)
  - *Label Caps:* 12px / 16px / 700, letter-spacing: 1px (Section overlines, GST note, breadcrumbs)
  - *Body LG:* 16px / 24px / 400 (Strikethrough original price)
- **Monospace Engine:** `Noto Sans Mono, monospace`
  - *Tech Data:* 13px / 18px / 500 (Spec ribbon: "Resolved Model: GT9511 TRMS")

---

## SECTION 2: SYSTEM-WIDE ATOMIC COMPONENTS

### 2.1 BREADCRUMB_NAV
```xml
<component id="breadcrumb_nav" type="navigation" padding_x="margin" padding_top="stack_md">
  <layout type="horizontal" alignment="center" gap="4px">
    <text value="HOME" font="label_caps" color="secondary" transform="uppercase"/>
    <icon type="chevron_right" size="14px" color="secondary"/>
    <text value="TESTING & DIAGNOSTIC" font="label_caps" color="secondary" transform="uppercase"/>
    <icon type="chevron_right" size="14px" color="secondary"/>
    <text value="Insulation Testers" font="label_caps" color="on_surface"/>
  </layout>
</component>
```

### 2.2 BRAND_BADGE
```xml
<component id="brand_badge" type="chip" background="inverse_surface" padding="4px 8px" rounded="sm">
  <text value="G-Tech Instruments" font="label_caps" color="inverse_on_surface" transform="uppercase"/>
</component>
```

### 2.3 IMAGE_CAROUSEL
```xml
<component id="product_carousel" type="swipeable-gallery" width="100%" height="320px" background="surface_container_low">
  <image src="{product_image}" object_fit="contain" height="80%" drop_shadow="md"/>
  <pagination_dots position="bottom-center" margin_bottom="16px" gap="8px">
    <dot state="inactive" size="8px" background="outline_variant" rounded="full"/>
    <dot state="active" size="8px" background="primary_container" border="1px solid primary" rounded="full"/>
  </pagination_dots>
</component>
```

### 2.4 PRICING_BLOCK
```xml
<component id="pricing_block" type="content-group" padding_x="margin" padding_top="stack_md">
  <layout type="vertical">
    <group layout="horizontal" alignment="baseline" gap="12px">
      <text value="₹{sale_price}" font="headline_lg_mobile" weight="900" color="on_surface"/>
      <text value="₹{original_price}" font="body_lg" color="secondary" text_decoration="line-through"/>
      <badge background="error_container" color="on_error_container" font="label_caps" padding="4px 8px" rounded="sm" value="{discount}% OFF"/>
    </group>
    <text value="Inclusive of 18% GST" font="label_caps" color="secondary" margin_top="4px"/>
  </layout>
</component>
```

### 2.5 SPEC_RIBBON
```xml
<component id="spec_ribbon" type="info-strip" background="surface_container" padding_y="12px" padding_x="margin" border_y="1px solid outline_variant" margin_top="stack_lg">
  <layout type="vertical" gap="4px">
    <spec_row icon="check_circle" value="Resolved Model: {model}" font="tech_data" color="on_surface_variant"/>
    <spec_row icon="speed" value="Max Res: {max_res}" font="tech_data" color="on_surface_variant"/>
    <spec_row icon="cable" value="Includes {accessories}" font="tech_data" color="on_surface_variant"/>
  </layout>
</component>
```

### 2.6 VARIANT_SELECTOR_GROUP
```xml
<component id="variant_group" type="selection-group" padding_x="margin" padding_top="stack_lg">
  <label value="{group_label}" font="label_caps" transform="uppercase" letter_spacing="wider" margin_bottom="stack_sm"/>
  <layout type="horizontal-wrap" gap="8px">
    <button state="inactive" font="body_md" padding="8px 16px" border="1px solid outline_variant" rounded="md" background="surface_container_lowest" color="secondary"/>
    <button state="active" font="body_md" weight="700" padding="8px 16px" border="1px solid primary" rounded="md" background="primary_container" color="on_primary_container" shadow="sm">
      <icon id="feature_icon" type="{icon}" size="18px" visibility="conditional"/>
    </button>
  </layout>
</component>
```

### 2.7 EXPANDABLE_ACCORDION
```xml
<component id="spec_accordion" type="collapsible" border_top="1px solid outline_variant" margin_top="stack_lg">
  <item>
    <header padding_x="margin" padding_y="16px" border_bottom="1px solid outline_variant" background="surface" hover_background="surface_container_low">
      <layout type="horizontal" justify="space-between" alignment="center">
        <text value="{section_title}" font="body_md" weight="700" transform="uppercase"/>
        <icon type="expand_more" color="secondary"/>
      </layout>
      <subtitle font="label_caps" color="primary" margin_top="4px" visibility="conditional" value="{subtitle_hint}"/>
    </header>
  </item>
</component>
```

### 2.8 STICKY_BOTTOM_BAR
```xml
<component id="sticky_bottom_bar" type="fixed-footer" background="surface_container_lowest" border_top="1px solid outline_variant" padding="16px" shadow="0 -4px 16px rgba(0,0,0,0.05)" z_index="50">
  <layout type="horizontal" gap="12px">
    <quantity_selector width="35%" border="1px solid outline_variant" rounded="md" padding="12px" background="surface">
      <layout type="horizontal" justify="space-between" alignment="center">
        <icon type="remove" color="secondary" touch_target="48x48"/>
        <text value="{quantity}" font="headline_md" color="on_surface"/>
        <icon type="add" color="secondary" touch_target="48x48"/>
      </layout>
    </quantity_selector>
    <button id="add_to_cart" flex_grow="1" background="primary_container" color="on_primary_container" font="body_md" weight="700" size="16px" transform="uppercase" letter_spacing="wider" rounded="md" shadow="sm">
      <icon type="shopping_bag" filled="true" margin_right="8px"/>
      ADD TO CART
    </button>
  </layout>
</component>
```

---

## SECTION 3: FULL SCREEN WIREFLOW

```
+--------------------------------------------------+
| [☰] GALAXY TOOLS                          [🛒]   | ← 56px TopAppBar
+--------------------------------------------------+
| HOME > TESTING & DIAGNOSTIC > Insulation Testers  |
|                                [G-TECH INSTRUMENTS]| ← Brand badge
+--------------------------------------------------+
| ┌──────────────────────────────────────────────┐ |
| │                                              │ |
| │         [Product Image: GT95XX]              │ | ← 320px carousel
| │              on #F3F3F3 bg                   │ |
| │                                              │ |
| └──────────────────────────────────────────────┘ |
|              ○ ● ○ ○                            | ← Carousel dots
+--------------------------------------------------+
| GT95XX Professional Series                       | ← 28px headline
| ★★★★☆ 4.8 (12 Reviews)                         | ← Rating + reviews
|                                                  |
| ₹6,785  ₹7,316  [7% OFF]                       | ← Price + discount
| Inclusive of 18% GST                             |
+--------------------------------------------------+
| ┌──────────────────────────────────────────────┐ |
| │ ✓ Resolved Model: GT9511 TRMS               │ | ← Spec ribbon
| │ ⚡ Max Res: 20 G-OHMS                        │ |   (monospace)
| │ 🔌 Includes Charger & Probe Set              │ |
| └──────────────────────────────────────────────┘ |
+--------------------------------------------------+
| TEST VOLTAGE CAPABILITY                          |
| [250V/500V/1000V] [50V/.../1000V●] [500V/2500V] | ← Variant group
|                                                  |
| POWER & FEATURES                                 |
| [Standard Dry Cells] [🔋 Rechargeable + PI/DAR●] | ← Variant group
+--------------------------------------------------+
| DETAILED TECHNICAL SPECIFICATIONS          ▼     |
+--------------------------------------------------+
| SHIPPING TRACKER                           ▼     |
| Add ₹878 more for FREE SHIPPING                 |
+--------------------------------------------------+
| WARRANTY INFORMATION                       ▼     |
+--------------------------------------------------+
|                                                  |
| ┌──────────────────────────────────────────────┐ |
| │  [−]    1    [+]  │  [🛒 ADD TO CART]        │ | ← Sticky bottom bar
| └──────────────────────────────────────────────┘ |
+--------------------------------------------------+
```

---

## SECTION 4: INTERACTIVE WORKSPACE STATE MATRIX

| Interaction | Visual Change | CSS / Token Rule |
| :--- | :--- | :--- |
| **Variant Button Inactive** | Border: `outline_variant`, BG: `surface_container_lowest` | `text-secondary` |
| **Variant Button Active** | Border: `primary`, BG: `primary_container`, Weight: bold | `shadow-sm font-bold` |
| **Accordion Hover** | BG: `surface_container_low` | `transition-colors cursor-pointer` |
| **Add to Cart Tap** | Opacity: 0.9, Scale: 0.98 | `active:opacity-90 active:scale-[0.98] transition-all` |
| **Carousel Swipe** | Image transitions; dot state updates | Active dot: `primary_container`, border `primary` |
| **Quantity +/- Hover** | Icon color: `on_surface` | `hover:text-on-surface` from `text-secondary` |

---

## SECTION 5: IMPLEMENTATION DIRECTION FOR GRAPHICS AGENTS

1. **Step 1:** Establish the light surface `#F9F9F9` background with full-width stacked sections.
2. **Step 2:** Render breadcrumbs in `label_caps` with chevron separators; brand badge floats right.
3. **Step 3:** Product image carousel — 320px tall, centered image on `#F3F3F3` background with carousel dots below.
4. **Step 4:** Product title in bold 28px, star rating row with golden filled stars, review count.
5. **Step 5:** Pricing block — large bold sale price, strikethrough original, red discount badge.
6. **Step 6:** Spec ribbon in `surface_container` with monospace font and leading icons.
7. **Step 7:** Variant selector groups — radio-button style chips; active state uses golden container.
8. **Step 8:** Accordion sections with bold uppercase headers and chevron toggles.
9. **Step 9:** Sticky bottom bar with quantity selector left, golden "ADD TO CART" button right.
