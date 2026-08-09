# GALAXY TOOLS HUB: ADMIN PAYMENT VERIFICATION — ANPS (MOBILE)
> **Version:** 1.0.0-alpha
> **Role:** Admin Operations Desk — Payment Verification Screen — Mobile
> **Theme:** Industrial Premium / High-Density Light Mode
> **Platform:** Android / Mobile Web (4-column fluid grid)

---

## SECTION 1: SYSTEM ARCHETYPE & DESIGN TOKENS

The Admin Payment Verification screen is an internal operations tool for the Galaxy Tools Hub finance desk. It presents order details, UTR references, and uploaded receipt evidence for manual payment verification. Admins can approve or reject payments with a sticky dual-action bottom bar.

### 1.1 Layout Architecture
- **Viewport:** Mobile-first, max-width 672px.
- **TopAppBar:** 56px sticky header. Hamburger left, "GALAXY TOOLS" center, cart right.
- **Content Canvas:** Vertical stack with 16px margins, 24px gaps.
- **Sticky Bottom Bar:** Dual-action bar — "Reject" (outlined, error) and "Approve & Mark Paid" (filled, tertiary teal).
- **Body Padding Bottom:** 128px to clear the sticky bar.

### 1.2 Color & Contrast Tokens
| Token | Value | Application |
| :--- | :--- | :--- |
| **Background** | `#F9F9F9` | Page background. |
| **Surface Container Lowest** | `#FFFFFF` | Order card, receipt container. |
| **Primary** | `#705D00` | Admin panel icon, header text. |
| **Primary Container** | `#FFD700` | Decorative corner accent. |
| **Tertiary** | `#00696F` | "Approve & Mark Paid" CTA background. |
| **On-Tertiary** | `#FFFFFF` | Approve button text. |
| **Error** | `#BA1A1A` | "Reject" button border/text. |
| **Error Container** | `#FFDAD6` (50% opacity) | Reject button active state. |
| **Outline Variant** | `#D0C6AB` | Card borders, input borders, dividers. |

### 1.3 Typography Matrix
- **Roboto:** Headline MD (24px/600), Body MD (14px/400), Label Caps (12px/700)
- **Noto Sans Mono:** Tech Data (13px/500) — Order ref, UTR number, amount

---

## SECTION 2: SYSTEM-WIDE ATOMIC COMPONENTS

### 2.1 ADMIN_HEADER
```xml
<component id="admin_header" type="content-group" padding_x="margin">
  <layout type="horizontal" alignment="center" gap="8px">
    <icon type="admin_panel_settings" size="24px" color="primary"/>
    <text value="PAYMENT VERIFICATION" font="headline_md" color="on_background"/>
  </layout>
</component>
```

### 2.2 ORDER_DETAILS_CARD
```xml
<component id="order_card" type="card" background="surface_container_lowest" border="1px solid outline_variant" rounded="lg" padding="margin" shadow="sm" position="relative" overflow="hidden">
  <decorative_accent position="absolute top-0 right-0" width="64px" height="64px" background="primary_container" opacity="0.1" rounded="bl-full"/>
  <group layout="horizontal" justify="space-between" margin_bottom="stack_sm">
    <field label="ORDER REF" value="#GTH-2026-10492" label_font="label_caps" value_font="tech_data"/>
    <field label="TOTAL AMOUNT" value="₹6,785" label_font="label_caps" value_font="headline_md" alignment="right"/>
  </group>
  <divider height="1px" background="outline_variant"/>
  <group layout="grid" columns="2" gap="stack_md" margin_top="stack_sm">
    <field label="CLIENT" value="Rajesh Kumar Eng." label_font="label_caps" value_font="body_md" weight="500"/>
    <field label="DATE" value="Oct 24, 2023" label_font="label_caps" value_font="body_md" weight="500"/>
  </group>
</component>
```

### 2.3 UTR_DISPLAY
```xml
<component id="utr_display" type="content-group">
  <label value="REPORTED UTR REFERENCE" font="label_caps" transform="uppercase"/>
  <display_field border="1px solid outline_variant" padding="12px" background="surface" rounded="DEFAULT">
    <layout type="horizontal" justify="space-between" alignment="center">
      <text value="610492857211" font="tech_data" weight="700" size="18px" letter_spacing="wider"/>
      <button icon="content_copy" size="14px" color="primary" hover_color="primary_container"/>
    </layout>
  </display_field>
</component>
```

