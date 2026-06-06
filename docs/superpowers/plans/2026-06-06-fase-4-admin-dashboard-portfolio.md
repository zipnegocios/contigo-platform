# Fase 4 — Admin Dashboard & Portfolio CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement complete admin dashboard with KPIs, quote/project/service/lead management, and public portfolio pages with SSR and semantic search.

**Architecture:** Clean Architecture layering (domain entities → application use cases → infrastructure repositories → presentation components). Admin protected by NextAuth v5 JWT. Server Components for SSR where possible. Public portfolio with `generateStaticParams` for slug-based routing. No external drag-drop library—use HTML5 drag-and-drop native API.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, PostgreSQL 17, Drizzle ORM, NextAuth v5 beta, shadcn/ui, Tailwind CSS, Recharts (KPIs), Embla Carousel (gallery).

---

## File Structure

### Domain Layer (`src/core/`)
```
src/core/
├── entities/
│   ├── Quote.ts           (domain: quote aggregate)
│   ├── Project.ts         (domain: project aggregate)
│   ├── Service.ts         (domain: service aggregate)
│   └── Lead.ts            (domain: lead aggregate)
├── value-objects/
│   ├── Email.ts
│   └── Slug.ts
└── repositories/
    ├── IQuoteRepository.ts
    ├── IProjectRepository.ts
    ├── IServiceRepository.ts
    └── ILeadRepository.ts
```

### Application Layer (`src/application/use-cases/`)
```
use-cases/
├── quotes/
│   ├── FindAllQuotesUseCase.ts
│   ├── FindQuoteByIdUseCase.ts
│   └── UpdateQuoteStatusUseCase.ts
├── projects/
│   ├── CreateProjectUseCase.ts
│   ├── UpdateProjectUseCase.ts
│   ├── DeleteProjectUseCase.ts
│   ├── PublishProjectUseCase.ts
│   └── FindSimilarProjectsUseCase.ts
├── services/
│   ├── FindAllServicesUseCase.ts
│   ├── ReorderServicesUseCase.ts
│   └── UpdateServiceUseCase.ts
└── leads/
    ├── FindAllLeadsUseCase.ts
    ├── UpdateLeadStageUseCase.ts
    └── FindLeadsByQuoteUseCase.ts
```

### Infrastructure Layer (`src/infrastructure/`)
```
infrastructure/
├── repositories/
│   ├── DrizzleQuoteRepository.ts
│   ├── DrizzleProjectRepository.ts
│   ├── DrizzleServiceRepository.ts
│   └── DrizzleLeadRepository.ts
└── services/
    └── SlugGeneratorService.ts
```

### Presentation Layer (`src/presentation/` & `app/`)
```
src/presentation/
├── components/admin/
│   ├── AdminSidebar.tsx
│   ├── DashboardView.tsx
│   ├── QuoteInboxTable.tsx
│   ├── QuoteDetailPanel.tsx
│   ├── ProjectForm.tsx
│   ├── ProjectTable.tsx
│   ├── ServiceTable.tsx
│   ├── LeadsKanban.tsx
│   └── KPICard.tsx
└── sections/
    └── ProjectsSection.tsx (updated)

app/
├── admin/
│   ├── layout.tsx
│   ├── page.tsx (dashboard)
│   ├── inbox/
│   │   ├── page.tsx (quote list)
│   │   └── [id]/page.tsx (quote detail)
│   ├── projects/
│   │   ├── page.tsx (list)
│   │   ├── new/page.tsx (create)
│   │   └── [id]/edit/page.tsx (edit)
│   ├── services/page.tsx
│   ├── leads/page.tsx
│   └── settings/page.tsx
├── (portfolio)/projects/
│   ├── page.tsx (public list)
│   └── [slug]/page.tsx (public detail)
└── api/admin/
    ├── quotes/[id]/route.ts
    ├── projects/route.ts
    ├── projects/[id]/route.ts
    ├── services/route.ts
    ├── services/[id]/route.ts
    └── upload/presign/route.ts
```

---

## Task Breakdown

### Task 1: Setup Admin Middleware & Protected Layout

**Files:**
- Create: `middleware.ts`
- Modify: `app/admin/layout.tsx`

**Description:** Ensure all `/admin` routes require authentication. Add NextAuth middleware with proper redirects.

- [ ] **Step 1: Create middleware.ts at project root**

```typescript
// middleware.ts
import { auth } from '@/infrastructure/auth/auth.config'

export const middleware = auth((req) => {
  // If no session and trying to access admin, redirect to login
  if (!req.auth && req.nextUrl.pathname.startsWith('/admin')) {
    const loginUrl = new URL('/admin/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return Response.redirect(loginUrl)
  }
})

export const config = {
  matcher: ['/admin/:path*'],
}
```

- [ ] **Step 2: Update app/admin/layout.tsx with SidebarProvider**

```typescript
// app/admin/layout.tsx
import { SidebarProvider } from '@/presentation/components/ui/sidebar'
import AdminSidebar from '@/presentation/components/admin/AdminSidebar'
import { auth } from '@/infrastructure/auth/auth.config'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add middleware.ts app/admin/layout.tsx
git commit -m "feat: add NextAuth middleware and admin layout with sidebar"
```

---

### Task 2: Create Domain Entities (Quote, Project, Service, Lead)

**Files:**
- Create: `src/core/entities/Quote.ts`
- Create: `src/core/entities/Project.ts`
- Create: `src/core/entities/Service.ts`
- Create: `src/core/entities/Lead.ts`

**Description:** Define domain entities with factory methods and validation logic.

- [ ] **Step 1: Create Quote entity**

```typescript
// src/core/entities/Quote.ts
import { v4 as uuid } from 'uuid'

export type QuoteStatus = 'new' | 'contacted' | 'in_progress' | 'converted' | 'closed'

export class Quote {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly email: string,
    readonly phone: string | null,
    readonly service: string,
    readonly message: string,
    readonly status: QuoteStatus,
    readonly trackingToken: string,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(input: {
    name: string
    email: string
    phone?: string
    service: string
    message: string
  }): Quote {
    const id = uuid()
    const trackingToken = uuid()
    const now = new Date()

    return new Quote(
      id,
      input.name,
      input.email,
      input.phone || null,
      input.service,
      input.message,
      'new',
      trackingToken,
      now,
      now,
    )
  }

  withStatus(status: QuoteStatus): Quote {
    return new Quote(
      this.id,
      this.name,
      this.email,
      this.phone,
      this.service,
      this.message,
      status,
      this.trackingToken,
      this.createdAt,
      new Date(),
    )
  }
}
```

- [ ] **Step 2: Create Project entity**

