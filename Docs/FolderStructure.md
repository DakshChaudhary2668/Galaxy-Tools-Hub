# Folder Structure - Galaxy Tools Hub

```
GalaxyToolsHub/
├── apps/
│   ├── server/                 # Express Node.js TypeScript API Backend
│   │   ├── src/
│   │   │   ├── config/         # Supabase, Clerk, Env configuration
│   │   │   ├── controllers/    # Express route HTTP controllers
│   │   │   ├── middlewares/    # RequestID, AuthGuard, RBAC, ErrorHandler, Zod Validate
│   │   │   ├── repositories/   # BaseRepository & Supabase database queries
│   │   │   ├── routes/         # Express API V1 routers
│   │   │   ├── services/       # Domain business services
│   │   │   ├── utils/          # AppError, Logger, Response helpers
│   │   │   ├── index.ts        # Server entrypoint
│   │   │   └── server.ts       # Express app instantiation factory
│   │   └── package.json
│   │
│   └── web/                    # Next.js 15 App Router Frontend
│       ├── src/
│       │   ├── app/            # App Router (Public routes & /admin protected sub-tree)
│       │   └── styles/         # Global SCSS & theme overrides
│       └── package.json
│
├── packages/
│   ├── config/                 # Shared TSConfig base, ESLint, Zod Env Validation
│   ├── constants/              # Roles, Order/Payment Statuses, Routes, System Messages
│   ├── types/                  # Single-source Zod schemas & inferred TypeScript DTOs
│   ├── ui/                     # SCSS design tokens (Industrial dark theme) & base components
│   └── utils/                  # Currency formatting, slugify, cursor encoding, response builders
│
├── docs/                       # Monorepo documentation & database schema
│   ├── schema.sql
│   ├── Architecture.md
│   ├── FolderStructure.md
│   ├── APIStandards.md
│   ├── DatabaseGuide.md
│   ├── DevelopmentWorkflow.md
│   └── DeploymentGuide.md
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── README.md
└── .env.example
```
