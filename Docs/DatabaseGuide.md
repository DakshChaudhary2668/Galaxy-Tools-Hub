# Database Guide & Schema Architecture

## Database Engine
Supabase PostgreSQL 15+ with Extensions:
- `uuid-ossp`: Auto-generate UUIDv4 primary keys.
- `pg_trgm`: PostgreSQL trigram matching for fast full-text search indexing across `products` (`name`, `description`, `seo_title`, `meta_keywords`).

## Table Relations & Entity ERD Summary

- `users` (Clerk Admin Users: `Owner`, `Manager`, `Staff`)
- `categories` $\rightarrow$ `categories` (Self-referencing `parent_id` for tree hierarchy)
- `brands` $\rightarrow$ `products` (One-to-Many)
- `products` $\rightarrow$ `product_variants` (One-to-Many)
- `products` $\rightarrow$ `inventory` (One-to-One)
- `products` $\rightarrow$ `product_images` (One-to-Many)
- `customers` $\rightarrow$ `addresses` (One-to-Many)
- `customers` $\rightarrow$ `orders` (One-to-Many)
- `orders` $\rightarrow$ `order_items` (One-to-Many)
- `orders` $\rightarrow$ `payment_proofs` (One-to-One)
- `orders` $\rightarrow$ `invoices` (One-to-One)
- `activity_logs` (Stores audit trails with `metadata` JSONB)

## Activity Log JSONB Structure

```json
{
  "oldStatus": "Pending Payment",
  "newStatus": "Payment Verified",
  "verifiedBy": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "utrNumber": "UTR198273645"
}
```