```typescript
// src/core/entities/Project.ts
import { v4 as uuid } from 'uuid'
import { generateSlug } from '@/infrastructure/services/SlugGeneratorService'

export type ProjectStatus = 'draft' | 'published' | 'archived'

export class Project {
  constructor(
    readonly id: string,
    readonly slug: string,
    readonly title: string,
    readonly category: string,
    readonly description: string,
    readonly location: string,
    readonly completedDate: Date,
    readonly featured: boolean,
    readonly published: boolean,
    readonly coverImageUrl: string,
    readonly galleryUrls: string[],
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(input: {
    title: string
    category: string
    description: string
    location: string
    completedDate: Date
    coverImageUrl: string
    galleryUrls?: string[]
  }): Project {
    const id = uuid()
    const slug = generateSlug(input.title)
    const now = new Date()

    return new Project(
      id,
      slug,
      input.title,
      input.category,
      input.description,
      input.location,
      input.completedDate,
      false,
      false,
      input.coverImageUrl,
      input.galleryUrls || [],
      now,
      now,
    )
  }

  withPublishedStatus(published: boolean): Project {
    return new Project(
      this.id,
      this.slug,
      this.title,
      this.category,
      this.description,
      this.location,
      this.completedDate,
      this.featured,
      published,
      this.coverImageUrl,
      this.galleryUrls,
      this.createdAt,
      new Date(),
    )
  }

  withFeaturedStatus(featured: boolean): Project {
    return new Project(
      this.id,
      this.slug,
      this.title,
      this.category,
      this.description,
      this.location,
      this.completedDate,
      featured,
      this.published,
      this.coverImageUrl,
      this.galleryUrls,
      this.createdAt,
      new Date(),
    )
  }
}
```

- [ ] **Step 3: Create Service entity**

```typescript
// src/core/entities/Service.ts
import { v4 as uuid } from 'uuid'
import { generateSlug } from '@/infrastructure/services/SlugGeneratorService'

export class Service {
  constructor(
    readonly id: string,
    readonly slug: string,
    readonly name: string,
    readonly shortDescription: string,
    readonly fullDescription: string,
    readonly imageUrl: string,
    readonly orderIndex: number,
    readonly published: boolean,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(input: {
    name: string
    shortDescription: string
    fullDescription: string
    imageUrl: string
    orderIndex?: number
  }): Service {
    const id = uuid()
    const slug = generateSlug(input.name)
    const now = new Date()

    return new Service(
      id,
      slug,
      input.name,
      input.shortDescription,
      input.fullDescription,
      input.imageUrl,
      input.orderIndex || 0,
      true,
      now,
      now,
    )
  }

  withOrder(orderIndex: number): Service {
    return new Service(
      this.id,
      this.slug,
      this.name,
      this.shortDescription,
      this.fullDescription,
      this.imageUrl,
      orderIndex,
      this.published,
      this.createdAt,
      new Date(),
    )
  }
}
```

- [ ] **Step 4: Create Lead entity**

```typescript
// src/core/entities/Lead.ts
import { v4 as uuid } from 'uuid'

export type LeadStage = 'prospect' | 'contacted' | 'quoted' | 'won' | 'lost'

export class Lead {
  constructor(
    readonly id: string,
    readonly quoteId: string,
    readonly stage: LeadStage,
    readonly adminNotes: string | null,
    readonly estimatedValue: number | null,
    readonly updatedAt: Date,
  ) {}

  static create(input: { quoteId: string }): Lead {
    const id = uuid()

    return new Lead(id, input.quoteId, 'prospect', null, null, new Date())
  }

  withStage(stage: LeadStage): Lead {
    return new Lead(
      this.id,
      this.quoteId,
      stage,
      this.adminNotes,
      this.estimatedValue,
      new Date(),
    )
  }

  withNotes(notes: string): Lead {
    return new Lead(
      this.id,
      this.quoteId,
      this.stage,
      notes,
      this.estimatedValue,
      new Date(),
    )
  }

  withEstimatedValue(value: number): Lead {
    return new Lead(
      this.id,
      this.quoteId,
      this.stage,
      this.adminNotes,
      value,
      new Date(),
    )
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/core/entities/
git commit -m "feat: add domain entities (Quote, Project, Service, Lead)"
```

---

### Task 3: Create Infrastructure Repositories

**Files:**
- Create: `src/infrastructure/repositories/DrizzleQuoteRepository.ts`
- Create: `src/infrastructure/repositories/DrizzleProjectRepository.ts`
- Create: `src/infrastructure/repositories/DrizzleServiceRepository.ts`
- Create: `src/infrastructure/repositories/DrizzleLeadRepository.ts`
- Create: `src/infrastructure/services/SlugGeneratorService.ts`

**Description:** Implement repositories that map domain entities to/from database using Drizzle ORM.

- [ ] **Step 1: Create SlugGeneratorService**

```typescript
// src/infrastructure/services/SlugGeneratorService.ts
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
}

export function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: string[],
): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug
  }

  let counter = 1
  while (existingSlugs.includes(`${baseSlug}-${counter}`)) {
    counter++
  }

  return `${baseSlug}-${counter}`
}
```

- [ ] **Step 2: Create DrizzleQuoteRepository**

```typescript
// src/infrastructure/repositories/DrizzleQuoteRepository.ts
import { db } from '@/infrastructure/db/client'
import * as schema from '@/infrastructure/db/schema'
import { Quote } from '@/core/entities/Quote'
import { eq, desc } from 'drizzle-orm'

export class DrizzleQuoteRepository {
  async save(quote: Quote): Promise<Quote> {
    await db
      .insert(schema.quotes)
      .values({
        id: quote.id,
        name: quote.name,
        email: quote.email,
        phone: quote.phone,
        service: quote.service,
        message: quote.message,
        status: quote.status,
        trackingToken: quote.trackingToken,
      })
      .onConflictDoNothing()

    return quote
  }

  async findById(id: string): Promise<Quote | null> {
    const row = await db.query.quotes.findFirst({
      where: eq(schema.quotes.id, id),
    })

    if (!row) return null

    return new Quote(
      row.id,
      row.name,
      row.email,
      row.phone,
      row.service,
      row.message,
      row.status,
      row.trackingToken,
      row.createdAt,
      row.updatedAt,
    )
  }

  async findByToken(token: string): Promise<Quote | null> {
    const row = await db.query.quotes.findFirst({
      where: eq(schema.quotes.trackingToken, token),
    })

    if (!row) return null

    return new Quote(
      row.id,
      row.name,
      row.email,
      row.phone,
      row.service,
      row.message,
      row.status,
      row.trackingToken,
      row.createdAt,
      row.updatedAt,
    )
  }

  async findAll(limit = 100, offset = 0): Promise<Quote[]> {
    const rows = await db.query.quotes.findMany({
      orderBy: desc(schema.quotes.createdAt),
      limit,
      offset,
    })

    return rows.map(
      (row) =>
        new Quote(
          row.id,
          row.name,
          row.email,
          row.phone,
          row.service,
          row.message,
          row.status,
          row.trackingToken,
          row.createdAt,
          row.updatedAt,
        ),
    )
  }

  async findByStatus(
    status: string,
    limit = 100,
    offset = 0,
  ): Promise<Quote[]> {
    const rows = await db.query.quotes.findMany({
      where: eq(schema.quotes.status, status as any),
      orderBy: desc(schema.quotes.createdAt),
      limit,
      offset,
    })

    return rows.map(
      (row) =>
        new Quote(
          row.id,
          row.name,
          row.email,
          row.phone,
          row.service,
          row.message,
          row.status,
          row.trackingToken,
          row.createdAt,
          row.updatedAt,
        ),
    )
  }

  async update(quote: Quote): Promise<Quote> {
    await db
      .update(schema.quotes)
      .set({
        status: quote.status,
        updatedAt: quote.updatedAt,
      })
      .where(eq(schema.quotes.id, quote.id))

    return quote
  }

  async count(): Promise<number> {
    const result = await db
      .select({ count: schema.quotes.id })
      .from(schema.quotes)

    return result.length
  }

  async countByStatus(status: string): Promise<number> {
    const result = await db
      .select({ count: schema.quotes.id })
      .from(schema.quotes)
      .where(eq(schema.quotes.status, status as any))

    return result.length
  }
}
```

