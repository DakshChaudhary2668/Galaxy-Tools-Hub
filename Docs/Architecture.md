# Architecture Overview - Galaxy Tools Hub

## High-Level Monorepo Architecture

`Galaxy Tools Hub` is structured as an enterprise monorepo using **pnpm workspaces** and **Turborepo**.

```
                           +------------------------+
                           |  Next.js 15 App Router |
                           |       (apps/web)       |
                           +-----------+------------+
                                       |
                   Direct Upload URL   |  REST API
                      (Signed URL)     v
                  +--------------------+--------------------+
                  |                                         |
                  v                                         v
       +--------------------+                    +---------------------+
       |  Supabase Storage  |                    | Express.js Server   |
       |  (Images/Invoices) |                    |    (apps/server)    |
       +--------------------+                    +----------+----------+
                                                            |
                                                            v
                                                 +---------------------+
                                                 | Supabase PostgreSQL |
                                                 +---------------------+
```

## Layered Clean Architecture (Express Server)

Every domain feature in `apps/server` flows strictly through 4 decoupled layers:

1. **Routes (`routes/`)**: Express path handlers, attaching `validateRequest` and `authGuard` middlewares.
2. **Controllers (`controllers/`)**: HTTP request processing, extracting parameters, invoking services, returning standardized `{ success, message, data, meta }` envelopes.
3. **Services (`services/`)**: Domain business logic, orchestration across repositories, transaction handling.
4. **Repositories (`repositories/`)**: Pure database abstraction using `SupabaseClient`. Zero business logic.

## Storage Upload Flow (Supabase Signed Upload URLs)

The server **never proxies binary image file uploads**.

```
Client (Web App)                 Server (Express)                Supabase Storage
       |                                |                               |
       |--- 1. POST /storage/signed-url |                               |
       |    { bucket, path } ---------->|                               |
       |                                |--- 2. createSignedUploadUrl ->|
       |                                |<-- 3. Return Signed URL ------|
       |<-- 4. { signedUrl, path } -----|                               |
       |                                                                |
       |------------------- 5. PUT File to Signed URL ----------------->|
       |<------------------ 6. Upload Complete 200 OK ------------------|
       |                                                                |
       |--- 7. Send final public URL in entity DTO payload ------------>|
```

## Inventory Reservation Lifecycle

1. **Checkout**: Order placed $\rightarrow$ Stock moved to `reserved_stock`. `available_stock` recalculated automatically ($quantity - reserved\_stock$).
2. **Admin Verification**: Screenshot verified $\rightarrow$ Order status becomes `Confirmed`.
3. **Fulfillment**: Order `Packed` $\rightarrow$ `Shipped` $\rightarrow$ `Delivered` $\rightarrow$ Decrease `quantity` and release `reserved_stock`.
