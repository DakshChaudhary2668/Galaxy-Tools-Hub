# API Standards & Endpoint Specification — Galaxy Tools Hub

## Overview
All REST API endpoints on `apps/server` follow strict REST conventions, Zod validation, rate limiting, and uniform JSON envelopes.

---

## Global Headers & API Versioning

All HTTP responses include:
```http
X-API-Version: v1
X-Request-ID: <UUIDv4>
Content-Type: application/json
```

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

### 2. Standard Error Envelope (`400`, `401`, `403`, `404`, `429`, `500`)

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

## System & Health APIs (`/api/v1/health`)

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Public | System uptime, version, & health check |

#### Example Response: `GET /api/v1/health`

```json
{
  "success": true,
  "message": "Galaxy Tools Hub API is healthy",
  "data": {
    "status": "UP",
    "version": "1.0.0",
    "environment": "development",
    "uptime": 12345,
    "timestamp": "2026-08-08T13:26:00.000Z"
  },
  "meta": {
    "requestId": "c1ce7280-1c7a-42d6-8e9b-d0e262587490"
  }
}
```

---

## Catalog APIs Summary

### Categories (`/api/v1/categories`)
- `GET /api/v1/categories`: Public category listing
- `GET /api/v1/categories/:slug`: Category details by slug
- `POST/PUT/DELETE /api/v1/categories/admin`: Admin CRUD operations

### Brands (`/api/v1/brands`)
- `GET /api/v1/brands`: Public brand listing
- `GET /api/v1/brands/:slug`: Brand details by slug
- `POST/PUT/DELETE /api/v1/brands/admin`: Admin CRUD operations

### Vendors (`/api/v1/vendors`)
- `GET /api/v1/vendors`: Public vendor listing
- `GET /api/v1/vendors/:id`: Vendor details by ID
- `POST/PUT/DELETE /api/v1/vendors/admin`: Admin CRUD operations

### Products (`/api/v1/products`)
- `GET /api/v1/products`: Public search, filter, sort, & pagination engine
- `GET /api/v1/products/:slug`: Product specification detail by slug
- `POST/PUT/DELETE /api/v1/products/admin`: Admin CRUD operations
- `GET/POST/DELETE /api/v1/products/:id/images`: Product image metadata management
