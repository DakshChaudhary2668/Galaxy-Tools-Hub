## G alaxy Tools Hub: Unified API Specification

## 1. Backend API: Authentication & Role-Based Access Control (RBAC)

T he backend must enforce strict RBAC to protect corporate procurement data and restricted p ricing models.

## A uthentication Endpoints

M ethod & Route,Auth Roles,Request JSON Payload,Success Response (200/201),Error H andling P OST /api/v1/auth/login,"Guest, Customer, Admin","{ ""email"": ""str"", ""password"": ""str"", " "enterpriseId"": ""str"" }","{ ""token"": ""JWT_STR"", ""role"": ""Customer"" }",400: Malformed; 4 01: Invalid Credentials P OST /api/v1/auth/refresh,"Customer, Admin","{ ""refreshToken"": ""str"" }","{ ""token"": " "NEW_JWT_STR"" }",403: Token Expired/Revoked T he catalog API serves as the next layer, delivering data-heavy product specifications to the

a uthenticated frontend.

## 2. Catalog & V ariant Management API

O ur API must handle technical variants as distinct, queryable entities to support the complex G -Tech instrumentation range.

## P roduct Retrieval

- Route: GET /api/v1/products

- Source Data: Returns active models including the GT92A (List Price: 1020), GT97 T RMS (List Price: 1500), and the M266 (List Price: 900).

## V ariant Logic Endpoint

- Route: GET /api/v1/products/{id}/variants

- Logic: The JSON response must explicitly map the technical delta between models. F or example, a query for a clamp meter should differentiate the GT30 (Standard AC 6 00A) from the smart GT35 (TRMS with NCV and Temperature functionality). Error H andling:

- 404 Not Found: Triggered if a request is made for a legacy or obsolete model number n ot present in the current G-Tech 01-04-2026 dataset.

## 3. T ransactional API: Cart, Tax Logic, & Checkout

B 2B financial calculations require absolute precision to ensure GST compliance and facilitate c orporate audits.


## T ax Calculation Endpoint

- Route: POST /api/v1/checkout/calculate-tax

- Logic: Dynamically applies the 18% GST rate to the List Price provided in the source c ontext.

- Architectural Logic: For a GT9550 (List Price: 9600), the API must return a tax_amount o f 1728 and a grand_total of 11328.

## C art Management

- Operations: POST/PUT/DELETE on /api/v1/cart.

- 422 Unprocessable Entity: Returned if the requested quantity exceeds the physical s tock-on-hand or if the model is flagged for "Administrative Verification Only."

## 4. B2B Payment V erification & Administrative API

T he backend manages the automated verification of manual claims and coordinates stock state t ransitions.

## P ayment Submission

- Route: POST /api/v1/payments/submit-evidence

- Data Validation:

- UTR Regex: ^A-Z{4}[0-9]0-9A-Z{10}\$ (Standardized check for NEFT/IMPS UTR p atterns).

- Server-Side File Check: The API must execute a MAX_FILE_SIZE check of 5MB b efore processing the upload to the cloud storage bucket.

## A dmin Operations: Verification Queue

- Route: POST /api/v1/admin/payments/{order_id}/verify-payment

- Action: A Success status payload triggers an atomic database transaction. This d ecrements the stock for high-complexity items like the GT3125A (1000G-Ohms) a cross all catalog instances. Error Handling:

- 400 Bad Request: Triggered by malformed UTR strings failing the Regex check.

- 403 Forbidden: Triggered if a non-admin role attempts to hit the verify-payment r oute.This document serves as the final technical roadmap for the development of the G alaxy Tools Hub B2B portal.