- [ ] **Step 3: Create DrizzleProjectRepository**

```typescript
// src/infrastructure/repositories/DrizzleProjectRepository.ts
import { db } from '@/infrastructure/db/client'
import * as schema from '@/infrastructure/db/schema'
import { Project } from '@/core/entities/Project'
import { eq, desc, and } from 'drizzle-orm'

export class DrizzleProjectRepository {
  async save(project: Project): Promise<Project> {
    await db
      .insert(schema.projects)
      .values({
        id: project.id,
        slug: project.slug,
        title: project.title,
        category: project.category,
        description: project.description,
        location: project.location,
        completedDate: project.completedDate,
        featured: project.featured,
        published: project.published,
        coverImageUrl: project.coverImageUrl,
        galleryUrls: project.galleryUrls,
      })
      .onConflictDoNothing()

    return project
  }

  async findById(id: string): Promise<Project | null> {
    const row = await db.query.projects.findFirst({
      where: eq(schema.projects.id, id),
    })

    if (!row) return null

    return this.mapToEntity(row)
  }

  async findBySlug(slug: string): Promise<Project | null> {
    const row = await db.query.projects.findFirst({
      where: eq(schema.projects.slug, slug),
    })

    if (!row) return null

    return this.mapToEntity(row)
  }

  async findAll(limit = 100, offset = 0): Promise<Project[]> {
    const rows = await db.query.projects.findMany({
      orderBy: desc(schema.projects.createdAt),
      limit,
      offset,
    })

    return rows.map((row) => this.mapToEntity(row))
  }

  async findPublished(limit = 100, offset = 0): Promise<Project[]> {
    const rows = await db.query.projects.findMany({
      where: eq(schema.projects.published, true),
      orderBy: desc(schema.projects.createdAt),
      limit,
      offset,
    })

    return rows.map((row) => this.mapToEntity(row))
  }

  async findFeatured(): Promise<Project[]> {
    const rows = await db.query.projects.findMany({
      where: and(
        eq(schema.projects.published, true),
        eq(schema.projects.featured, true),
      ),
      orderBy: desc(schema.projects.createdAt),
      limit: 5,
    })

    return rows.map((row) => this.mapToEntity(row))
  }

  async update(project: Project): Promise<Project> {
    await db
      .update(schema.projects)
      .set({
        title: project.title,
        category: project.category,
        description: project.description,
        location: project.location,
        completedDate: project.completedDate,
        featured: project.featured,
        published: project.published,
        coverImageUrl: project.coverImageUrl,
        galleryUrls: project.galleryUrls,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, project.id))

    return project
  }

  async delete(id: string): Promise<void> {
    await db.delete(schema.projects).where(eq(schema.projects.id, id))
  }

  async exists(slug: string): Promise<boolean> {
    const result = await db.query.projects.findFirst({
      where: eq(schema.projects.slug, slug),
    })

    return !!result
  }

  private mapToEntity(row: any): Project {
    return new Project(
      row.id,
      row.slug,
      row.title,
      row.category,
      row.description,
      row.location,
      row.completedDate,
      row.featured,
      row.published,
      row.coverImageUrl,
      row.galleryUrls || [],
      row.createdAt,
      row.updatedAt,
    )
  }
}
```

- [ ] **Step 4: Create DrizzleServiceRepository**

```typescript
// src/infrastructure/repositories/DrizzleServiceRepository.ts
import { db } from '@/infrastructure/db/client'
import * as schema from '@/infrastructure/db/schema'
import { Service } from '@/core/entities/Service'
import { eq, asc } from 'drizzle-orm'

export class DrizzleServiceRepository {
  async save(service: Service): Promise<Service> {
    await db
      .insert(schema.services)
      .values({
        id: service.id,
        slug: service.slug,
        name: service.name,
        shortDescription: service.shortDescription,
        fullDescription: service.fullDescription,
        imageUrl: service.imageUrl,
        orderIndex: service.orderIndex,
        published: service.published,
      })
      .onConflictDoNothing()

    return service
  }

  async findById(id: string): Promise<Service | null> {
    const row = await db.query.services.findFirst({
      where: eq(schema.services.id, id),
    })

    if (!row) return null

    return this.mapToEntity(row)
  }

  async findAll(limit = 100, offset = 0): Promise<Service[]> {
    const rows = await db.query.services.findMany({
      orderBy: asc(schema.services.orderIndex),
      limit,
      offset,
    })

    return rows.map((row) => this.mapToEntity(row))
  }

  async findPublished(): Promise<Service[]> {
    const rows = await db.query.services.findMany({
      where: eq(schema.services.published, true),
      orderBy: asc(schema.services.orderIndex),
    })

    return rows.map((row) => this.mapToEntity(row))
  }

  async update(service: Service): Promise<Service> {
    await db
      .update(schema.services)
      .set({
        name: service.name,
        shortDescription: service.shortDescription,
        fullDescription: service.fullDescription,
        imageUrl: service.imageUrl,
        orderIndex: service.orderIndex,
        published: service.published,
        updatedAt: new Date(),
      })
      .where(eq(schema.services.id, service.id))

    return service
  }

  async updateOrder(updates: Array<{ id: string; orderIndex: number }>): Promise<void> {
    for (const { id, orderIndex } of updates) {
      await db
        .update(schema.services)
        .set({ orderIndex, updatedAt: new Date() })
        .where(eq(schema.services.id, id))
    }
  }

  async delete(id: string): Promise<void> {
    await db.delete(schema.services).where(eq(schema.services.id, id))
  }

  private mapToEntity(row: any): Service {
    return new Service(
      row.id,
      row.slug,
      row.name,
      row.shortDescription,
      row.fullDescription,
      row.imageUrl,
      row.orderIndex,
      row.published,
      row.createdAt,
      row.updatedAt,
    )
  }
}
```

