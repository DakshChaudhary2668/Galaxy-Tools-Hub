# Galaxy Tools Hub — Industrial E-Commerce Platform

Enterprise-level monorepo architecture for **Galaxy Tools Hub**, an industrial tools and equipment e-commerce platform built with Next.js 15, Express.js, TypeScript, Supabase PostgreSQL, Clerk Authentication, and SCSS Modules.

---

## 🏗 Architecture Overview

Strict 4-layer request flow following Clean Architecture & YAGNI principles:

```
[ Next.js 15 App Router Frontend ]
             │ HTTP / REST
             ▼
┌────────────────────────────────────────────────────────┐
│ Express.js API Server (apps/server)                     │
│                                                        │
│  Routes (Zod Validation & RBAC Middleware)             │
│    │                                                   │
│    ▼                                                   │
│  Controllers (HTTP Envelopes & Request Handling)       │
│    │                                                   │
│    ▼                                                   │
│  Repositories (Query Engine & Database Access)         │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
             [ Supabase PostgreSQL & Storage ]
```

---

## 📁 Repository Structure

```
GalaxyToolsHub/
├── apps/
│   ├── server/           # Express.js REST API Server (TS, Supabase, Clerk, Zod)
│   └── web/              # Next.js 15 App Router Frontend (SCSS Modules, Framer Motion)
├── packages/
│   ├── config/           # Shared ESLint, TypeScript, and Prettier configurations
│   ├── constants/        # System enums, HTTP status codes, role constants
│   ├── types/            # 1:1 Zod schemas and inferred DTO contracts for 28 DB tables
│   ├── ui/               # Shared UI component library
│   └── utils/            # Universal helpers (currency format, slugify, response envelopes)
└── docs/                 # Architecture, API Standards, Database Guide, Seed SQL, Collections
```

---

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, SCSS Modules, Framer Motion, Lucide Icons, TanStack Query, React Hook Form
- **Backend**: Node.js, Express.js, TypeScript, Zod, Clerk SDK, Supabase JS SDK
- **Database & Storage**: Supabase PostgreSQL (28 Production Tables), Supabase Storage
- **Authentication**: Dual Auth (Clerk Auth for Admin Staff, Supabase Auth for B2B Customers)
- **Monorepo & Build**: Turborepo, pnpm workspace

---

## 🚀 Quick Start & Development Setup

### 1. Prerequisites
- Node.js >= 20.x
- pnpm >= 9.x

### 2. Environment Setup
Copy `.env.example` to `.env` in both `apps/server` and `apps/web`:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
```

Populate `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

### 3. Installation & Database Seeding
```bash
# Install monorepo dependencies
pnpm install

# Run type check across all workspace packages
pnpm type-check

# Build all apps and packages
pnpm build
```

To seed the database with industrial tools:
Execute [docs/seed.sql](file:///Users/dakshchaudhary/Developer/GalaxyToolsHub/docs/seed.sql) in your Supabase SQL Editor.

### 4. Running Development Servers
```bash
pnpm dev
```
- Web App: `http://localhost:3000`
- API Server: `http://localhost:8000/api/v1`

---

## 📖 API Documentation & Postman Collections

- **API Documentation**: [docs/APIStandards.md](file:///Users/dakshchaudhary/Developer/GalaxyToolsHub/docs/APIStandards.md) and [docs/API.md](file:///Users/dakshchaudhary/Developer/GalaxyToolsHub/docs/API.md)
- **Database Specification**: [docs/DatabaseGuide.md](file:///Users/dakshchaudhary/Developer/GalaxyToolsHub/docs/DatabaseGuide.md) and [docs/schema.sql](file:///Users/dakshchaudhary/Developer/GalaxyToolsHub/docs/schema.sql)
- **Postman Collection**: [docs/collections/GalaxyToolsHub.postman_collection.json](file:///Users/dakshchaudhary/Developer/GalaxyToolsHub/docs/collections/GalaxyToolsHub.postman_collection.json)
- **Bruno Collection**: [docs/collections/bruno/bruno.json](file:///Users/dakshchaudhary/Developer/GalaxyToolsHub/docs/collections/bruno/bruno.json)

---

## 📄 License
Commercial / Proprietary — Galaxy Tools Hub.
