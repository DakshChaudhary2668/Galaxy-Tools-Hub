# Galaxy Tools Hub - Enterprise Monorepo

Production-ready industrial e-commerce platform architecture built with **Next.js 15**, **Express.js**, **Supabase PostgreSQL & Storage**, **Clerk Auth**, **SCSS Modules**, and **Turborepo**.

## 🏗 Architecture & Stack

- **Apps**:
  - `apps/web`: Next.js 15 App Router, SCSS Modules, Framer Motion, TanStack Query, React Hook Form, Zod, Lucide Icons.
  - `apps/server`: Express.js, TypeScript, Layered Clean Architecture (Routes -> Controllers -> Services -> Repositories -> Database).
- **Packages**:
  - `packages/config`: Shared TSConfig, ESLint presets, Zod Environment Validation.
  - `packages/constants`: Single source of truth for Roles, Order/Payment Statuses, Routes, Storage Buckets, Messages.
  - `packages/types`: Single-source Zod schemas and inferred TypeScript DTOs.
  - `packages/ui`: SCSS Design tokens (Industrial dark charcoal `#121212` & DeWalt yellow `#FFB800`) & accessible React UI components.
  - `packages/utils`: Currency formatters, slugify, cursor pagination encoders, response builders.

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `apps/web/.env` and `apps/server/.env`.

3. **Start Development Servers**:
   ```bash
   pnpm dev
   ```

4. **Type Check & Linting**:
   ```bash
   pnpm type-check
   pnpm lint
   ```

5. **Build Production Bundles**:
   ```bash
   pnpm build
   ```

## 📖 Documentation

For detailed architectural breakdown and guides, see the `docs/` folder:
- [docs/Architecture.md](file:///Users/dakshchaudhary/Developer/GalaxyToolsHub/docs/Architecture.md)
- [docs/FolderStructure.md](file:///Users/dakshchaudhary/Developer/GalaxyToolsHub/docs/FolderStructure.md)
- [docs/APIStandards.md](file:///Users/dakshchaudhary/Developer/GalaxyToolsHub/docs/APIStandards.md)
- [docs/DatabaseGuide.md](file:///Users/dakshchaudhary/Developer/GalaxyToolsHub/docs/DatabaseGuide.md)
- [docs/DevelopmentWorkflow.md](file:///Users/dakshchaudhary/Developer/GalaxyToolsHub/docs/DevelopmentWorkflow.md)
- [docs/DeploymentGuide.md](file:///Users/dakshchaudhary/Developer/GalaxyToolsHub/docs/DeploymentGuide.md)
- [docs/schema.sql](file:///Users/dakshchaudhary/Developer/GalaxyToolsHub/docs/schema.sql)
