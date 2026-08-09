# Galaxy Tools Hub — Frontend Developer Handoff
> **Version:** 1.2.0  
> **Date:** 2026-08-09  
> **Design System:** Titan Industrial  
> **Platform:** Responsive Web (Desktop + Mobile Web / Android WebView)

---

## 1. Project Overview

Galaxy Tools Hub is a **B2B industrial e-commerce platform** for professional-grade testing, measuring, and soldering instruments. The platform serves procurement officers, field engineers, and industrial contractors who require high-density data presentation, rapid product discovery, and a streamlined bank-transfer checkout flow.

### 1.1 Design & Technology Stack
- **Technology in Wireframes:** **HTML5** + **Tailwind CSS v3** (with inline config) + **Vanilla JavaScript** + Google Fonts (**Roboto**, **Noto Sans Mono**) + **Material Symbols Outlined**
- **Design Philosophy:** **Technical Brutalism** & **Industrial Premium** — Structured grids, high-contrast intersections, monospaced technical accents
- **Responsive-First:** A single responsive codebase serves desktop (1280px+), tablet (768–1024px), and mobile (<767px)

---

## 2. Directory Structure (`output/` & `handoff/`)

### 2.1 Complete ANPS Product Specifications (`output/`)
The `output/` directory contains complete AI-Native Product Specifications (ANPS) for all screens across both web and mobile platforms:

```
output/
├── web/                                             ← Web Desktop ANPS Documents
│   ├── 01_galaxy_tools_hub_home_web_anps.md         (Home Landing Page ANPS)
│   ├── 02_g_tech_gt95xx_details_web_anps.md         (GT95XX Product Detail Page ANPS)
│   ├── 03_direct_bank_payment_upload_web_anps.md    (Direct Bank Payment Upload Page ANPS)
│   ├── 04_admin_payment_verification_web_anps.md    (Admin Payment Verification Desk ANPS)
│   └── 05_design_system_titan_industrial_web_anps.md(Titan Industrial Design System ANPS)
│
└── android_web/                                     ← Mobile / Android Reference ANPS Documents
    ├── 01_galaxy_tools_hub_home_mobile_anps.md      (Mobile Home Page ANPS)
    ├── 02_g_tech_gt95xx_pdp_mobile_anps.md          (Mobile PDP ANPS)
    ├── 03_mobile_checkout_stepper_anps.md           (Mobile Checkout Stepper ANPS)
    ├── 04_order_confirmation_mobile_anps.md        (Mobile Order Confirmation ANPS)
    ├── 05_admin_payment_verification_mobile_anps.md(Mobile Admin Verification ANPS)
    └── 06_design_system_industrial_premium_anps.md (Mobile Design System ANPS)
```

### 2.2 Developer Handoff Package (`handoff/`)
The `handoff/` directory contains all wireframe source code, screenshots, tokens, and implementation guides:

```
handoff/
├── code/                                            ← Source code files from wireframes
│   ├── 01_home_web.html                             (Desktop home page HTML/JS)
│   ├── 01_home_mobile.html                          (Mobile home page HTML/JS)
│   ├── 02_pdp_gt95xx_web.html                       (Desktop PDP HTML/JS)
│   ├── 02_pdp_gt95xx_mobile.html                    (Mobile PDP HTML/JS)
│   ├── 03_checkout_payment_upload_web.html          (Desktop checkout HTML/JS)
│   ├── 03_checkout_payment_upload_mobile.html       (Mobile checkout HTML/JS)
│   ├── 04_admin_payment_verification_web.html       (Desktop admin verification HTML/JS)
│   ├── 04_admin_payment_verification_mobile.html    (Mobile admin verification HTML/JS)
│   └── 05_order_confirmation_mobile.html            (Mobile order confirmation HTML/JS)
│
├── images/                                          ← 8 full-page wireframe screenshots
│   ├── 01_home_desktop.png                          (1247 KB)
│   ├── 01_home_mobile.png                           (1131 KB)
│   ├── 02_pdp_gt95xx_desktop.png                    (563 KB)
│   ├── 02_pdp_gt95xx_mobile.png                     (385 KB)
│   ├── 03_checkout_payment_upload_desktop.png       (234 KB)
│   ├── 03_checkout_payment_upload_mobile.png        (221 KB)
│   ├── 04_admin_payment_verification_desktop.png    (515 KB)
│   └── 04_admin_payment_verification_mobile.png     (397 KB)
│
└── docs/                                            ← Specification & architectural docs
    ├── 00_handoff_overview.md                       (Master handoff index & checklist)
    ├── 01_design_system_tokens.md                   (Titan Industrial CSS tokens & variables)
    ├── 02_screen_01_home.md                         (Home page component & state spec)
    ├── 03_screen_02_pdp.md                          (PDP component & state spec)
    ├── 04_screen_03_checkout_payment.md             (Checkout component & state spec)
    ├── 05_screen_04_admin_verification.md           (Admin verification component & state spec)
    ├── 06_android_reference_addendum.md             (Android native reference patterns)
    └── 07_wireframe_code_architecture.md            (Code stack analysis & React/TS code migration guide)
```

---

## 3. Screen Inventory & Flow Reference

| # | Screen | Desktop ANPS | Desktop Code | Mobile Code | Desktop Image | Mobile Image | Flow |
|---|--------|--------------|--------------|-------------|---------------|--------------|------|
| 01 | Home / Landing | `output/web/01_*.md` | `01_home_web.html` | `01_home_mobile.html` | `01_home_desktop.png` | `01_home_mobile.png` | Product discovery |
| 02 | Product Detail | `output/web/02_*.md` | `02_pdp_gt95xx_web.html` | `02_pdp_gt95xx_mobile.html` | `02_pdp_gt95xx_desktop.png` | `02_pdp_gt95xx_mobile.png` | Product selection → Add to cart |
| 03 | Checkout Payment | `output/web/03_*.md` | `03_checkout_payment_upload_web.html` | `03_checkout_payment_upload_mobile.html` | `03_checkout_payment_upload_desktop.png` | `03_checkout_payment_upload_mobile.png` | Cart → Payment evidence upload |
| 04 | Admin Verify | `output/web/04_*.md` | `04_admin_payment_verification_web.html` | `04_admin_payment_verification_mobile.html` | `04_admin_payment_verification_desktop.png` | `04_admin_payment_verification_mobile.png` | Admin queue → Approve/Reject |
| 05 | Confirmation | — | — | `05_order_confirmation_mobile.html` | — | — | Terminal success state |
