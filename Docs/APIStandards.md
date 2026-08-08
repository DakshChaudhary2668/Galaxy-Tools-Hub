# API Standards & Response Specifications

## Standard Response Envelopes

Every API endpoint on `apps/server` returns a consistent JSON payload envelope.

### 1. Success Response Structure (`200 OK`, `201 Created`)

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "name": "DeWalt 20V MAX Cordless Drill",
      "slug": "dewalt-20v-max-cordless-drill",
      "price": 14999.00
    }
  ],
  "meta": {
    "requestId": "req_8f12a9b2-3c1a-4f5e-9a10-2b3c4d5e6f7a",
    "nextCursor": "ZXlKaGJHY2lPaUpTVXpVeE1pSXNJbXRwWkNJNkkyRnlZV1FpZlE9PQ==",
    "hasMore": true,
    "totalCount": 150
  }
}
```

### 2. Error Response Structure (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Error`)

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

## Cursor Pagination

All collection list endpoints support cursor-based pagination:

```http
GET /api/v1/products?limit=20&cursor=ZXlKaGJHY2lPaUpTVXpVeE1pSXNJbXRwWkNJNkkyRnlZV1FpZlE9PQ==
```

Cursor parameters are base64-encoded strings containing sorting keys (e.g. `created_at` timestamp + `id`).
