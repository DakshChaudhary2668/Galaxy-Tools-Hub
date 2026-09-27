# Sprint 3 — Product Image Upload Report

**Date:** September 17, 2026
**Scope:** Sprint 3 — Product Image Upload & Supabase Storage Integration

---

## 1. Executive Summary

Sprint 3 implements production-ready product image uploads for Galaxy Tools Hub administrators, transitioning the platform from plain text URL inputs to direct file uploads backed by Supabase Storage and PostgreSQL persistence.

All architectural corrections specified in the review were strictly followed:
- **No sentinel paths:** Product records must exist before image upload authorization.
- **Path Separation:** `storage_path` stores strictly the managed relative object key (`products/{productId}/{uuid}.{ext}`), while `public_url` stores the full CDN URL.
- **Strict Metadata Validation:** Endpoint validates product existence, OWNER/MANAGER roles, file size <= 5 MB, MIME types (JPEG, PNG, WebP), and extension/MIME compatibility.
- **Native Signed Upload:** Uses Supabase SDK `createSignedUploadUrl` returning `{ signedUrl, path, token, publicUrl }`.
- **Safe Replacement & Cleanup:** New images are uploaded and persisted before cleaning up old managed objects. If DB insert fails, the new uploaded object is deleted immediately to prevent orphaned storage blobs.
- **Legacy Backward Compatibility:** Existing legacy image URLs and static images remain completely intact and functional; only managed Supabase keys are deleted from storage.
- **Zero Scope Creep:** No Razorpay, variant creation, or cart/inventory changes were made.

---

## 2. Architecture Corrections Implemented

| Correction | Requirement | Implementation Details |
|---|---|---|
| **Correction 1** | `storage_path` != `public_url` | `storage_path` contains `products/{productId}/{uuid}.{ext}`; `public_url` contains `https://<supabase-host>/storage/v1/object/public/product-images/products/...`. Verified by automated test. |
| **Correction 2** | No "new" Sentinel | On product creation: product metadata is submitted first. Upon product creation success, the resulting real UUID is used to request the signed upload URL, upload the file, and complete registration. If image upload fails, the product is preserved and user is offered a Retry button or edit link. |
| **Correction 3** | Signing Request Validation | `ProductImageSignedUploadRequestSchema` enforces UUID `product_id`, positive `file_size` <= 5 MB, allowed `mime_type` (`image/jpeg`, `image/png`, `image/webp`), and exact MIME/extension matching. Hardcoded bucket `product-images`. |
| **Correction 4** | Supabase Upload Contract | Backend `createSignedUploadUrl` returns `{ signedUrl, path, token, publicUrl }`. Client uses `uploadToSignedUrl(path, token, file)` with direct PUT fallback. |
| **Correction 5** | Explicit Completion Contract | `POST /api/v1/products/admin/:id/images/complete` verifies `storage_path` starts with `products/:id/` and matches strict UUID regex, derives `public_url` server-side, and inserts with `is_primary = true`. |
| **Correction 6** | Safe Replacement | When replacing an image, the new file is uploaded to a new UUID path and inserted into `product_images`. Only upon successful DB insertion is the old storage object deleted and old DB row removed. If insertion fails, the new object is cleaned up. |
| **Correction 7** | Legacy Object Safety | Deletion checks if `storage_path` is a managed key (starts with `products/` and not `http`). Legacy static or external URLs have metadata removed without attempting storage deletion. |
| **Correction 8** | Next.js Configuration | Inspected `apps/web/next.config.js`. Confirmed `remotePatterns` already permits `**.supabase.co` with `unoptimized: true`. No modifications required. |
| **Correction 9** | Bucket Configuration | Bucket `product-images` configured as public read, 5 MB file size limit, allowed MIME types: `image/jpeg`, `image/png`, `image/webp`. Writes restricted to server-signed URLs. |

---

## 3. Supabase Storage Setup & Configuration

The bucket was provisioned with the following parameters:
- **Bucket ID / Name:** `product-images`
- **Public:** `true` (Allows public read access for storefront image rendering via CDN)
- **File Size Limit:** `5242880` bytes (5 MB)
- **Allowed MIME Types:** `["image/jpeg", "image/png", "image/webp"]`
- **Write Policy:** Direct public/anon INSERT and UPDATE disabled via RLS; uploads authorized exclusively via server-generated signed upload URLs.
- **Delete Policy:** Restricted to service-role on the backend.

---

## 4. Files Modified and Created

### Shared Types (`packages/types`)
- **[MODIFY] `packages/types/index.ts`**:
  - Added `ProductImageSignedUploadRequestSchema` and `ProductImageSignedUploadRequestDto`.
  - Added `ProductImageCompleteRequestSchema` and `ProductImageCompleteRequestDto`.

### Backend (`apps/server`)
- **[MODIFY] `apps/server/src/repositories/storage.repository.ts`**:
  - Updated `createSignedUploadUrl` to return `{ signedUrl, path, token }`.
  - Added `getPublicUrl(bucket, path)`.
  - Added `deleteObject(bucket, path)`.
- **[MODIFY] `apps/server/src/controllers/storage.controller.ts`**:
  - Added `getProductImageUploadUrl` handler (validates product existence, generates UUID filename, derives path and public CDN URL).
- **[MODIFY] `apps/server/src/routes/storage.routes.ts`**:
  - Registered `POST /product-image-upload-url` auth-gated to OWNER and MANAGER.
- **[MODIFY] `apps/server/src/controllers/product.controller.ts`**:
  - Added `completeProductImage` with safe replacement logic and rollback cleanup.
  - Added `removeProductPrimaryImage` with safe legacy URL preservation.