### 2.4 RECEIPT_EVIDENCE_VIEWER
```xml
<component id="receipt_viewer" type="image-viewer">
  <header layout="horizontal" justify="space-between" alignment="center">
    <label value="PAYMENT RECEIPT EVIDENCE" font="label_caps" transform="uppercase"/>
    <link icon="zoom_in" label="Zoom" font="label_caps" color="tertiary"/>
  </header>
  <image_container aspect_ratio="3:4" background="surface_container_low" border="1px solid outline_variant" rounded="DEFAULT" overflow="hidden" cursor="zoom-in">
    <image src="{receipt_image}" object_fit="cover" hover_scale="1.05" transition="transform 300ms"/>
    <overlay visibility="on_hover" background="on_background/10">
      <icon type="fullscreen" size="40px" color="surface"/>
    </overlay>
  </image_container>
</component>
```

### 2.5 ADMIN_ACTION_BAR
```xml
<component id="admin_action_bar" type="fixed-footer" background="surface_container_lowest" border_top="1px solid outline_variant" padding="margin" z_index="50">
  <layout type="horizontal" gap="gutter">
    <button id="reject" flex="1" border="1px solid error" color="error" font="label_caps" transform="uppercase" padding_y="12px" rounded="DEFAULT">
      <icon type="close" size="16px" margin_right="8px"/>
      Reject
    </button>
    <button id="approve" flex="2" background="tertiary" color="on_tertiary" font="label_caps" transform="uppercase" padding_y="12px" rounded="DEFAULT" shadow="sm">
      <icon type="check_circle" size="16px" margin_right="8px"/>
      Approve & Mark Paid
    </button>
  </layout>
</component>
```

---

## SECTION 3: FULL SCREEN WIREFLOW

```
+--------------------------------------------------+
| [☰]         GALAXY TOOLS          [🛒]           | ← TopAppBar
+--------------------------------------------------+
| 🛡 PAYMENT VERIFICATION                          |
+--------------------------------------------------+
| ┌──────────────────────────────────────────────┐ |
| │ ORDER REF                   TOTAL AMOUNT     │ |
| │ #GTH-2026-10492                   ₹6,785     │ |
| │ ──────────────────────────────────────       │ |
| │ CLIENT                DATE                   │ |
| │ Rajesh Kumar Eng.     Oct 24, 2023           │ |
| └──────────────────────────────────────────────┘ |
+--------------------------------------------------+
| REPORTED UTR REFERENCE                           |
| ┌──────────────────────────────────────────────┐ |
| │ 610492857211                          [📋]   │ |
| └──────────────────────────────────────────────┘ |
+--------------------------------------------------+
| PAYMENT RECEIPT EVIDENCE              🔍 Zoom    |
| ┌──────────────────────────────────────────────┐ |
| │                                              │ |
| │         [Receipt Image]                      │ |
| │         (3:4 aspect ratio)                   │ |
| │                                              │ |
| │         Hover: zoom overlay                  │ |
| │                                              │ |
| └──────────────────────────────────────────────┘ |
+--------------------------------------------------+
| ┌──────────────────────────────────────────────┐ |
| │  [✕ REJECT]    │  [✓ APPROVE & MARK PAID]   │ | ← Sticky action bar
| └──────────────────────────────────────────────┘ |
+--------------------------------------------------+
```

---

## SECTION 4: INTERACTIVE WORKSPACE STATE MATRIX

| Interaction | Visual Change | CSS / Token Rule |
| :--- | :--- | :--- |
| **Reject Button Active** | BG: `error_container/50` | `active:bg-error-container/50 transition-colors` |
| **Approve Button Active** | Opacity: 0.9, Scale: 0.98 | `active:opacity-90 active:scale-[0.98] transition-all` |
| **Receipt Image Hover** | Scale: 1.05, fullscreen overlay | `group-hover:scale-105 transition-transform duration-300` |
| **Copy UTR Click** | Color transition, toast feedback | `hover:text-primary-container transition-colors` |

---

## SECTION 5: IMPLEMENTATION DIRECTION FOR GRAPHICS AGENTS

1. **Step 1:** Establish the light `#F9F9F9` canvas with admin panel icon header.
2. **Step 2:** Order details card with decorative golden corner accent (opacity 0.1).
3. **Step 3:** UTR reference display in large monospace with copy button.
4. **Step 4:** Receipt evidence viewer — 3:4 aspect ratio image with hover zoom and fullscreen overlay.
5. **Step 5:** Dual-action sticky bar — outlined red "Reject" (1x width) and filled teal "Approve" (2x width).
