# Wireframe Code Architecture & Implementation Guide
> **Location:** `handoff/code/`  
> **Source Stack:** HTML5 + Tailwind CSS v3 (CDN) + Vanilla JavaScript  
> **Target Framework:** React / Next.js / Vue with TypeScript & Tailwind CSS

---

## 1. Code Technology Used in Wireframes

The wireframes are authored in **HTML5** with embedded **Tailwind CSS v3** styling and **Vanilla JavaScript** interactivity.

### 1.1 Technology Breakdown

```
┌────────────────────────────────────────────────────────────────────────┐
│                        WIREFRAME CODE STACK                           │
├──────────────────┬─────────────────────────────────────────────────────┤
│ Markup           │ HTML5 (Semantic elements: <header>, <main>, <nav>)  │
│ Styling          │ Tailwind CSS v3 (CDN script + inline config)        │
│ Typography       │ Google Fonts (Roboto & Noto Sans Mono)              │
│ Icons            │ Google Material Symbols Outlined                    │
│ Scripting / JS   │ Vanilla JavaScript (DOM manipulation, timers)       │
└──────────────────┴─────────────────────────────────────────────────────┘
```

---

## 2. Included Code Inventory (`handoff/code/`)

All wireframe source code files have been copied and systematically renamed according to **screen number, screen name, and target platform/viewport**:

| File Name | Screen | Platform | Size | Description |
|---|---|---|---|---|
| `01_home_web.html` | Home Page | Desktop Web | 26.1 KB | Desktop landing page with multi-row nav, hero, product grid |
| `01_home_mobile.html` | Home Page | Mobile Web | 19.0 KB | Mobile home page with category accordions and trust badges |
| `02_pdp_gt95xx_web.html` | Product Detail | Desktop Web | 26.1 KB | 60/40 gallery/buy-panel split, spec table, variant chips |
| `02_pdp_gt95xx_mobile.html` | Product Detail | Mobile Web | 14.9 KB | Mobile PDP with swipe gallery and sticky bottom CTA bar |
| `03_checkout_payment_upload_web.html` | Checkout Payment | Desktop Web | 14.8 KB | Bank details, QR code, UTR input, file upload form |
| `03_checkout_payment_upload_mobile.html` | Checkout Payment | Mobile Web | 14.3 KB | Mobile stepper (Step 3), bank details, upload zone |
| `04_admin_payment_verification_web.html` | Admin Verification | Desktop Web | 18.7 KB | 50/50 manifest/console split, real-time clock, image viewer |
| `04_admin_payment_verification_mobile.html` | Admin Verification | Mobile Web | 11.2 KB | Mobile admin queue item with approve/reject sticky bar |
| `05_order_confirmation_mobile.html` | Order Confirmation | Mobile Web | 9.8 KB | Success terminal state with verification pending warning |

---

## 3. JavaScript Logic in Wireframes

The wireframe HTML files contain specific **Vanilla JavaScript** snippets that need to be migrated to your frontend framework state management.

### 3.1 Real-Time System Clock (Admin Console)
**Wireframe Code (`04_admin_payment_verification_web.html`):**
```javascript
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });
    document.getElementById('clock').textContent = timeString;
}
setInterval(updateClock, 1000);
updateClock();
```

**React / TypeScript Equivalent:**
```tsx
import { useState, useEffect } from 'react';

export function AdminClock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  return <span className="font-mono text-sm">{time}</span>;
}
```

---

### 3.2 File Upload Trigger & Drag-and-Drop
**Wireframe Code (`03_checkout_payment_upload_web.html`):**
```html
<div onclick="document.getElementById('fileUpload').click()">
  <input type="file" id="fileUpload" accept=".jpg,.jpeg,.png,.pdf" class="hidden" />
</div>
```

**React / TypeScript Equivalent:**
```tsx
import { useRef, useState, ChangeEvent } from 'react';

export function PaymentUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  return (
    <div 
      onClick={() => fileInputRef.current?.click()}
      className="border-2 border-dashed border-outline-variant p-8 text-center cursor-pointer"
    >
      <input 
        ref={fileInputRef} 
        type="file" 
        accept=".jpg,.jpeg,.png,.pdf" 
        onChange={handleFileChange}
        className="hidden" 
      />
      {selectedFile ? (
        <p>Selected: {selectedFile.name}</p>
      ) : (
        <p>Drag and drop or click to upload</p>
      )}
    </div>
  );
}
```

---

### 3.3 Clipboard Copy (UTR Number)
**Wireframe Code (`04_admin_payment_verification_web.html`):**
```html
<button onclick="alert('UTR Copied to clipboard')">COPY</button>
```

**React / TypeScript Equivalent:**
```tsx
export function CopyUTRButton({ utr }: { utr: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(utr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className="px-3 py-1 bg-surface-variant text-sm font-bold">
      {copied ? 'COPIED!' : 'COPY'}
    </button>
  );
}
```

---

## 4. Tailwind CSS Configuration Migration

Each HTML wireframe configures Tailwind inline via `<script id="tailwind-config">`. For full production development, copy these token extensions into your project's `tailwind.config.js`:

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'surface': '#f9f9fb',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f3f5',
        'surface-container': '#eeeef0',
        'surface-container-high': '#e8e8ea',
        'on-surface': '#1a1c1d',
        'on-surface-variant': '#444748',
        'primary': '#000000',
        'primary-container': '#1c1b1b',
        'secondary': '#705d00',
        'secondary-container': '#fcd400', // ★ Golden Accent
        'on-secondary-container': '#6e5c00',
        'outline-variant': '#c4c7c7',
        'error': '#ba1a1a',
        'error-container': '#ffdad6',
      },
      fontFamily: {
        'sans': ['Roboto', 'sans-serif'],
        'mono': ['Noto Sans Mono', 'monospace'],
        'technical-data': ['Noto Sans Mono', 'monospace'],
        'label-caps': ['Roboto', 'sans-serif'],
      },
      spacing: {
        'gutter': '24px',
        'margin-desktop': '40px',
        'margin-mobile': '16px',
        'stack-sm': '4px',
        'stack-md': '16px',
        'stack-lg': '32px',
        'container-max': '1280px',
      },
      borderRadius: {
        'DEFAULT': '0.125rem', // 2px
        'lg': '0.25rem',       // 4px
        'xl': '0.5rem',        // 8px
        'full': '9999px',
      }
    }
  }
}
```
