# Developer Workflow & Conventions

## Prerequisites
- Node.js >= 18.0.0
- pnpm >= 9.0.0

## Getting Started

1. Install all dependencies across monorepo workspace:
   ```bash
   pnpm install
   ```

2. Setup Environment Variables:
   - Copy `.env.example` to `apps/web/.env` and `apps/server/.env`.
   - Provide Supabase & Clerk secret keys.

3. Launch Monorepo in Local Development Mode:
   ```bash
   pnpm dev
   ```

4. Run Type Checks & Linting:
   ```bash
   pnpm type-check
   pnpm lint
   ```

5. Production Build:
   ```bash
   pnpm build
   ```