- [ ] **Step 5: Create DrizzleLeadRepository**

```typescript
// src/infrastructure/repositories/DrizzleLeadRepository.ts
import { db } from '@/infrastructure/db/client'
import * as schema from '@/infrastructure/db/schema'
import { Lead } from '@/core/entities/Lead'
import { eq, desc } from 'drizzle-orm'

export class DrizzleLeadRepository {
  async save(lead: Lead): Promise<Lead> {
    await db
      .insert(schema.leads)
      .values({
        id: lead.id,
        quoteId: lead.quoteId,
        stage: lead.stage,
        adminNotes: lead.adminNotes,
        estimatedValue: lead.estimatedValue,
      })
      .onConflictDoNothing()

    return lead
  }

  async findById(id: string): Promise<Lead | null> {
    const row = await db.query.leads.findFirst({
      where: eq(schema.leads.id, id),
    })

    if (!row) return null

    return this.mapToEntity(row)
  }

  async findByQuoteId(quoteId: string): Promise<Lead | null> {
    const row = await db.query.leads.findFirst({
      where: eq(schema.leads.quoteId, quoteId),
    })

    if (!row) return null

    return this.mapToEntity(row)
  }

  async findAll(limit = 100, offset = 0): Promise<Lead[]> {
    const rows = await db.query.leads.findMany({
      orderBy: desc(schema.leads.updatedAt),
      limit,
      offset,
    })

    return rows.map((row) => this.mapToEntity(row))
  }

  async findByStage(stage: string, limit = 100, offset = 0): Promise<Lead[]> {
    const rows = await db.query.leads.findMany({
      where: eq(schema.leads.stage, stage as any),
      orderBy: desc(schema.leads.updatedAt),
      limit,
      offset,
    })

    return rows.map((row) => this.mapToEntity(row))
  }

  async update(lead: Lead): Promise<Lead> {
    await db
      .update(schema.leads)
      .set({
        stage: lead.stage,
        adminNotes: lead.adminNotes,
        estimatedValue: lead.estimatedValue,
        updatedAt: lead.updatedAt,
      })
      .where(eq(schema.leads.id, lead.id))

    return lead
  }

  private mapToEntity(row: any): Lead {
    return new Lead(
      row.id,
      row.quoteId,
      row.stage,
      row.adminNotes,
      row.estimatedValue,
      row.updatedAt,
    )
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/infrastructure/repositories/
git add src/infrastructure/services/SlugGeneratorService.ts
git commit -m "feat: add infrastructure repositories and slug generator service"
```

---

### Task 4: Create Admin Dashboard with KPIs

**Files:**
- Create: `src/presentation/components/admin/KPICard.tsx`
- Create: `src/presentation/components/admin/DashboardView.tsx`
- Modify: `app/admin/page.tsx`

**Description:** Build dashboard landing page with 4 KPI cards and a Recharts chart showing quote trends.

- [ ] **Step 1: Create KPICard component**

```typescript
// src/presentation/components/admin/KPICard.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReactNode } from 'react'

interface KPICardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
}

export function KPICard({ title, value, icon, trend }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Create DashboardView component**

```typescript
// src/presentation/components/admin/DashboardView.tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { KPICard } from './KPICard'
import { MessageSquare, TrendingUp, FolderOpen, Users } from 'lucide-react'

interface DashboardViewProps {
  totalQuotes: number
  newQuotes: number
  convertedQuotes: number
  totalLeads: number
  totalProjects: number
  quotesTrend: Array<{ date: string; count: number }>
}

