# GALAXY TOOLS HUB: ORDER CONFIRMATION — ANPS
> **Version:** 1.0.0-alpha
> **Role:** Order Success / Confirmation Screen — Mobile
> **Theme:** Industrial Premium / High-Density Light Mode
> **Platform:** Android / Mobile Web (4-column fluid grid)

---

## SECTION 1: SYSTEM ARCHETYPE & DESIGN TOKENS

The Order Confirmation screen is a transactional terminal state confirming successful order submission with a "Verification Pending" status. It must convey trust, provide clear order reference data, and guide the user back to the home screen.

### 1.1 Layout Architecture
- **Viewport:** Mobile-first, max-width 672px (max-w-2xl).
- **No TopAppBar:** This is a terminal state; navigation is suppressed.
- **Content Canvas:** Centered vertical stack with 16px margins and 24px section gaps.
- **Sticky Bottom Bar:** Full-width "Return to Home" CTA, fixed at bottom.
- **Body Padding Bottom:** 96px to clear the sticky bar.

### 1.2 Color & Contrast Tokens
| Token | Value | Application |
| :--- | :--- | :--- |
| **Background** | `#F9F9F9` | Page background. |
| **Primary** | `#705D00` | Success checkmark icon. |
| **On-Surface** | `#1A1C1C` | Headlines, order data. |
| **On-Surface-Variant** | `#4D4732` | Secondary labels, body text. |
| **Outline Variant** | `#D0C6AB` | Card borders, dividers. |
| **Warning Yellow BG** | `#FFF9E6` | Verification pending banner background. |
| **Warning Yellow Border** | `#FFD700` | Verification pending banner border. |
| **Warning Text** | `#705E00` / `#544600` | Banner label / body text. |
| **CTA Background** | `#111111` | "Return to Home" button. |
| **CTA Text** | `#FFFFFF` | Button label. |

---

## SECTION 2: SYSTEM-WIDE ATOMIC COMPONENTS

### 2.1 SUCCESS_HEADER
```xml
<component id="success_header" type="content-group" alignment="center" text_align="center" gap="stack_sm" margin_bottom="stack_lg">
  <icon type="check_circle" size="64px" color="primary" filled="true"/>
  <text value="Order Received" font="headline_lg_mobile" color="on_surface"/>
  <text value="Your order has been logged in our system." font="body_lg" color="on_surface_variant"/>
</component>
```

### 2.2 ORDER_DETAILS_CARD
```xml
<component id="order_details" type="card" background="surface_container_lowest" border="1px solid outline_variant" rounded="DEFAULT" padding="margin">
  <layout type="vertical" gap="stack_md">
    <group layout="horizontal" justify="space-between" alignment="center" border_bottom="1px solid outline_variant" padding_bottom="stack_sm">
      <field label="ORDER ID" label_font="label_caps" label_color="on_surface_variant" value="#GTH-2026-10492" value_font="tech_data" value_color="on_surface"/>
      <field label="DATE" label_font="label_caps" label_color="on_surface_variant" value="2026-08-09" value_font="tech_data" value_color="on_surface" alignment="right"/>
    </group>
    <warning_banner background="#FFF9E6" border="1px solid #FFD700" rounded="DEFAULT" padding="stack_sm">
      <layout type="horizontal" alignment="start" gap="stack_sm">
        <icon type="warning" size="24px" color="#705E00" filled="true" margin_top="4px"/>
        <group>
          <text value="VERIFICATION PENDING" font="label_caps" color="#705E00" weight="700" transform="uppercase"/>
          <text value="Your manual payment details have been logged. The order will remain as 'Pending Verification' until the finance desk verifies the transaction. We will notify you via email once confirmed." font="body_md" color="#544600" margin_top="4px"/>
        </group>
      </layout>
    </warning_banner>
  </layout>
</component>
```

