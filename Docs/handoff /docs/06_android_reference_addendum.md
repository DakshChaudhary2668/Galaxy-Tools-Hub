# Android Platform Reference — Addendum
> **Status:** REFERENCE ONLY — Not for direct implementation  
> **Source:** `android_web_galaxy_tools_hub_spec/`  
> **Purpose:** Documents patterns from the Android-native wireframes that may inform responsive design decisions

---

## 1. Overview

The Android-native wireframes demonstrate how the Galaxy Tools Hub could adapt for a **native Android shell** or **Android WebView**. These are NOT the implementation target — the responsive web wireframes are the single source of truth.

However, the following patterns from the Android wireframes should inform your responsive design decisions, especially at mobile breakpoints (<768px).

---

## 2. Patterns Worth Adopting

### 2.1 Bottom Navigation Bar (Home Screen)
The Android wireframe uses a 4-item bottom nav (Home, Search, Orders, Profile) instead of a top hamburger menu. While the web implementation should use a top nav, consider:
- On mobile web: A sticky bottom action bar for high-priority CTAs
- Tab-based mobile navigation patterns for authenticated user flows

### 2.2 Sticky Bottom Action Bar (PDP)
The Android PDP features a permanently sticky bottom bar with:
- **Quantity selector** (35% width) — minus/count/plus
- **ADD TO CART button** (65% width) — golden CTA

**Recommendation:** Implement this pattern on mobile web PDP. The desktop PDP already has in-page CTAs that don't need to be sticky.

### 2.3 Category Accordion (Home Screen)
The Android home screen uses an expandable accordion for product categories instead of horizontal nav links. This pattern works well for:
- Mobile navigation menus
- Filter panels on category listing pages

### 2.4 Step Progress Indicator (Checkout)
The Android checkout uses a 4-step linear stepper:
1. Review → 2. Billing → 3. Payment → 4. Confirmation

The web checkout already implements a 3-step stepper (Review → Billing → Payment). Both versions should maintain visual consistency.

### 2.5 Order Confirmation (Terminal State)
The Android wireframes include an Order Confirmation screen that is not present in the web wireframes:
- Centered success icon (golden checkmark, 64px)
- "Order Received" headline
- Order ID + Date in monospace
- "Verification Pending" warning banner (yellow bg, golden border)
- Shipping estimate card
- "Return to Home" full-width dark CTA

**Recommendation:** Implement this as a web page at `/checkout/confirmation/:orderId`. Use the same design tokens and patterns. It should work identically on desktop and mobile.

---

## 3. Patterns NOT to Adopt for Web

| Android Pattern | Why Not for Web |
|---|---|
| 56px TopAppBar with hamburger | Web uses multi-row sticky header |
| 64px BottomNavBar | Web uses top navigation |
| Search with microphone icon | Web search is inline in header |
| Trust symbols as horizontal scroll | Web can fit them in a single row |

---

## 4. Screen Mapping (Android → Web)

| Android Wireframe | Web Equivalent | Notes |
|---|---|---|
| `galaxy_tools_hub_home_mobile` | `galaxy_tools_hub_home` (responsive) | Same content, different layout |
| `g_tech_gt95xx_pdp_mobile` | `g_tech_gt95xx_details` (responsive) | Add sticky bottom bar for mobile |
| `mobile_checkout_stepper` | `direct_bank_payment_upload` (responsive) | Stepper + payment form |
| `order_confirmation_mobile` | NOT in web wireframes | **Create new** — `/checkout/confirmation` |
| `admin_payment_verification_mobile` | `admin_payment_verification` (responsive) | Same content, stacked on mobile |
| `galaxy_tools_hub_industrial_premium` | `titan_industrial/DESIGN.md` | Same design system |
