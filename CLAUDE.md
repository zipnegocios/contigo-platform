# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

- **Dev server**: `npm run dev` (Next.js on http://localhost:3000)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **DB push schema**: `npm run db:push`
- **DB migrate**: `npm run db:migrate`
- **DB studio**: `npm run db:studio`
- **Seed admin user**: `npm run seed`
- **Seed portfolio data**: `npm run seed:portfolio`

## Project Overview

**Contigo Platform** is a luxury construction/services brand website with a full CMS admin panel. It is a Next.js 15 App Router application backed by a PostgreSQL database (Drizzle ORM), S3-compatible object storage (R2), OpenAI embeddings for semantic search on leads, and email via Resend.

## Architecture

### Route Groups

The app lives under `app/` and uses Next.js route groups:

- `app/(marketing)/` — Public landing page (hero, services, projects, contact form)
- `app/(portfolio)/` — Public portfolio pages (`/projects`, `/projects/[slug]`, `/services/[slug]`)
- `app/admin/` — Admin CMS; `(protected)/` requires NextAuth JWT session; `login/` is public
- `app/api/` — API routes split into public (`/api/quotes`, `/api/projects/featured`, etc.) and admin-only (`/api/admin/**`)
- `app/quote-status/[token]/` — Public token-based quote tracking page

### Domain Layer (`src/`)

The business logic follows a layered DDD-like structure:

```
src/core/           — Entities, repository interfaces, service interfaces, value objects
src/application/    — Use cases (e.g. CreateQuoteUseCase)
src/infrastructure/ — Drizzle repository implementations, auth config, external services
src/presentation/   — React components, sections, hooks, animations (used by app/ routes)
```

- **Entities**: `Project`, `Service`, `Category`, `Quote`, `Lead` — defined in `src/core/entities/`
- **Repository interfaces**: `ICategoryRepository`, `IQuoteRepository` — implemented by `Drizzle*Repository` classes in `src/infrastructure/repositories/`
- **External services**: `ResendEmailService`, `OpenAIEmbeddingService`, `R2StorageService`, `SlugGeneratorService` in `src/infrastructure/services/`
- **Use cases** instantiate their dependencies directly (no DI container); see `CreateQuoteUseCase` for the pattern

### Database

Drizzle ORM with PostgreSQL (pgvector extension for embeddings). Schema is in `src/infrastructure/db/schema.ts`. Key tables: `categories`, `projects`, `services`, `quotes`, `leads`, `adminUsers`. Enums: `quote_status`, `project_status`, `lead_stage`, `admin_role`.

### Auth

NextAuth v5 beta with credentials provider (bcryptjs password hashing). Config in `src/infrastructure/auth/auth.config.ts`. Admin sessions use JWT strategy (7-day expiry). Protected admin routes rely on session checks in `app/admin/(protected)/layout.tsx`.

### Presentation Layer

All UI components live under `src/presentation/`:
- `components/ui/` — shadcn/ui components (Radix-based, copy-paste pattern)
- `components/admin/` — Admin-specific components
- `sections/` — Marketing page sections (Hero, BrandBar, Services, Heritage, Projects, Contact, Footer)
- `hooks/` — Custom React hooks (scroll reveal, smooth scroll, mobile detection)
- `animations/` — GSAP + Lenis animation utilities
- `lib/` — Client-side utilities (upload to R2, media metadata extraction)

The old `src/sections/`, `src/components/`, `src/hooks/` (non-presentation paths) are legacy remnants from the Vite prototype — prefer the `src/presentation/` versions.

### Key Technologies

- **Next.js 15** App Router with React 19; server components fetch data directly from repositories
- **Drizzle ORM** + `postgres` driver; `drizzle-kit` for migrations
- **next-auth v5** beta for admin authentication
- **GSAP + Lenis**: scroll animations (initialized in presentation layer, not in a global App component)
- **Three.js + React Three Fiber**: 3D particle effects in Hero section
- **React Hook Form + Zod**: all forms
- **@dnd-kit**: drag-and-drop reordering in admin
- **AWS SDK (S3-compatible)**: file uploads to Cloudflare R2
- **Resend**: transactional email
- **OpenAI**: embedding generation for semantic lead search

### Required Environment Variables

See `.env-templates/` for the full list. Critical vars:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `R2_*` — Cloudflare R2 bucket credentials