### 2.3 SHIPPING_ESTIMATE_CARD
```xml
<component id="shipping_estimate" type="section">
  <text value="SHIPPING ESTIMATE" font="headline_md" color="on_surface" transform="uppercase" letter_spacing="tight" margin_bottom="stack_md"/>
  <card background="surface_container_lowest" border="1px solid outline_variant" rounded="DEFAULT" padding="margin">
    <layout type="horizontal" alignment="center" gap="margin">
      <icon_container width="64px" height="64px" background="surface_variant" rounded="DEFAULT" alignment="center">
        <icon type="local_shipping" size="32px" color="on_surface_variant"/>
      </icon_container>
      <group>
        <text value="Immediate Dispatch" font="body_lg" weight="700" color="on_surface"/>
        <text value="From Delhi Palace Warehouse" font="body_md" color="on_surface_variant"/>
      </group>
    </layout>
  </card>
</component>
```

### 2.4 RETURN_HOME_CTA
```xml
<component id="return_home" type="fixed-footer" background="surface_container_lowest" border_top="1px solid outline_variant" padding="margin" z_index="50">
  <button width="100%" max_width="448px" height="48px" background="#111111" color="#FFFFFF" font="label_caps" transform="uppercase" letter_spacing="1px" rounded="DEFAULT" hover_opacity="0.9">
    Return to Home
    <icon type="arrow_forward" margin_left="8px"/>
  </button>
</component>
```

---

## SECTION 3: FULL SCREEN WIREFLOW

```
+--------------------------------------------------+
|                                                  |
|                    (✓)                           | ← 64px success icon
|              Order Received                      |
|   Your order has been logged in our system.      |
|                                                  |
+--------------------------------------------------+
| ┌──────────────────────────────────────────────┐ |
| │ ORDER ID                           DATE      │ |
| │ #GTH-2026-10492               2026-08-09     │ |
| │ ──────────────────────────────────────       │ |
| │ ⚠ VERIFICATION PENDING                      │ |
| │ Your manual payment details have been         │ |
| │ logged. The order will remain as 'Pending     │ |
| │ Verification' until the finance desk          │ |
| │ verifies the transaction.                     │ |
| └──────────────────────────────────────────────┘ |
+--------------------------------------------------+
| SHIPPING ESTIMATE                                |
| ┌──────────────────────────────────────────────┐ |
| │ [🚚]  Immediate Dispatch                     │ |
| │       From Delhi Palace Warehouse             │ |
| └──────────────────────────────────────────────┘ |
+--------------------------------------------------+
|                                                  |
|           (spacer — clean breathing room)        |
|                                                  |
+--------------------------------------------------+
| ┌──────────────────────────────────────────────┐ |
| │       RETURN TO HOME        →                 │ | ← Fixed black CTA
| └──────────────────────────────────────────────┘ |
+--------------------------------------------------+
```

---

## SECTION 4: INTERACTIVE WORKSPACE STATE MATRIX

| Interaction | Visual Change | CSS / Token Rule |
| :--- | :--- | :--- |
| **Return to Home Hover** | Opacity: 0.9 | `hover:opacity-90 transition-opacity` |
| **Warning Banner** | Static — no interaction | Yellow bg `#FFF9E6`, golden border |
| **Order ID** | Non-interactive, monospace display | `font-tech-data text-tech-data` |

---

## SECTION 5: IMPLEMENTATION DIRECTION FOR GRAPHICS AGENTS

1. **Step 1:** Establish the light `#F9F9F9` background with no top navigation — this is a terminal state.
2. **Step 2:** Large centered success icon (64px, golden filled checkmark) followed by "Order Received" headline.
3. **Step 3:** Order details card with monospace Order ID + Date, and a prominent yellow "Verification Pending" banner.
4. **Step 4:** Shipping estimate section with truck icon and warehouse dispatch info.
5. **Step 5:** Fixed bottom bar with solid dark "Return to Home" CTA and arrow icon.
