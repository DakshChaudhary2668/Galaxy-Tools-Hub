# API Standards & Endpoint Specification — Galaxy Tools Hub

## Overview
All REST API endpoints on `apps/server` follow strict REST conventions, Zod validation, and uniform JSON envelopes.

---

## Response Envelope Specification

### 1. Success Envelope (`200 OK`, `201 Created`)

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [...],
  "meta": {
    "requestId": "req_8f12a9b2-3c1a-4f5e-9a10-2b3c4d5e6f7a",
    "page": 1,
    "limit": 12,
    "total": 150,
    "totalPages": 13,
    "hasMore": true
  }
}
```

### 2. Error Envelope (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Error`)

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": {
    "price": ["Price must be a non-negative number"],
    "sku": ["SKU is required"]
  },
  "meta": {
    "requestId": "req_8f12a9b2-3c1a-4f5e-9a10-2b3c4d5e6f7a"
  }
}
```

---

## Phase 1 & Phase 2 API Catalog Summary

### Authentication APIs (`/api/v1/auth`)

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/auth/customer/me` | Customer (Supabase Auth) | Fetch authenticated customer profile |
| `GET` | `/api/v1/auth/admin/me` | Admin (Clerk Auth) | Fetch authenticated admin staff profile |

---

### Categories APIs (`/api/v1/categories`)

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | Public | List all categories |
| `GET` | `/api/v1/categories/:slug` | Public | Get category details by slug |
| `POST` | `/api/v1/categories/admin` | Admin (`Owner`/`Manager`) | Create category |
| `PUT` | `/api/v1/categories/admin/:id` | Admin (`Owner`/`Manager`) | Update category |
| `DELETE` | `/api/v1/categories/admin/:id` | Admin (`Owner`/`Manager`) | Delete category |

---

### Brands APIs (`/api/v1/brands`)

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/brands` | Public | List all brands |
| `GET` | `/api/v1/brands/:slug` | Public | Get brand details by slug |
| `POST` | `/api/v1/brands/admin` | Admin (`Owner`/`Manager`) | Create brand |
| `PUT` | `/api/v1/brands/admin/:id` | Admin (`Owner`/`Manager`) | Update brand |
| `DELETE` | `/api/v1/brands/admin/:id` | Admin (`Owner`/`Manager`) | Delete brand |

---

### Vendors APIs (`/api/v1/vendors`)

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/vendors` | Public / Admin | List all vendors |
| `GET` | `/api/v1/vendors/:id` | Public / Admin | Get vendor details by ID |
| `POST` | `/api/v1/vendors/admin` | Admin (`Owner`/`Manager`) | Create vendor |
| `PUT` | `/api/v1/vendors/admin/:id` | Admin (`Owner`/`Manager`) | Update vendor |
| `DELETE` | `/api/v1/vendors/admin/:id` | Admin (`Owner`/`Manager`) | Delete vendor |

---

### Products APIs (`/api/v1/products`)

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/products` | Public | List products with composable search, filter, sort, & pagination |
| `GET` | `/api/v1/products/:slug` | Public | Get product specification by slug |
| `POST` | `/api/v1/products/admin` | Admin (`Owner`/`Manager`) | Create product |
| `PUT` | `/api/v1/products/admin/:id` | Admin (`Owner`/`Manager`) | Update product |
| `DELETE` | `/api/v1/products/admin/:id` | Admin (`Owner`/`Manager`) | Delete product |

#### `GET /api/v1/products` Query Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | integer | `1` | Page number |
| `limit` | integer | `12` | Items per page (max 100) |
| `search` | string | `undefined` | PostgreSQL Full-Text Search / ILIKE across name, description, model no, SKU, SEO fields |
| `category` | string | `undefined` | Category slug or UUID |
| `brand` | string | `undefined` | Brand slug or UUID |
| `vendor` | string | `undefined` | Vendor code or UUID |
| `minPrice` | numeric | `undefined` | Minimum price filter |
| `maxPrice` | numeric | `undefined` | Maximum price filter |
| `sort` | string | `latest` | Options: `price_asc`, `price_desc`, `latest`, `oldest`, `name_asc`, `name_desc`, `featured` |
| `featured` | boolean | `undefined` | Filter featured products (`true`/`false`) |
| `active` | boolean | `true` | Filter active status |

---

### Product Images APIs (`/api/v1/products/:id/images`)

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/products/:id/images` | Public | Get images for a product |
| `POST` | `/api/v1/products/admin/:id/images` | Admin (`Owner`/`Manager`) | Attach image metadata (storage_path, public_url, alt_text, sort_order) |
| `DELETE` | `/api/v1/products/admin/:id/images/:imageId` | Admin (`Owner`/`Manager`) | Remove product image metadata |