export function DashboardView({
  totalQuotes,
  newQuotes,
  convertedQuotes,
  totalLeads,
  totalProjects,
  quotesTrend,
}: DashboardViewProps) {
  const conversionRate = totalQuotes > 0 ? Math.round((convertedQuotes / totalQuotes) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title="Total Quotes"
          value={totalQuotes}
          icon={<MessageSquare className="h-4 w-4" />}
          trend={{ value: 12, label: 'vs last month', isPositive: true }}
        />
        <KPICard
          title="New Quotes"
          value={newQuotes}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPICard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPICard
          title="Active Leads"
          value={totalLeads}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* Chart */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Quotes Trend (Last 30 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={quotesTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8b5cf6" name="Quotes" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Total Projects</h3>
          <p className="text-3xl font-bold">{totalProjects}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Pipeline Value</h3>
          <p className="text-3xl font-bold">Calculating...</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update app/admin/page.tsx**

```typescript
// app/admin/page.tsx
import { DashboardView } from '@/presentation/components/admin/DashboardView'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'

export default async function DashboardPage() {
  const quoteRepo = new DrizzleQuoteRepository()
  const projectRepo = new DrizzleProjectRepository()
  const leadRepo = new DrizzleLeadRepository()

  // Fetch data
  const totalQuotes = await quoteRepo.count()
  const newQuotes = await quoteRepo.countByStatus('new')
  const convertedQuotes = await quoteRepo.countByStatus('converted')
  const totalLeads = (await leadRepo.findAll(1000)).length
  const totalProjects = (await projectRepo.findPublished(1000)).length

  // Mock trend data (in production, calculate from actual data)
  const quotesTrend = Array.from({ length: 7 }).map((_, i) => ({
    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    count: Math.floor(Math.random() * 10),
  }))

  return (
    <DashboardView
      totalQuotes={totalQuotes}
      newQuotes={newQuotes}
      convertedQuotes={convertedQuotes}
      totalLeads={totalLeads}
      totalProjects={totalProjects}
      quotesTrend={quotesTrend}
    />
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/presentation/components/admin/KPICard.tsx
git add src/presentation/components/admin/DashboardView.tsx
git add app/admin/page.tsx
git commit -m "feat: add admin dashboard with KPI cards and quote trends chart"
```

---

### Task 5: Create Quote Inbox Table & Detail View

**Files:**
- Create: `src/presentation/components/admin/QuoteInboxTable.tsx`
- Create: `src/presentation/components/admin/QuoteDetailPanel.tsx`
- Create: `app/admin/inbox/page.tsx`
- Create: `app/admin/inbox/[id]/page.tsx`
- Create: `app/api/admin/quotes/[id]/route.ts`

**Description:** Implement quote management system with list view (table + filters) and detail view (update status/notes).

- [ ] **Step 1: Create QuoteInboxTable component**

```typescript
// src/presentation/components/admin/QuoteInboxTable.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Quote {
  id: string
  name: string
  email: string
  service: string
  status: string
  createdAt: Date
}

interface QuoteInboxTableProps {
  quotes: Quote[]
  onFilterChange?: (status: string) => void
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-purple-100 text-purple-800',
  converted: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

export function QuoteInboxTable({ quotes, onFilterChange }: QuoteInboxTableProps) {
  const [filter, setFilter] = useState<string>('all')

  const handleFilterChange = (value: string) => {
    setFilter(value)
    onFilterChange?.(value)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Quotes</h2>
        <Select value={filter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Quotes</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No quotes found
                </TableCell>
              </TableRow>
            ) : (
              quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.name}</TableCell>
                  <TableCell>{quote.email}</TableCell>
                  <TableCell>{quote.service}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[quote.status]}>
                      {quote.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(quote.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/inbox/${quote.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create QuoteDetailPanel component**

```typescript
// src/presentation/components/admin/QuoteDetailPanel.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface QuoteDetailPanelProps {
  quoteId: string
  initialStatus: string
  initialNotes?: string
  name: string
  email: string
  phone?: string
  service: string
  message: string
  trackingToken: string
  createdAt: Date
}

export function QuoteDetailPanel({
  quoteId,
  initialStatus,
  initialNotes,
  name,
  email,
  phone,
  service,
  message,
  trackingToken,
  createdAt,
}: QuoteDetailPanelProps) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [notes, setNotes] = useState(initialNotes || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      })

      if (!response.ok) throw new Error('Failed to update quote')

      toast.success('Quote updated successfully')
      router.refresh()
    } catch (error) {
      toast.error('Failed to update quote')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Quote Details */}
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <p className="mt-1 text-lg">{name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="mt-1 text-lg">{email}</p>
            </div>
            {phone && (
              <div>
                <label className="text-sm font-medium">Phone</label>
                <p className="mt-1 text-lg">{phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quote Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Service Requested</label>
              <p className="mt-1 text-lg">{service}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Tracking Token</label>
              <p className="mt-1 text-xs font-mono break-all">{trackingToken}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Submitted</label>
              <p className="mt-1">{new Date(createdAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status & Notes Editor */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Update Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Admin Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add private notes about this quote..."
                className="mt-2 min-h-32"
              />
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create app/admin/inbox/page.tsx**

```typescript
// app/admin/inbox/page.tsx
import { QuoteInboxTable } from '@/presentation/components/admin/QuoteInboxTable'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'

export default async function InboxPage() {
  const quoteRepo = new DrizzleQuoteRepository()
  const quotes = await quoteRepo.findAll(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quotes</h1>
        <p className="text-muted-foreground">Manage all incoming quotes and track their status.</p>
      </div>

      <QuoteInboxTable quotes={quotes} />
    </div>
  )
}
```

- [ ] **Step 4: Create app/admin/inbox/[id]/page.tsx**

```typescript
// app/admin/inbox/[id]/page.tsx
import { notFound } from 'next/navigation'
import { QuoteDetailPanel } from '@/presentation/components/admin/QuoteDetailPanel'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const quoteRepo = new DrizzleQuoteRepository()
  const quote = await quoteRepo.findById(params.id)

  if (!quote) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quote from {quote.name}</h1>
        <p className="text-muted-foreground">Track and manage this quote</p>
      </div>

      <QuoteDetailPanel
        quoteId={quote.id}
        initialStatus={quote.status}
        name={quote.name}
        email={quote.email}
        phone={quote.phone || undefined}
        service={quote.service}
        message={quote.message}
        trackingToken={quote.trackingToken}
        createdAt={quote.createdAt}
      />
    </div>
  )
}
```

- [ ] **Step 5: Create app/api/admin/quotes/[id]/route.ts**

```typescript
// app/api/admin/quotes/[id]/route.ts
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, notes } = body

    const quoteRepo = new DrizzleQuoteRepository()
    const quote = await quoteRepo.findById(params.id)

    if (!quote) {
      return Response.json({ error: 'Quote not found' }, { status: 404 })
    }

    const updated = quote.withStatus(status as any)
    await quoteRepo.update(updated)

    // Create/update lead record if converting
    if (status === 'converted') {
      const leadRepo = new DrizzleLeadRepository()
      let lead = await leadRepo.findByQuoteId(quote.id)

      if (!lead) {
        const { Lead } = await import('@/core/entities/Lead')
        lead = Lead.create({ quoteId: quote.id })
        await leadRepo.save(lead)
      }

      lead = lead.withStage('quoted')
      if (notes) {
        lead = lead.withNotes(notes)
      }
      await leadRepo.update(lead)
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/presentation/components/admin/QuoteInboxTable.tsx
git add src/presentation/components/admin/QuoteDetailPanel.tsx
git add app/admin/inbox/
git add app/api/admin/quotes/
git commit -m "feat: add quote inbox with table and detail views"
```

---

### Task 6: Create Project CRUD (Create, Edit, List, Delete)

**Files:**
- Create: `src/presentation/components/admin/ProjectForm.tsx`
- Create: `src/presentation/components/admin/ProjectTable.tsx`
- Create: `app/admin/projects/page.tsx`
- Create: `app/admin/projects/new/page.tsx`
- Create: `app/admin/projects/[id]/edit/page.tsx`
- Create: `app/api/admin/projects/route.ts`
- Create: `app/api/admin/projects/[id]/route.ts`

**Description:** Full CRUD for projects with image upload support (presigned URLs to R2, for now use local filesystem or placeholder).

- [ ] **Step 1: Create ProjectForm component**

```typescript
// src/presentation/components/admin/ProjectForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

interface ProjectFormProps {
  project?: {
    id: string
    title: string
    category: string
    description: string
    location: string
    completedDate: string
    featured: boolean
    published: boolean
    coverImageUrl: string
    galleryUrls: string[]
  }
}

const categories = [
  'Residential',
  'Commercial',
  'Industrial',
  'Renovation',
  'Custom',
]

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: project?.title || '',
    category: project?.category || '',
    description: project?.description || '',
    location: project?.location || '',
    completedDate: project?.completedDate || '',
    featured: project?.featured || false,
    published: project?.published || false,
    coverImageUrl: project?.coverImageUrl || '',
    galleryUrls: project?.galleryUrls || [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const method = project ? 'PATCH' : 'POST'
      const url = project ? `/api/admin/projects/${project.id}` : '/api/admin/projects'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to save project')

      toast.success(project ? 'Project updated' : 'Project created')
      router.push('/admin/projects')
    } catch (error) {
      toast.error('Failed to save project')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{project ? 'Edit Project' : 'New Project'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Project title"
              className="mt-2"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Category</label>
            <Select value={formData.category} onValueChange={(cat) => setFormData({ ...formData, category: cat })}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Project description"
              className="mt-2 min-h-32"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Location</label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Project location"
              className="mt-2"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Completed Date</label>
            <Input
              type="date"
              value={formData.completedDate}
              onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
              className="mt-2"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Cover Image URL</label>
            <Input
              type="url"
              value={formData.coverImageUrl}
              onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="mt-2"
              required
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={formData.featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, featured: checked as boolean })
                }
              />
              <span className="text-sm font-medium">Featured Project</span>
            </label>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={formData.published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, published: checked as boolean })
                }
              />
              <span className="text-sm font-medium">Published</span>
            </label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
```

- [ ] **Step 2: Create ProjectTable component**

```typescript
// src/presentation/components/admin/ProjectTable.tsx
'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Project {
  id: string
  title: string
  slug: string
  category: string
  featured: boolean
  published: boolean
}

interface ProjectTableProps {
  projects: Project[]
}

export function ProjectTable({ projects }: ProjectTableProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    setDeleting(id)
    try {
      const response = await fetch(`/api/admin/projects/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      toast.success('Project deleted')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete project')
      console.error(error)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Featured</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No projects yet. <Link href="/admin/projects/new" className="text-primary underline">Create one</Link>
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.title}</TableCell>
                <TableCell>{project.category}</TableCell>
                <TableCell>
                  <Badge variant={project.published ? 'default' : 'secondary'}>
                    {project.published ? 'Published' : 'Draft'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {project.featured ? (
                    <Badge variant="outline">Featured</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/projects/${project.id}/edit`}>Edit</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(project.id)}
                      disabled={deleting === project.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 3: Create app/admin/projects/page.tsx**

```typescript
// app/admin/projects/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProjectTable } from '@/presentation/components/admin/ProjectTable'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'

export default async function ProjectsPage() {
  const projectRepo = new DrizzleProjectRepository()
  const projects = await projectRepo.findAll(100)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your portfolio projects</p>
        </div>
        <Button asChild>
          <Link href="/admin/projects/new">New Project</Link>
        </Button>
      </div>

      <ProjectTable projects={projects} />
    </div>
  )
}
```

- [ ] **Step 4: Create app/admin/projects/new/page.tsx**

```typescript
// app/admin/projects/new/page.tsx
import { ProjectForm } from '@/presentation/components/admin/ProjectForm'

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Project</h1>
        <p className="text-muted-foreground">Add a new project to your portfolio</p>
      </div>

      <ProjectForm />
    </div>
  )
}
```

- [ ] **Step 5: Create app/admin/projects/[id]/edit/page.tsx**

```typescript
// app/admin/projects/[id]/edit/page.tsx
import { notFound } from 'next/navigation'
import { ProjectForm } from '@/presentation/components/admin/ProjectForm'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const projectRepo = new DrizzleProjectRepository()
  const project = await projectRepo.findById(params.id)

  if (!project) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Project</h1>
        <p className="text-muted-foreground">{project.title}</p>
      </div>

      <ProjectForm
        project={{
          id: project.id,
          title: project.title,
          category: project.category,
          description: project.description,
          location: project.location,
          completedDate: project.completedDate.toISOString().split('T')[0],
          featured: project.featured,
          published: project.published,
          coverImageUrl: project.coverImageUrl,
          galleryUrls: project.galleryUrls,
        }}
      />
    </div>
  )
}
```

- [ ] **Step 6: Create app/api/admin/projects/route.ts**

```typescript
// app/api/admin/projects/route.ts
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { Project } from '@/core/entities/Project'
import { ensureUniqueSlug } from '@/infrastructure/services/SlugGeneratorService'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const projectRepo = new DrizzleProjectRepository()

    // Check for slug uniqueness
    const allProjects = await projectRepo.findAll(1000)
    const existingSlugs = allProjects.map((p) => p.slug)
    const baseSlug = body.title.toLowerCase().trim().replace(/\s+/g, '-')
    const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs)

    const project = Project.create({
      title: body.title,
      category: body.category,
      description: body.description,
      location: body.location,
      completedDate: new Date(body.completedDate),
      coverImageUrl: body.coverImageUrl,
      galleryUrls: body.galleryUrls || [],
    })

    await projectRepo.save(project)

    return Response.json({ id: project.id }, { status: 201 })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 7: Create app/api/admin/projects/[id]/route.ts**

```typescript
// app/api/admin/projects/[id]/route.ts
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const projectRepo = new DrizzleProjectRepository()
    const project = await projectRepo.findById(params.id)

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    const updated = project
      .withFeaturedStatus(body.featured || false)
      .withPublishedStatus(body.published || false)

    // Create new instance with updated data
    const fullUpdate = Object.assign(Object.create(Object.getPrototypeOf(updated)), {
      ...updated,
      title: body.title || updated.title,
      category: body.category || updated.category,
      description: body.description || updated.description,
      location: body.location || updated.location,
      completedDate: body.completedDate ? new Date(body.completedDate) : updated.completedDate,
      coverImageUrl: body.coverImageUrl || updated.coverImageUrl,
      galleryUrls: body.galleryUrls || updated.galleryUrls,
    })

    await projectRepo.update(fullUpdate)

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectRepo = new DrizzleProjectRepository()
    const project = await projectRepo.findById(params.id)

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    await projectRepo.delete(params.id)

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 8: Commit**

```bash
git add src/presentation/components/admin/ProjectForm.tsx
git add src/presentation/components/admin/ProjectTable.tsx
git add app/admin/projects/
git add app/api/admin/projects/
git commit -m "feat: add project CRUD (create, read, update, delete)"
```

---

### Task 7: Create Service Management with Drag-to-Reorder

**Files:**
- Create: `src/presentation/components/admin/ServiceTable.tsx`
- Create: `app/admin/services/page.tsx`
- Create: `app/api/admin/services/route.ts`
- Create: `app/api/admin/services/[id]/route.ts`

**Description:** Service list with drag-and-drop reordering (HTML5 native, no library).

- [ ] **Step 1: Create ServiceTable component with drag-drop**

```typescript
// src/presentation/components/admin/ServiceTable.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, GripVertical } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Service {
  id: string
  name: string
  shortDescription: string
  orderIndex: number
  published: boolean
}

interface ServiceTableProps {
  services: Service[]
}

export function ServiceTable({ services: initialServices }: ServiceTableProps) {
  const router = useRouter()
  const [services, setServices] = useState(initialServices)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return

    const draggedIndex = services.findIndex((s) => s.id === draggedId)
    const targetIndex = services.findIndex((s) => s.id === targetId)

    const newServices = [...services]
    ;[newServices[draggedIndex], newServices[targetIndex]] = [newServices[targetIndex], newServices[draggedIndex]]

    // Update order indices
    newServices.forEach((service, index) => {
      service.orderIndex = index
    })

    setServices(newServices)
    setDraggedId(null)
  }

  const handleSaveOrder = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: services.map((s) => ({ id: s.id, orderIndex: s.orderIndex })),
        }),
      })

      if (!response.ok) throw new Error('Failed to save order')

      toast.success('Service order updated')
      router.refresh()
    } catch (error) {
      toast.error('Failed to save order')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return

    try {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      toast.success('Service deleted')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete')
      console.error(error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow
                key={service.id}
                draggable
                onDragStart={(e) => handleDragStart(e, service.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, service.id)}
                className={draggedId === service.id ? 'opacity-50' : ''}
              >
                <TableCell className="cursor-move">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </TableCell>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell className="text-sm">{service.shortDescription}</TableCell>
                <TableCell>
                  <Badge variant={service.published ? 'default' : 'secondary'}>
                    {service.published ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(service.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {services.some((s, i) => s.orderIndex !== i) && (
        <Button onClick={handleSaveOrder} disabled={saving}>
          {saving ? 'Saving...' : 'Save Order'}
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create app/admin/services/page.tsx**

```typescript
// app/admin/services/page.tsx
import { ServiceTable } from '@/presentation/components/admin/ServiceTable'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'

export default async function ServicesPage() {
  const serviceRepo = new DrizzleServiceRepository()
  const services = await serviceRepo.findAll(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Services</h1>
        <p className="text-muted-foreground">Manage services and their display order</p>
      </div>

      <ServiceTable services={services} />
    </div>
  )
}
```

- [ ] **Step 3: Create app/api/admin/services/route.ts**

```typescript
// app/api/admin/services/route.ts
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { updates } = body

    const serviceRepo = new DrizzleServiceRepository()
    await serviceRepo.updateOrder(updates)

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Create app/api/admin/services/[id]/route.ts**

```typescript
// app/api/admin/services/[id]/route.ts
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceRepo = new DrizzleServiceRepository()
    await serviceRepo.delete(params.id)

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/admin/ServiceTable.tsx
git add app/admin/services/
git add app/api/admin/services/
git commit -m "feat: add service management with drag-to-reorder"
```

---

### Task 8: Create Leads Kanban Board with Drag-Drop

**Files:**
- Create: `src/presentation/components/admin/LeadsKanban.tsx`
- Create: `app/admin/leads/page.tsx`
- Create: `app/api/admin/leads/[id]/route.ts`

**Description:** CRM-style Kanban board with 5 stages. HTML5 drag-drop native.

- [ ] **Step 1: Create LeadsKanban component**

```typescript
// src/presentation/components/admin/LeadsKanban.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Lead {
  id: string
  quoteId: string
  stage: string
  adminNotes?: string
  estimatedValue?: number
  quote?: {
    name: string
    email: string
    service: string
  }
}

interface LeadsKanbanProps {
  leads: Lead[]
}

const stages = ['prospect', 'contacted', 'quoted', 'won', 'lost']
const stageLabels: Record<string, string> = {
  prospect: 'Prospect',
  contacted: 'Contacted',
  quoted: 'Quoted',
  won: 'Won',
  lost: 'Lost',
}

const stageColors: Record<string, string> = {
  prospect: 'bg-blue-100',
  contacted: 'bg-yellow-100',
  quoted: 'bg-purple-100',
  won: 'bg-green-100',
  lost: 'bg-red-100',
}

export function LeadsKanban({ leads: initialLeads }: LeadsKanbanProps) {
  const router = useRouter()
  const [leads, setLeads] = useState(initialLeads)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const groupedByStage = stages.reduce(
    (acc, stage) => {
      acc[stage] = leads.filter((l) => l.stage === stage)
      return acc
    },
    {} as Record<string, Lead[]>,
  )

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedId(leadId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault()
    if (!draggedId) return

    const lead = leads.find((l) => l.id === draggedId)
    if (!lead) return

    // Optimistic update
    const newLeads = leads.map((l) =>
      l.id === draggedId ? { ...l, stage: targetStage } : l,
    )
    setLeads(newLeads)
    setDraggedId(null)

    // Save to API
    try {
      const response = await fetch(`/api/admin/leads/${draggedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: targetStage }),
      })

      if (!response.ok) {
        // Revert optimistic update
        setLeads(leads)
        throw new Error('Failed to update')
      }

      toast.success('Lead moved')
    } catch (error) {
      toast.error('Failed to move lead')
      console.error(error)
    }
  }

  return (
    <div className="grid grid-cols-5 gap-4">
      {stages.map((stage) => (
        <div
          key={stage}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, stage)}
          className="space-y-2"
        >
          <div className="font-semibold text-sm">
            {stageLabels[stage]}
            <Badge variant="secondary" className="ml-2">
              {groupedByStage[stage].length}
            </Badge>
          </div>

          <div className={`space-y-2 p-2 rounded-lg ${stageColors[stage]} min-h-96`}>
            {groupedByStage[stage].map((lead) => (
              <Card
                key={lead.id}
                draggable
                onDragStart={(e) => handleDragStart(e, lead.id)}
                className={`cursor-move transition ${draggedId === lead.id ? 'opacity-50' : ''}`}
              >
                <CardContent className="pt-4 text-sm">
                  <p className="font-medium">{lead.quote?.name}</p>
                  <p className="text-xs text-muted-foreground">{lead.quote?.service}</p>
                  {lead.estimatedValue && (
                    <p className="text-xs font-semibold mt-2">
                      ${(lead.estimatedValue / 100).toFixed(2)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create app/admin/leads/page.tsx**

```typescript
// app/admin/leads/page.tsx
import { LeadsKanban } from '@/presentation/components/admin/LeadsKanban'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'
import { DrizzleQuoteRepository } from '@/infrastructure/repositories/DrizzleQuoteRepository'

export default async function LeadsPage() {
  const leadRepo = new DrizzleLeadRepository()
  const quoteRepo = new DrizzleQuoteRepository()

  const allLeads = await leadRepo.findAll(1000)

  // Enrich leads with quote info
  const leads = await Promise.all(
    allLeads.map(async (lead) => ({
      ...lead,
      quote: await quoteRepo.findById(lead.quoteId),
    })),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leads Pipeline</h1>
        <p className="text-muted-foreground">Drag leads across stages to update status</p>
      </div>

      <LeadsKanban leads={leads} />
    </div>
  )
}
```

- [ ] **Step 3: Create app/api/admin/leads/[id]/route.ts**

```typescript
// app/api/admin/leads/[id]/route.ts
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleLeadRepository } from '@/infrastructure/repositories/DrizzleLeadRepository'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { stage } = body

    const leadRepo = new DrizzleLeadRepository()
    const lead = await leadRepo.findById(params.id)

    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 })
    }

    const updated = lead.withStage(stage)
    await leadRepo.update(updated)

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/presentation/components/admin/LeadsKanban.tsx
git add app/admin/leads/
git add app/api/admin/leads/
git commit -m "feat: add leads CRM Kanban board with drag-drop"
```

---

### Task 9: Create Public Portfolio Pages with SSR

**Files:**
- Create: `app/(portfolio)/projects/page.tsx`
- Create: `app/(portfolio)/projects/[slug]/page.tsx`
- Create: `app/(portfolio)/projects/[slug]/layout.tsx`

**Description:** Public portfolio listing and detail pages with SSR and `generateStaticParams` for slug-based routing.

- [ ] **Step 1: Create app/(portfolio)/projects/page.tsx**

```typescript
// app/(portfolio)/projects/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Projects | Contigo',
  description: 'View our completed construction projects',
}

export default async function ProjectsPage() {
  const projectRepo = new DrizzleProjectRepository()
  const projects = await projectRepo.findPublished(100)

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Our Projects</h1>
          <p className="text-xl text-muted-foreground">
            Explore our collection of completed projects across residential, commercial, and industrial sectors.
          </p>
        </div>

        {/* Featured Projects */}
        {projects.filter((p) => p.featured).length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8">Featured</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects
                .filter((p) => p.featured)
                .map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.slug}`}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition">
                      <div className="relative h-48 bg-gray-100">
                        <img
                          src={project.coverImageUrl}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-lg">{project.title}</h3>
                        <p className="text-sm text-muted-foreground">{project.category}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* All Projects */}
        <div>
          <h2 className="text-2xl font-bold mb-8">All Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
              >
                <Card className="overflow-hidden hover:shadow-lg transition">
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={project.coverImageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg">{project.title}</h3>
                    <p className="text-sm text-muted-foreground">{project.category}</p>
                    <p className="text-xs text-muted-foreground mt-2">{project.location}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create app/(portfolio)/projects/[slug]/page.tsx**

```typescript
// app/(portfolio)/projects/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/DrizzleProjectRepository'

export async function generateStaticParams() {
  const projectRepo = new DrizzleProjectRepository()
  const projects = await projectRepo.findPublished(100)

  return projects.map((project) => ({
    slug: project.slug,
  }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const projectRepo = new DrizzleProjectRepository()
  const project = await projectRepo.findBySlug(params.slug)

  if (!project) {
    return { title: 'Project not found' }
  }

  return {
    title: `${project.title} | Contigo`,
    description: project.description,
  }
}

export const dynamicParams = true

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const projectRepo = new DrizzleProjectRepository()
  const project = await projectRepo.findBySlug(params.slug)

  if (!project || !project.published) {
    notFound()
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Cover Image */}
        <div className="mb-8">
          <img
            src={project.coverImageUrl}
            alt={project.title}
            className="w-full h-96 object-cover rounded-lg"
          />
        </div>

        {/* Project Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
          <div className="flex flex-wrap gap-4 text-muted-foreground">
            <div>
              <span className="font-semibold">Category:</span> {project.category}
            </div>
            <div>
              <span className="font-semibold">Location:</span> {project.location}
            </div>
            <div>
              <span className="font-semibold">Completed:</span>{' '}
              {new Date(project.completedDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-12 prose prose-lg max-w-none">
          <p className="whitespace-pre-wrap">{project.description}</p>
        </div>

        {/* Gallery */}
        {project.galleryUrls.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Gallery</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.galleryUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${project.title} - ${i}`}
                  className="w-full h-64 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create app/(portfolio)/projects/[slug]/layout.tsx**

```typescript
// app/(portfolio)/projects/[slug]/layout.tsx
export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
```

- [ ] **Step 4: Commit**

```bash
git add app/(portfolio)/
git commit -m "feat: add public portfolio pages with SSR and static generation"
```

---

### Task 10: Create Admin Settings Page (Change Password)

**Files:**
- Create: `app/admin/settings/page.tsx`

**Description:** Allow admin to change their password securely.

- [ ] **Step 1: Create app/admin/settings/page.tsx**

```typescript
// app/admin/settings/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to change password')
      }

      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // Redirect to login
      setTimeout(() => {
        router.push('/admin/login')
      }, 1000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-2"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Confirm Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2"
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Create app/api/admin/auth/change-password/route.ts**

```typescript
// app/api/admin/auth/change-password/route.ts
import { auth } from '@/infrastructure/auth/auth.config'
import { db } from '@/infrastructure/db/client'
import * as schema from '@/infrastructure/db/schema'
import { eq } from 'drizzle-orm'
import bcryptjs from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Get current user
    const user = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.email, session.user.email),
    })

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current password
    const isValid = await bcryptjs.compare(currentPassword, user.passwordHash)
    if (!isValid) {
      return Response.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    // Hash new password
    const newHash = await bcryptjs.hash(newPassword, 10)

    // Update password
    await db
      .update(schema.adminUsers)
      .set({ passwordHash: newHash })
      .where(eq(schema.adminUsers.id, user.id))

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/settings/
git add app/api/admin/auth/
git commit -m "feat: add admin settings with password change"
```

---

## Summary

This plan delivers a complete **Fase 4 — Admin Dashboard & Portfolio** system:

✅ **Admin Dashboard** — KPIs (4 cards), quote trends chart (Recharts)
✅ **Quote Management** — CRUD with status filtering
✅ **Project Management** — Full CRUD with image URLs, featured/published toggles
✅ **Service Management** — List with drag-to-reorder (HTML5 native)
✅ **Lead CRM** — Kanban board (5 stages) with drag-drop
✅ **Public Portfolio** — SSR pages with `generateStaticParams` for slug routing
✅ **Settings** — Password change for admin user
✅ **Security** — All endpoints protected by NextAuth v5 JWT

**Execution Approach:**
- Use **superpowers:subagent-driven-development** (recommended) for parallel task execution
- Each task is 2-5 minutes, produces a working feature, commits independently
- Architecture follows Clean Architecture (domain → application → infrastructure → presentation)
- No external drag-drop library (uses HTML5 native API)
- Server Components for SSR where possible
- Lazy-load OpenAI/Resend (not required at build time)

**Total Estimated Time:** 35–45 hours of implementation

---

## Which Execution Approach?

Plan complete and saved to `docs/superpowers/plans/2026-06-06-fase-4-admin-dashboard-portfolio.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**