- **[MODIFY] `apps/server/src/routes/product.routes.ts`**:
  - Registered `POST /admin/:id/images/complete` (auth-gated OWNER/MANAGER).
  - Registered `DELETE /admin/:id/images/primary` and alias `DELETE /admin/:id/image` (auth-gated OWNER/MANAGER) registered before parameterized routes.
- **[NEW] `apps/server/src/test_sprint3.ts`**:
  - Automated test suite verifying all Sprint 3 flows and edge cases.
- **[MODIFY] `apps/server/package.json`**:
  - Added `"test:sprint3": "tsx src/test_sprint3.ts"`.

### Frontend (`apps/web`)
- **[MODIFY] `apps/web/src/services/product.service.ts`**:
  - Added `getProductImageUploadUrl`, `completeProductImage`, and `deleteProductPrimaryImage`.
- **[NEW] `apps/web/src/components/admin/ImageUploadWidget.tsx`**:
  - Reusable one-image upload component supporting drag & drop, client validation (<= 5 MB, JPEG/PNG/WebP), instant preview, upload progress indicator, replacement, and removal.
- **[MODIFY] `apps/web/src/app/admin/(dashboard)/products/new/page.tsx`**:
  - Integrated `ImageUploadWidget`.
  - Implemented create-then-upload sequence (creates product record first, then uploads image using returned UUID).
  - Preserves product on image upload error, displaying clear error banner and "Retry Image Upload" button.
- **[MODIFY] `apps/web/src/app/admin/(dashboard)/products/[id]/edit/page.tsx`**:
  - Integrated `ImageUploadWidget` with `productId` prop for immediate server-side replacement and removal.

---

## 5. Verification & Test Results

### 5.1 Automated Test Suite (`pnpm run test:sprint3`)
All 8 automated tests passed end-to-end against the live Supabase project and Express API:

```
🚀 Starting Sprint 3 Image Upload End-to-End Test Suite...

[Setup] Test server running on port 59883
[Setup] Admin session token acquired for OWNER user
[Setup] Temporary test product created: 61507e3c-4142-4858-a3f1-def872c698fe (TEST-IMG-1789587514003)

--- TEST 1: Auth Guard (Unauthenticated) ---
Status: 401 (Expected: 401)
✅ TEST 1 PASSED: Unauthenticated request rejected with 401

--- TEST 2: Validation Guards (MIME, Size, Extension Mismatch, Non-existent Product) ---
2a. Oversized (> 5 MB) status: 400 (Expected: 400)
2b. Invalid MIME type status: 400 (Expected: 400)
2c. MIME / Extension mismatch status: 400 (Expected: 400)
2d. Non-existent product status: 404 (Expected: 404)
✅ TEST 2 PASSED: All validation guards rejected with 400/404

--- TEST 3: Generate Signed Upload URL ---
Status: 200 (Expected: 200)
Returned object path: products/61507e3c-4142-4858-a3f1-def872c698fe/e320bef8-cf2c-4a8a-9e24-d36902ce34b3.png
Returned public URL: https://rxpkvexhvbzbtdeacjyt.supabase.co/storage/v1/object/public/product-images/products/61507e3c-4142-4858-a3f1-def872c698fe/e320bef8-cf2c-4a8a-9e24-d36902ce34b3.png
Has token: true
✅ TEST 3 PASSED: Signed upload URL generated with server-controlled path & token

--- TEST 4: Upload image bytes to Supabase Storage ---
Storage upload status: 200 (Expected: 200)
✅ TEST 4 PASSED: Image bytes uploaded to Supabase Storage

--- TEST 5: Complete Image Registration (/images/complete) ---
5a. Path mismatch status: 400 (Expected: 400)
5b. Complete status: 201 (Expected: 201)
DB product_images count: 1
DB Row storage_path: products/61507e3c-4142-4858-a3f1-def872c698fe/e320bef8-cf2c-4a8a-9e24-d36902ce34b3.png
DB Row public_url: https://rxpkvexhvbzbtdeacjyt.supabase.co/storage/v1/object/public/product-images/products/61507e3c-4142-4858-a3f1-def872c698fe/e320bef8-cf2c-4a8a-9e24-d36902ce34b3.png
DB Row is_primary: true
✅ TEST 5 PASSED: Product image completed and persisted correctly in database

--- TEST 6: Safe Image Replacement ---
Replacement complete status: 201 (Expected: 201)
DB product_images count after replace: 1
New primary storage_path: products/61507e3c-4142-4858-a3f1-def872c698fe/f6446426-d362-46c5-ab4e-77d7c7bac000.webp
✅ TEST 6 PASSED: Old image safely replaced and cleaned up, new image is primary

--- TEST 7: Remove Product Image ---
Delete status: 200 (Expected: 200)
DB product_images count after removal: 0
✅ TEST 7 PASSED: Product image removed and storage cleaned up

--- TEST 8: Storefront Rendering Integrity ---
Catalog fetch status: 200 (Expected: 200)
✅ TEST 8 PASSED: Storefront catalog and image mapping intact without regression

[Cleanup] Temporary test product 61507e3c-4142-4858-a3f1-def872c698fe deleted successfully.

======================================================
🎉 ALL SPRINT 3 VERIFICATION TESTS PASSED SUCCESSFULLY!
======================================================
```

### 5.2 Build & Type-Check Verification
- `pnpm type-check`: 7 of 7 packages passed with zero errors (`@galaxy/config`, `@galaxy/constants`, `@galaxy/types`, `@galaxy/ui`, `@galaxy/utils`, `galaxy-server`, `galaxy-web`).
- `pnpm build`: Completed successfully with production bundle optimization on Next.js 15 and Node/TypeScript server compilation.
