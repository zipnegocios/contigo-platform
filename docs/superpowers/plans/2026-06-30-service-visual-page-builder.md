# Service Detail Visual Page Builder — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a split-pane Visual Page Builder for service detail pages in the admin, backed by a JSONB block system, with a public renderer that falls back to the legacy template for services without blocks.

**Architecture:** Add a `pageBlocks` JSONB column to the `services` table; store an ordered array of typed block objects (discriminated union with 10 V1 types). The admin builder at `/admin/services/[id]/builder` provides a full-screen split-pane UI (block list + editor left pane, live React preview right pane). The public page at `/services/[category]/[item]` renders blocks via `PageBlockRenderer` when `pageBlocks` is non-empty, or the extracted `LegacyServiceTemplate` when not.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict, Drizzle ORM + PostgreSQL, `@dnd-kit/sortable` (already installed), TipTap (`@tiptap/react` + `@tiptap/starter-kit` — new install), shadcn/ui components, `nanoid` (check if installed; if not, use `crypto.randomUUID()`), Cloudflare R2 (existing upload utilities in `src/presentation/lib/`).

## Global Constraints

- **All UI text in English** — buttons, labels, toasts, placeholders, headings
- **No test files** — project has zero test infrastructure; verify via `npx tsc --noEmit` + `npm run build` + manual browser checks
- **TypeScript strict** — no `any` types without an inline comment explaining why
- **Design tokens:** `--contigo-primary: #E2C063`, petrol dark `#2D2924`, muted `#6B6560`, warm cream `#F5EFE8`, border `#E5DDD0`. Display headings use `fontFamily: 'var(--font-cormorant)'`. Use fluid typography classes: `text-fluid-xs`, `text-fluid-sm`, `text-fluid-base`, `text-fluid-xl`, `text-fluid-3xl`
- **No new DB tables** — `pageBlocks` lives as a JSONB column on the existing `services` table
- **Backwards compat** — `pageBlocks === null` means render legacy template; never break existing service pages
- **Block IDs** — use `crypto.randomUUID()` for new block IDs (no need to install nanoid)
- **Upload pattern** — reuse `CoverMediaSelector` from `src/presentation/components/admin/CoverMediaSelector.tsx` for any single-image upload in block editors
- **Gallery pattern** — reuse `GalleryManagerModal` from `src/presentation/components/admin/` for multi-image uploads

---

## File Map

**New files:**
```
src/types/pageBlocks.ts                                          ← block type definitions
src/presentation/components/blocks/HeroBlock.tsx                ← public renderers
src/presentation/components/blocks/RichTextBlock.tsx
src/presentation/components/blocks/GalleryBlock.tsx
src/presentation/components/blocks/ProcessBlock.tsx
src/presentation/components/blocks/TwoColumnBlock.tsx
src/presentation/components/blocks/FeaturesGridBlock.tsx
src/presentation/components/blocks/CtaBlock.tsx
src/presentation/components/blocks/ImageCarouselBlock.tsx
src/presentation/components/blocks/ComparisonCardsBlock.tsx
src/presentation/components/blocks/WhatsAppCtaBlock.tsx
src/presentation/components/PageBlockRenderer.tsx               ← public orchestrator
app/admin/(protected)/services/[id]/builder/layout.tsx         ← full-screen, no sidebar
app/admin/(protected)/services/[id]/builder/page.tsx           ← server: load service
src/presentation/components/admin/page-builder/ServicePageBuilder.tsx   ← client root
src/presentation/components/admin/page-builder/BlockList.tsx            ← DnD list
src/presentation/components/admin/page-builder/BlockPicker.tsx          ← type selector
src/presentation/components/admin/page-builder/BlockEditorPanel.tsx     ← routes to editors
src/presentation/components/admin/page-builder/editors/HeroEditor.tsx
src/presentation/components/admin/page-builder/editors/RichTextEditor.tsx
src/presentation/components/admin/page-builder/editors/GalleryEditor.tsx
src/presentation/components/admin/page-builder/editors/ProcessEditor.tsx
src/presentation/components/admin/page-builder/editors/TwoColumnEditor.tsx
src/presentation/components/admin/page-builder/editors/FeaturesGridEditor.tsx
src/presentation/components/admin/page-builder/editors/CtaEditor.tsx
src/presentation/components/admin/page-builder/editors/ImageCarouselEditor.tsx
src/presentation/components/admin/page-builder/editors/ComparisonCardsEditor.tsx
src/presentation/components/admin/page-builder/editors/WhatsAppCtaEditor.tsx
```

**Modified files:**
```
src/infrastructure/db/schema.ts                                 ← add pageBlocks column
src/core/entities/Service.ts                                    ← add pageBlocks field
src/infrastructure/repositories/DrizzleServiceRepository.ts    ← persist pageBlocks
app/api/admin/services/[id]/route.ts                           ← PATCH accepts pageBlocks
app/(portfolio)/services/[category]/[item]/page.tsx            ← conditional rendering
src/presentation/components/admin/ServiceGroupedView.tsx       ← add Builder button
```

---

## Task 1: Publish All Services + Define PageBlock Types

**Files:**
- Create: `src/types/pageBlocks.ts`
- SQL fix (one-time, run in db:studio or via script)

**Interfaces:**
- Produces: `PageBlock` discriminated union + 10 `*BlockData` interfaces — used by all subsequent tasks

- [ ] **Step 1: Run the publish fix SQL**

Open Drizzle Studio (`npm run db:studio`) and run:
```sql
UPDATE services SET published = true WHERE published = false;
```
Expected: all 30 services now have `published = true`.

- [ ] **Step 2: Create `src/types/pageBlocks.ts`**

```ts
export type PageBlock =
  | { id: string; type: 'hero';             data: HeroBlockData }
  | { id: string; type: 'rich-text';        data: RichTextBlockData }
  | { id: string; type: 'gallery';          data: GalleryBlockData }
  | { id: string; type: 'process';          data: ProcessBlockData }
  | { id: string; type: 'two-column';       data: TwoColumnBlockData }
  | { id: string; type: 'features-grid';    data: FeaturesGridBlockData }
  | { id: string; type: 'cta';             data: CtaBlockData }
  | { id: string; type: 'image-carousel';   data: ImageCarouselBlockData }
  | { id: string; type: 'comparison-cards'; data: ComparisonCardsBlockData }
  | { id: string; type: 'whatsapp-cta';     data: WhatsAppCtaBlockData }

export interface HeroBlockData {
  imageUrl: string
  videoUrl?: string
  title: string
  subtitle?: string
  overlayOpacity: number  // 0-100
}

export interface RichTextBlockData {
  html: string
}

export interface GalleryBlockData {
  items: Array<{ url: string; order: number }>
}

export interface ProcessBlockData {
  steps: Array<{ title: string; description: string }>
}

export interface TwoColumnBlockData {
  imageUrl: string
  imageSide: 'left' | 'right'
  title?: string
  text: string
}

export interface FeaturesGridBlockData {
  features: Array<{ iconName: string; title: string; description: string }>
}

export interface CtaBlockData {
  title?: string
  subtitle?: string
  primaryBtn: { label: string; href: string }
  secondaryBtn?: { label: string; href: string }
}

export interface ImageCarouselBlockData {
  images: Array<{ url: string; caption?: string }>
}

export interface ComparisonCardsBlockData {
  cards: Array<{ title: string; imageUrl?: string; points: string[] }>
}

export interface WhatsAppCtaBlockData {
  phoneNumber: string
  message: string
  label: string
  style: 'button' | 'banner'
}

// Default data for each block type (used when adding a new block)
export const BLOCK_DEFAULTS: { [K in PageBlock['type']]: Extract<PageBlock, { type: K }>['data'] } = {
  'hero':             { imageUrl: '', title: '', subtitle: '', overlayOpacity: 40 },
  'rich-text':        { html: '<p>Enter your text here.</p>' },
  'gallery':          { items: [] },
  'process':          { steps: [{ title: 'Step 1', description: '' }] },
  'two-column':       { imageUrl: '', imageSide: 'left', title: '', text: '' },
  'features-grid':    { features: [{ iconName: 'check', title: '', description: '' }] },
  'cta':             { title: '', subtitle: '', primaryBtn: { label: 'Request a Quote', href: '/#contact' } },
  'image-carousel':  { images: [] },
  'comparison-cards': { cards: [{ title: 'Option A', points: [''] }] },
  'whatsapp-cta':    { phoneNumber: '', message: 'Hi, I\'m interested in your services.', label: 'Chat on WhatsApp', style: 'button' },
}

export const BLOCK_LABELS: Record<PageBlock['type'], string> = {
  'hero':             'Hero / Banner',
  'rich-text':        'Rich Text',
  'gallery':          'Gallery',
  'process':          'Process / Steps',
  'two-column':       'Two Column',
  'features-grid':    'Features Grid',
  'cta':             'CTA Block',
  'image-carousel':  'Image Carousel',
  'comparison-cards': 'Comparison Cards',
  'whatsapp-cta':    'WhatsApp CTA',
}
```

- [ ] **Step 3: Verify types compile**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/pageBlocks.ts
git commit -m "feat: define PageBlock discriminated union with 10 V1 block types"
```

---

## Task 2: DB Schema Column + Migration

**Files:**
- Modify: `src/infrastructure/db/schema.ts` (lines 244–252, after `galleryItems`)

**Interfaces:**
- Consumes: `PageBlock` from `src/types/pageBlocks.ts`
- Produces: `services.pageBlocks` Drizzle column — used by repository in Task 3

- [ ] **Step 1: Add import for PageBlock to schema.ts**

At the top of `src/infrastructure/db/schema.ts`, add import:
```ts
import type { PageBlock } from '@/types/pageBlocks'
```

- [ ] **Step 2: Add `pageBlocks` column to the services table**

In `src/infrastructure/db/schema.ts`, find the services table definition (around line 245). After the `galleryItems` line, add:

```ts
// Before (existing lines):
    galleryItems: jsonb('gallery_items').$type<GalleryItem[]>().notNull().default(sql`'[]'::jsonb`),
    orderIndex: integer('order_index').notNull().default(0),

// After:
    galleryItems: jsonb('gallery_items').$type<GalleryItem[]>().notNull().default(sql`'[]'::jsonb`),
    pageBlocks: jsonb('page_blocks').$type<PageBlock[]>(),
    orderIndex: integer('order_index').notNull().default(0),
```

Note: no `.notNull()` — null means "use legacy template".

- [ ] **Step 3: Push schema to database**

```bash
npm run db:push
```
Accept the prompt to add the column. Expected: column `page_blocks` added to `services` table.

- [ ] **Step 4: Verify in Drizzle Studio**

```bash
npm run db:studio
```
Navigate to the `services` table. Confirm `page_blocks` column exists and is `null` for all existing rows.

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/db/schema.ts
git commit -m "feat: add page_blocks jsonb column to services table"
```

---

## Task 3: Service Entity + Repository + API

**Files:**
- Modify: `src/core/entities/Service.ts`
- Modify: `src/infrastructure/repositories/DrizzleServiceRepository.ts`
- Modify: `app/api/admin/services/[id]/route.ts`

**Interfaces:**
- Consumes: `PageBlock` from `src/types/pageBlocks.ts`; schema column from Task 2
- Produces: `service.pageBlocks: PageBlock[] | null` on every Service instance; API PATCH accepts `pageBlocks`

- [ ] **Step 1: Update `src/core/entities/Service.ts`**

Add `pageBlocks` to `CreateServiceInput`, the private constructor props, all static methods, and class fields. Replace the entire file:

```ts
import { generateSlug } from '@/infrastructure/services/SlugGeneratorService'
import type { GalleryItem } from '@/types/media'
import type { PageBlock } from '@/types/pageBlocks'

export interface CreateServiceInput {
  name: string
  shortDescription: string
  fullDescription: string
  imageUrl: string
  posterUrl?: string | null
  galleryItems?: GalleryItem[]
  orderIndex?: number
  categoryId?: string | null
  pageBlocks?: PageBlock[] | null
}

export class Service {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly shortDescription: string
  readonly fullDescription: string
  readonly imageUrl: string
  readonly posterUrl: string | null
  readonly galleryItems: GalleryItem[]
  readonly orderIndex: number
  readonly categoryId: string | null
  readonly published: boolean
  readonly pageBlocks: PageBlock[] | null
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: {
    id: string
    slug: string
    name: string
    shortDescription: string
    fullDescription: string
    imageUrl: string
    posterUrl: string | null
    galleryItems: GalleryItem[]
    orderIndex: number
    categoryId: string | null
    published: boolean
    pageBlocks: PageBlock[] | null
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = props.id
    this.slug = props.slug
    this.name = props.name
    this.shortDescription = props.shortDescription
    this.fullDescription = props.fullDescription
    this.imageUrl = props.imageUrl
    this.posterUrl = props.posterUrl
    this.galleryItems = props.galleryItems
    this.orderIndex = props.orderIndex
    this.categoryId = props.categoryId
    this.published = props.published
    this.pageBlocks = props.pageBlocks
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static create(input: CreateServiceInput): Service {
    const id = crypto.randomUUID()
    const slug = generateSlug(input.name)
    const now = new Date()

    return new Service({
      id,
      slug,
      name: input.name.trim(),
      shortDescription: input.shortDescription.trim(),
      fullDescription: input.fullDescription.trim(),
      imageUrl: input.imageUrl.trim(),
      posterUrl: input.posterUrl ?? null,
      galleryItems: input.galleryItems || [],
      orderIndex: input.orderIndex || 0,
      categoryId: input.categoryId ?? null,
      published: true,
      pageBlocks: input.pageBlocks ?? null,
      createdAt: now,
      updatedAt: now,
    })
  }

  withOrder(orderIndex: number): Service {
    return new Service({
      id: this.id,
      slug: this.slug,
      name: this.name,
      shortDescription: this.shortDescription,
      fullDescription: this.fullDescription,
      imageUrl: this.imageUrl,
      posterUrl: this.posterUrl,
      galleryItems: this.galleryItems,
      orderIndex,
      categoryId: this.categoryId,
      published: this.published,
      pageBlocks: this.pageBlocks,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  static reconstruct(props: {
    id: string
    slug: string
    name: string
    shortDescription: string
    fullDescription: string
    imageUrl: string
    posterUrl: string | null
    galleryItems: GalleryItem[]
    orderIndex: number
    categoryId?: string | null
    published: boolean
    pageBlocks: PageBlock[] | null
    createdAt: Date
    updatedAt: Date
  }): Service {
    return new Service({ ...props, categoryId: props.categoryId ?? null })
  }
}
```

- [ ] **Step 2: Update `DrizzleServiceRepository.ts`**

Add `pageBlocks` to `save()`, `update()`, and `mapRowToService()`:

In `save()`, add to the `.values({...})` object:
```ts
pageBlocks: service.pageBlocks,
```

In `update()`, add to the `.set({...})` object:
```ts
pageBlocks: service.pageBlocks,
```

In `mapRowToService()`, add to the `Service.reconstruct({...})` call:
```ts
pageBlocks: (row.pageBlocks as PageBlock[] | null) ?? null,
```

Also add the import at the top:
```ts
import type { PageBlock } from '@/types/pageBlocks'
```

- [ ] **Step 3: Update `app/api/admin/services/[id]/route.ts` PATCH handler**

In the `Service.reconstruct({...})` call inside PATCH, add:
```ts
pageBlocks: body.pageBlocks !== undefined ? (body.pageBlocks as PageBlock[] | null) : service.pageBlocks,
```

Also add the import:
```ts
import type { PageBlock } from '@/types/pageBlocks'
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/core/entities/Service.ts src/infrastructure/repositories/DrizzleServiceRepository.ts app/api/admin/services/[id]/route.ts
git commit -m "feat: add pageBlocks field to Service entity, repository, and PATCH API"
```

---

## Task 4: Install TipTap + Public Block Renderers (Hero, RichText, Gallery, Process, TwoColumn)

**Files:**
- Install: `@tiptap/react @tiptap/pm @tiptap/starter-kit`
- Create: `src/presentation/components/blocks/HeroBlock.tsx`
- Create: `src/presentation/components/blocks/RichTextBlock.tsx`
- Create: `src/presentation/components/blocks/GalleryBlock.tsx`
- Create: `src/presentation/components/blocks/ProcessBlock.tsx`
- Create: `src/presentation/components/blocks/TwoColumnBlock.tsx`

**Interfaces:**
- Consumes: `HeroBlockData`, `RichTextBlockData`, `GalleryBlockData`, `ProcessBlockData`, `TwoColumnBlockData` from `src/types/pageBlocks.ts`; `ProjectGallery` from `src/presentation/components/ProjectGallery.tsx`
- Produces: 5 React components, each accepting their `data` prop — used by `PageBlockRenderer` in Task 5

- [ ] **Step 1: Install TipTap**

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
```
Expected: packages added to node_modules and package.json.

- [ ] **Step 2: Create `src/presentation/components/blocks/HeroBlock.tsx`**

```tsx
import type { HeroBlockData } from '@/types/pageBlocks'

interface HeroBlockProps { data: HeroBlockData }

export function HeroBlock({ data }: HeroBlockProps) {
  const isVideo = data.videoUrl && /\.(mp4|webm|ogg|mov)$/i.test(data.videoUrl)
  const overlay = `rgba(0,0,0,${data.overlayOpacity / 100})`

  return (
    <section className="relative w-full" style={{ minHeight: '70vh', maxHeight: '600px' }}>
      {isVideo ? (
        <video
          src={data.videoUrl}
          poster={data.imageUrl || undefined}
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : data.imageUrl ? (
        <img
          src={data.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[#2D2924]" />
      )}
      <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${overlay} 0%, transparent 60%)` }} />
      <div className="relative z-10 h-full flex flex-col justify-end px-6 pb-10 max-w-4xl mx-auto" style={{ minHeight: '70vh' }}>
        {data.title && (
          <h1
            className="text-fluid-3xl font-semibold mb-2"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#FAF6F0', lineHeight: 1.2 }}
          >
            {data.title}
          </h1>
        )}
        {data.subtitle && (
          <p className="text-fluid-base" style={{ color: 'rgba(250,246,240,0.85)' }}>
            {data.subtitle}
          </p>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create `src/presentation/components/blocks/RichTextBlock.tsx`**

```tsx
import type { RichTextBlockData } from '@/types/pageBlocks'

interface RichTextBlockProps { data: RichTextBlockData }

export function RichTextBlock({ data }: RichTextBlockProps) {
  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <div
        className="prose prose-lg max-w-none"
        style={{ color: '#3D3530', fontFamily: 'var(--font-cormorant)' }}
        dangerouslySetInnerHTML={{ __html: data.html }}
      />
    </section>
  )
}
```

- [ ] **Step 4: Create `src/presentation/components/blocks/GalleryBlock.tsx`**

```tsx
import type { GalleryBlockData } from '@/types/pageBlocks'
import { ProjectGallery } from '@/presentation/components/ProjectGallery'

interface GalleryBlockProps { data: GalleryBlockData }

export function GalleryBlock({ data }: GalleryBlockProps) {
  if (data.items.length === 0) return null
  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <ProjectGallery items={data.items} />
    </section>
  )
}
```

- [ ] **Step 5: Create `src/presentation/components/blocks/ProcessBlock.tsx`**

```tsx
import type { ProcessBlockData } from '@/types/pageBlocks'

interface ProcessBlockProps { data: ProcessBlockData }

export function ProcessBlock({ data }: ProcessBlockProps) {
  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <ol className="space-y-8">
        {data.steps.map((step, idx) => (
          <li key={idx} className="flex gap-6">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-fluid-base font-bold"
              style={{ backgroundColor: 'rgba(226,192,99,0.15)', color: '#A07B2A', border: '1.5px solid #E2C063' }}
            >
              {idx + 1}
            </div>
            <div>
              <h3 className="text-fluid-xl font-semibold mb-1" style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}>
                {step.title}
              </h3>
              {step.description && (
                <p className="text-fluid-sm" style={{ color: '#6B6560' }}>{step.description}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
```

- [ ] **Step 6: Create `src/presentation/components/blocks/TwoColumnBlock.tsx`**

```tsx
import type { TwoColumnBlockData } from '@/types/pageBlocks'

interface TwoColumnBlockProps { data: TwoColumnBlockData }

export function TwoColumnBlock({ data }: TwoColumnBlockProps) {
  const imgEl = data.imageUrl ? (
    <div className="flex-1 min-h-[300px]">
      <img src={data.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
    </div>
  ) : null

  const textEl = (
    <div className="flex-1 flex flex-col justify-center py-4">
      {data.title && (
        <h2 className="text-fluid-xl font-semibold mb-4" style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}>
          {data.title}
        </h2>
      )}
      <p className="text-fluid-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#6B6560' }}>{data.text}</p>
    </div>
  )

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col lg:flex-row gap-10 items-center">
        {data.imageSide === 'left' ? (
          <>{imgEl}{textEl}</>
        ) : (
          <>{textEl}{imgEl}</>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 7: Verify types**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/presentation/components/blocks/ package.json package-lock.json
git commit -m "feat: install TipTap, create Hero/RichText/Gallery/Process/TwoColumn block renderers"
```

---

## Task 5: Remaining Block Renderers + PageBlockRenderer

**Files:**
- Create: `src/presentation/components/blocks/FeaturesGridBlock.tsx`
- Create: `src/presentation/components/blocks/CtaBlock.tsx`
- Create: `src/presentation/components/blocks/ImageCarouselBlock.tsx`
- Create: `src/presentation/components/blocks/ComparisonCardsBlock.tsx`
- Create: `src/presentation/components/blocks/WhatsAppCtaBlock.tsx`
- Create: `src/presentation/components/PageBlockRenderer.tsx`

**Interfaces:**
- Consumes: all remaining `*BlockData` interfaces; all 10 block components
- Produces: `PageBlockRenderer` — used by the public service detail page in Task 6

- [ ] **Step 1: Create `src/presentation/components/blocks/FeaturesGridBlock.tsx`**

```tsx
import type { FeaturesGridBlockData } from '@/types/pageBlocks'
import * as Icons from 'lucide-react'

interface FeaturesGridBlockProps { data: FeaturesGridBlockData }

export function FeaturesGridBlock({ data }: FeaturesGridBlockProps) {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.features.map((feature, idx) => {
          // Dynamically resolve Lucide icon by name (PascalCase)
          const iconKey = feature.iconName
            ? feature.iconName.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
            : null
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const IconComp = iconKey ? (Icons as any)[iconKey] : null

          return (
            <div key={idx} className="flex flex-col gap-3">
              {IconComp && (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(226,192,99,0.12)' }}
                >
                  <IconComp className="w-5 h-5" style={{ color: '#E2C063' }} />
                </div>
              )}
              <h3 className="text-fluid-base font-semibold" style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}>
                {feature.title}
              </h3>
              <p className="text-fluid-sm" style={{ color: '#6B6560' }}>{feature.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create `src/presentation/components/blocks/CtaBlock.tsx`**

```tsx
import Link from 'next/link'
import type { CtaBlockData } from '@/types/pageBlocks'

interface CtaBlockProps { data: CtaBlockData }

export function CtaBlock({ data }: CtaBlockProps) {
  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <div
        className="rounded-2xl px-8 py-10 text-center"
        style={{ backgroundColor: '#2D2924' }}
      >
        {data.title && (
          <h2 className="text-fluid-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-cormorant)', color: '#FAF6F0' }}>
            {data.title}
          </h2>
        )}
        {data.subtitle && (
          <p className="text-fluid-sm mb-6" style={{ color: 'rgba(250,246,240,0.7)' }}>{data.subtitle}</p>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href={data.primaryBtn.href}
            className="px-6 py-3 rounded-lg font-semibold text-fluid-sm transition-all min-h-[44px] inline-flex items-center"
            style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
          >
            {data.primaryBtn.label}
          </Link>
          {data.secondaryBtn && (
            <Link
              href={data.secondaryBtn.href}
              className="px-6 py-3 rounded-lg font-semibold text-fluid-sm transition-all min-h-[44px] inline-flex items-center"
              style={{ border: '1.5px solid rgba(250,246,240,0.3)', color: '#FAF6F0' }}
            >
              {data.secondaryBtn.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create `src/presentation/components/blocks/ImageCarouselBlock.tsx`**

```tsx
'use client'
import { useRef } from 'react'
import type { ImageCarouselBlockData } from '@/types/pageBlocks'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageCarouselBlockProps { data: ImageCarouselBlockData }

export function ImageCarouselBlock({ data }: ImageCarouselBlockProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (data.images.length === 0) return null

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(45,41,36,0.7)', color: '#FAF6F0' }}
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {data.images.map((img, idx) => (
            <div key={idx} className="flex-shrink-0 w-72">
              <img
                src={img.url}
                alt={img.caption || ''}
                className="w-full h-48 object-cover rounded-lg"
                style={{ border: '1px solid #E5DDD0' }}
              />
              {img.caption && (
                <p className="text-fluid-xs mt-2 text-center" style={{ color: '#9C8F83' }}>{img.caption}</p>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(45,41,36,0.7)', color: '#FAF6F0' }}
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Create `src/presentation/components/blocks/ComparisonCardsBlock.tsx`**

```tsx
import type { ComparisonCardsBlockData } from '@/types/pageBlocks'
import { Check } from 'lucide-react'

interface ComparisonCardsBlockProps { data: ComparisonCardsBlockData }

export function ComparisonCardsBlock({ data }: ComparisonCardsBlockProps) {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.cards.map((card, idx) => (
          <div
            key={idx}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid #E5DDD0', backgroundColor: '#FAFAF8' }}
          >
            {card.imageUrl && (
              <img src={card.imageUrl} alt={card.title} className="w-full h-44 object-cover" />
            )}
            <div className="p-5">
              <h3 className="text-fluid-base font-semibold mb-3" style={{ fontFamily: 'var(--font-cormorant)', color: '#2D2924' }}>
                {card.title}
              </h3>
              <ul className="space-y-2">
                {card.points.filter(Boolean).map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-fluid-sm" style={{ color: '#6B6560' }}>
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#E2C063' }} />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Create `src/presentation/components/blocks/WhatsAppCtaBlock.tsx`**

```tsx
import type { WhatsAppCtaBlockData } from '@/types/pageBlocks'
import { MessageCircle } from 'lucide-react'

interface WhatsAppCtaBlockProps { data: WhatsAppCtaBlockData }

export function WhatsAppCtaBlock({ data }: WhatsAppCtaBlockProps) {
  const cleanPhone = data.phoneNumber.replace(/\D/g, '')
  const encodedMsg = encodeURIComponent(data.message)
  const href = `https://wa.me/${cleanPhone}?text=${encodedMsg}`

  if (data.style === 'banner') {
    return (
      <section className="w-full px-6 py-10" style={{ backgroundColor: '#25D366' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-fluid-base font-semibold text-white">{data.label}</p>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-fluid-sm min-h-[44px]"
            style={{ backgroundColor: 'white', color: '#25D366' }}
          >
            <MessageCircle className="w-4 h-4" />
            {data.label}
          </a>
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-4xl mx-auto px-6 py-8 flex justify-center">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-7 py-3.5 rounded-full font-semibold text-fluid-sm min-h-[44px] transition-all"
        style={{ backgroundColor: '#25D366', color: 'white' }}
      >
        <MessageCircle className="w-5 h-5" />
        {data.label}
      </a>
    </section>
  )
}
```

- [ ] **Step 6: Create `src/presentation/components/PageBlockRenderer.tsx`**

```tsx
import type { PageBlock } from '@/types/pageBlocks'
import { HeroBlock } from './blocks/HeroBlock'
import { RichTextBlock } from './blocks/RichTextBlock'
import { GalleryBlock } from './blocks/GalleryBlock'
import { ProcessBlock } from './blocks/ProcessBlock'
import { TwoColumnBlock } from './blocks/TwoColumnBlock'
import { FeaturesGridBlock } from './blocks/FeaturesGridBlock'
import { CtaBlock } from './blocks/CtaBlock'
import { ImageCarouselBlock } from './blocks/ImageCarouselBlock'
import { ComparisonCardsBlock } from './blocks/ComparisonCardsBlock'
import { WhatsAppCtaBlock } from './blocks/WhatsAppCtaBlock'

interface PageBlockRendererProps {
  blocks: PageBlock[]
}

export function PageBlockRenderer({ blocks }: PageBlockRendererProps) {
  return (
    <div>
      {blocks.map((block) => {
        switch (block.type) {
          case 'hero':             return <HeroBlock            key={block.id} data={block.data} />
          case 'rich-text':        return <RichTextBlock        key={block.id} data={block.data} />
          case 'gallery':          return <GalleryBlock         key={block.id} data={block.data} />
          case 'process':          return <ProcessBlock         key={block.id} data={block.data} />
          case 'two-column':       return <TwoColumnBlock       key={block.id} data={block.data} />
          case 'features-grid':    return <FeaturesGridBlock    key={block.id} data={block.data} />
          case 'cta':             return <CtaBlock             key={block.id} data={block.data} />
          case 'image-carousel':  return <ImageCarouselBlock   key={block.id} data={block.data} />
          case 'comparison-cards': return <ComparisonCardsBlock key={block.id} data={block.data} />
          case 'whatsapp-cta':    return <WhatsAppCtaBlock     key={block.id} data={block.data} />
          default:                return null
        }
      })}
    </div>
  )
}
```

- [ ] **Step 7: Verify**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/presentation/components/blocks/ src/presentation/components/PageBlockRenderer.tsx
git commit -m "feat: create all 10 public block renderer components and PageBlockRenderer"
```

---

## Task 6: Public Service Detail Page Integration

**Files:**
- Modify: `app/(portfolio)/services/[category]/[item]/page.tsx`

**Interfaces:**
- Consumes: `PageBlockRenderer` from Task 5; `service.pageBlocks` from Task 3
- Produces: conditional rendering — blocks when available, legacy template when not

- [ ] **Step 1: Read the current file**

Read `app/(portfolio)/services/[category]/[item]/page.tsx` in full. Identify the body section that renders `service.fullDescription`, `service.galleryItems`, and the CTA sidebar.

- [ ] **Step 2: Extract the legacy body into a component**

Add a `LegacyServiceBody` component at the bottom of the page file (or as a separate file if it's large). It receives the `service` object and renders the existing body layout. The existing hero (70vh with imageUrl/videoUrl + name + shortDescription) stays as-is in the page, above the body.

Example signature:
```tsx
function LegacyServiceBody({ service }: { service: Service }) {
  // existing max-w-6xl two-column body with fullDescription + ProjectGallery + CTA sidebar
}
```

- [ ] **Step 3: Add conditional rendering**

In the page component body, after the hero, replace the existing body render with:

```tsx
import { PageBlockRenderer } from '@/presentation/components/PageBlockRenderer'

// ... after the hero section:
{service.pageBlocks && service.pageBlocks.length > 0 ? (
  <PageBlockRenderer blocks={service.pageBlocks} />
) : (
  <LegacyServiceBody service={service} />
)}
```

Note: when `pageBlocks` is active, there is NO hardcoded hero above — the page renders ONLY the blocks. The hero for the legacy template stays for the legacy path. The builder's first block should typically be a Hero block.

Update the conditional to:
```tsx
{service.pageBlocks && service.pageBlocks.length > 0 ? (
  <main>
    <PageBlockRenderer blocks={service.pageBlocks} />
  </main>
) : (
  <main>
    {/* existing hero */}
    <LegacyServiceBody service={service} />
  </main>
)}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```
Expected: all 4 `/services/[category]/[item]` static paths compile without errors.

- [ ] **Step 5: Manual check**

Start dev server (`npm run dev`), navigate to any service detail page (e.g., `/services/carpentry/[any-slug]`). Confirm: page still renders with the legacy template (since no service has `pageBlocks` set yet).

- [ ] **Step 6: Commit**

```bash
git add "app/(portfolio)/services/[category]/[item]/page.tsx"
git commit -m "feat: add conditional PageBlockRenderer to service detail page, extract LegacyServiceBody"
```

---

## Task 7: Builder Route — Full-Screen Layout + Server Page

**Files:**
- Create: `app/admin/(protected)/services/[id]/builder/layout.tsx`
- Create: `app/admin/(protected)/services/[id]/builder/page.tsx`

**Interfaces:**
- Consumes: `DrizzleServiceRepository.findById(id)` (exists); `Service` entity with `pageBlocks` (Task 3)
- Produces: full-screen builder shell with service data passed to `ServicePageBuilder` (Task 8)

- [ ] **Step 1: Create `app/admin/(protected)/services/[id]/builder/layout.tsx`**

This layout bypasses the admin sidebar. It wraps children in a full-viewport div:

```tsx
export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#F5EFE8' }}>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Create `app/admin/(protected)/services/[id]/builder/page.tsx`**

```tsx
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/infrastructure/auth/auth.config'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { ServicePageBuilder } from '@/presentation/components/admin/page-builder/ServicePageBuilder'

interface BuilderPageProps {
  params: Promise<{ id: string }>
}

export default async function BuilderPage({ params }: BuilderPageProps) {
  const session = await auth()
  if (!session) redirect('/admin/login')

  const { id } = await params
  const serviceRepo = new DrizzleServiceRepository()
  const categoryRepo = new DrizzleCategoryRepository()

  const [service, categories] = await Promise.all([
    serviceRepo.findById(id),
    categoryRepo.findAll('shared', true),
  ])

  if (!service) notFound()

  return (
    <ServicePageBuilder
      service={{
        id: service.id,
        name: service.name,
        shortDescription: service.shortDescription,
        imageUrl: service.imageUrl,
        published: service.published,
        pageBlocks: service.pageBlocks,
        categoryId: service.categoryId,
        slug: service.slug,
      }}
      categorySlug={
        service.categoryId
          ? (categories.find((c) => c.id === service.categoryId)?.slug ?? 'services')
          : 'services'
      }
    />
  )
}
```

- [ ] **Step 3: Verify types**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(protected)/services/[id]/builder/"
git commit -m "feat: add builder route with full-screen layout and server page"
```

---

## Task 8: ServicePageBuilder — Split-Pane Client Root

**Files:**
- Create: `src/presentation/components/admin/page-builder/ServicePageBuilder.tsx`

**Interfaces:**
- Consumes: `PageBlock` type; `BLOCK_DEFAULTS` from `src/types/pageBlocks.ts`; `BlockList` (Task 9); `BlockPicker` (Task 9); `BlockEditorPanel` (Task 11); `PageBlockRenderer` (Task 5)
- Produces: `ServicePageBuilder` component — the full client-side root

- [ ] **Step 1: Create `src/presentation/components/admin/page-builder/ServicePageBuilder.tsx`**

```tsx
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ChevronLeft, Save } from 'lucide-react'
import type { PageBlock } from '@/types/pageBlocks'
import { BLOCK_DEFAULTS } from '@/types/pageBlocks'
import { BlockList } from './BlockList'
import { BlockPicker } from './BlockPicker'
import { BlockEditorPanel } from './BlockEditorPanel'
import { PageBlockRenderer } from '@/presentation/components/PageBlockRenderer'

interface ServicePageBuilderProps {
  service: {
    id: string
    name: string
    shortDescription: string
    imageUrl: string
    published: boolean
    pageBlocks: PageBlock[] | null
    categoryId: string | null
    slug: string
  }
  categorySlug: string
}

function initBlocks(service: ServicePageBuilderProps['service']): PageBlock[] {
  if (service.pageBlocks && service.pageBlocks.length > 0) return service.pageBlocks
  // Pre-populate Hero block on first open
  return [{
    id: crypto.randomUUID(),
    type: 'hero',
    data: {
      imageUrl: service.imageUrl,
      title: service.name,
      subtitle: service.shortDescription,
      overlayOpacity: 40,
    },
  }]
}

export function ServicePageBuilder({ service, categorySlug }: ServicePageBuilderProps) {
  const router = useRouter()
  const [blocks, setBlocks] = useState<PageBlock[]>(() => initBlocks(service))
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [published, setPublished] = useState(service.published)
  const [saving, setSaving] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const activeBlock = blocks.find((b) => b.id === activeBlockId) ?? null

  const addBlock = useCallback((type: PageBlock['type']) => {
    const newBlock: PageBlock = {
      id: crypto.randomUUID(),
      type,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: BLOCK_DEFAULTS[type] as any,
    }
    setBlocks((prev) => [...prev, newBlock])
    setActiveBlockId(newBlock.id)
    setShowPicker(false)
  }, [])

  const updateBlock = useCallback((id: string, data: PageBlock['data']) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, data } as PageBlock : b))
    )
  }, [])

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    setActiveBlockId((cur) => (cur === id ? null : cur))
  }, [])

  const reorderBlocks = useCallback((reordered: PageBlock[]) => {
    setBlocks(reordered)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageBlocks: blocks, published }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('Page saved')
      router.refresh()
    } catch {
      toast.error('Failed to save page')
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async () => {
    const next = !published
    setPublished(next)
    try {
      await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: next }),
      })
    } catch {
      setPublished(!next) // revert
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #E5DDD0', backgroundColor: 'white', minHeight: '56px' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/admin/services"
            className="flex items-center gap-1 text-fluid-sm transition-opacity hover:opacity-70"
            style={{ color: '#6B6560' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Services
          </Link>
          <span style={{ color: '#C5BDB5' }}>›</span>
          <span className="text-fluid-sm font-medium" style={{ color: '#2D2924' }}>{service.name}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={togglePublished}
            className="px-3 py-1.5 rounded-full text-fluid-xs font-medium transition-all"
            style={published
              ? { backgroundColor: 'rgba(34,197,94,0.12)', color: '#15803d', border: '1px solid rgba(34,197,94,0.3)' }
              : { backgroundColor: 'rgba(107,101,96,0.1)', color: '#6B6560', border: '1px solid #E5DDD0' }}
          >
            {published ? 'Published' : 'Draft'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-fluid-sm font-semibold min-h-[36px] transition-all"
            style={{ backgroundColor: saving ? '#C8A55C' : '#E2C063', color: '#1E1A16', cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      {/* Body: split-pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left pane */}
        <div
          className="flex flex-col flex-shrink-0 overflow-y-auto"
          style={{ width: '420px', borderRight: '1px solid #E5DDD0', backgroundColor: 'white' }}
        >
          {/* Add Block button */}
          <div className="p-4 relative" style={{ borderBottom: '1px solid #F5EFE8' }}>
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="w-full py-2.5 rounded-lg text-fluid-sm font-semibold transition-all"
              style={{ border: '1.5px dashed #E2C063', color: '#A07B2A', backgroundColor: 'rgba(226,192,99,0.06)' }}
            >
              + Add Block
            </button>
            {showPicker && (
              <BlockPicker onSelect={addBlock} onClose={() => setShowPicker(false)} />
            )}
          </div>

          {/* Block list */}
          <BlockList
            blocks={blocks}
            activeBlockId={activeBlockId}
            onSelect={setActiveBlockId}
            onDelete={deleteBlock}
            onReorder={reorderBlocks}
          />

          {/* Editor panel */}
          {activeBlock && (
            <BlockEditorPanel
              block={activeBlock}
              onChange={(data) => updateBlock(activeBlock.id, data)}
            />
          )}
        </div>

        {/* Right pane — preview */}
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F5EFE8' }}>
          {blocks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-fluid-sm" style={{ color: '#9C8F83' }}>
                Add a block to start building your page.
              </p>
            </div>
          ) : (
            <div className="bg-white min-h-full">
              <PageBlockRenderer blocks={blocks} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify types (stubs for not-yet-created components)**

BlockList, BlockPicker, BlockEditorPanel will cause TS errors until created. Create empty stubs for now:

`src/presentation/components/admin/page-builder/BlockList.tsx`:
```tsx
import type { PageBlock } from '@/types/pageBlocks'
export function BlockList(_props: { blocks: PageBlock[]; activeBlockId: string | null; onSelect: (id: string) => void; onDelete: (id: string) => void; onReorder: (blocks: PageBlock[]) => void }) { return null }
```

`src/presentation/components/admin/page-builder/BlockPicker.tsx`:
```tsx
import type { PageBlock } from '@/types/pageBlocks'
export function BlockPicker(_props: { onSelect: (type: PageBlock['type']) => void; onClose: () => void }) { return null }
```

`src/presentation/components/admin/page-builder/BlockEditorPanel.tsx`:
```tsx
import type { PageBlock } from '@/types/pageBlocks'
export function BlockEditorPanel(_props: { block: PageBlock; onChange: (data: PageBlock['data']) => void }) { return null }
```

- [ ] **Step 3: Verify types**

```bash
npx tsc --noEmit
```
Expected: no errors (stubs satisfy interfaces).

- [ ] **Step 4: Commit**

```bash
git add src/presentation/components/admin/page-builder/
git commit -m "feat: add ServicePageBuilder split-pane client root with stub sub-components"
```

---

## Task 9: BlockList + BlockPicker

**Files:**
- Modify (replace stub): `src/presentation/components/admin/page-builder/BlockList.tsx`
- Modify (replace stub): `src/presentation/components/admin/page-builder/BlockPicker.tsx`

**Interfaces:**
- Consumes: `PageBlock`, `BLOCK_LABELS` from `src/types/pageBlocks.ts`; `@dnd-kit/sortable` (installed)
- Produces: fully functional block list with DnD reorder; block type picker dropdown

- [ ] **Step 1: Replace `BlockList.tsx` with full implementation**

```tsx
'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { PageBlock } from '@/types/pageBlocks'
import { BLOCK_LABELS } from '@/types/pageBlocks'

interface BlockListProps {
  blocks: PageBlock[]
  activeBlockId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onReorder: (blocks: PageBlock[]) => void
}

function SortableBlockItem({
  block,
  isActive,
  onSelect,
  onDelete,
}: {
  block: PageBlock
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
      onClick={onSelect}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#FAFAF8' }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = isActive ? 'rgba(226,192,99,0.08)' : 'transparent' }}
      {...attributes}
      style={{
        ...style,
        backgroundColor: isActive ? 'rgba(226,192,99,0.08)' : 'transparent',
        borderLeft: isActive ? '2px solid #E2C063' : '2px solid transparent',
      }}
    >
      <button
        {...listeners}
        className="cursor-grab touch-none flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
        style={{ color: '#C5BDB5' }}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="flex-1 text-fluid-xs font-medium truncate" style={{ color: '#2D2924' }}>
        {BLOCK_LABELS[block.type]}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onSelect() }}
        className="p-1 rounded hover:bg-black/5 flex-shrink-0"
        style={{ color: '#6B6560' }}
        aria-label="Edit"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="p-1 rounded hover:bg-red-50 flex-shrink-0"
        style={{ color: '#6B6560' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#6B6560' }}
        aria-label="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </li>
  )
}

export function BlockList({ blocks, activeBlockId, onSelect, onDelete, onReorder }: BlockListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = blocks.findIndex((b) => b.id === active.id)
    const newIdx = blocks.findIndex((b) => b.id === over.id)
    onReorder(arrayMove(blocks, oldIdx, newIdx))
  }

  if (blocks.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-fluid-xs" style={{ color: '#9C8F83' }}>No blocks yet. Add one above.</p>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <ul style={{ borderBottom: '1px solid #F5EFE8' }}>
          {blocks.map((block) => (
            <SortableBlockItem
              key={block.id}
              block={block}
              isActive={block.id === activeBlockId}
              onSelect={() => onSelect(block.id)}
              onDelete={() => onDelete(block.id)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
```

- [ ] **Step 2: Replace `BlockPicker.tsx` with full implementation**

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { PageBlock } from '@/types/pageBlocks'
import { BLOCK_LABELS } from '@/types/pageBlocks'

const BLOCK_ICONS: Record<PageBlock['type'], string> = {
  'hero':             '🖼',
  'rich-text':        '📝',
  'gallery':          '🗃',
  'process':          '📋',
  'two-column':       '⬛⬜',
  'features-grid':    '⊞',
  'cta':             '🔲',
  'image-carousel':  '🎠',
  'comparison-cards': '⚖',
  'whatsapp-cta':    '💬',
}

const BLOCK_TYPES: PageBlock['type'][] = [
  'hero', 'rich-text', 'gallery', 'process',
  'two-column', 'features-grid', 'cta',
  'image-carousel', 'comparison-cards', 'whatsapp-cta',
]

interface BlockPickerProps {
  onSelect: (type: PageBlock['type']) => void
  onClose: () => void
}

export function BlockPicker({ onSelect, onClose }: BlockPickerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl shadow-2xl overflow-hidden"
      style={{ backgroundColor: 'white', border: '1px solid #E5DDD0' }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #F5EFE8' }}>
        <span className="text-fluid-xs font-semibold" style={{ color: '#2D2924' }}>Choose a block</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-black/5" style={{ color: '#6B6560' }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1 p-2">
        {BLOCK_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all"
            style={{ color: '#2D2924' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(226,192,99,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <span className="text-base flex-shrink-0">{BLOCK_ICONS[type]}</span>
            <span className="text-fluid-xs font-medium truncate">{BLOCK_LABELS[type]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify types**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/presentation/components/admin/page-builder/BlockList.tsx src/presentation/components/admin/page-builder/BlockPicker.tsx
git commit -m "feat: implement BlockList with DnD reorder and BlockPicker type selector"
```

---

## Task 10: Block Editors Part 1 — Hero, RichText, Gallery, Process

**Files:**
- Modify (replace stub): `src/presentation/components/admin/page-builder/BlockEditorPanel.tsx`
- Create: `src/presentation/components/admin/page-builder/editors/HeroEditor.tsx`
- Create: `src/presentation/components/admin/page-builder/editors/RichTextEditor.tsx`
- Create: `src/presentation/components/admin/page-builder/editors/GalleryEditor.tsx`
- Create: `src/presentation/components/admin/page-builder/editors/ProcessEditor.tsx`

**Interfaces:**
- Consumes: `*BlockData` interfaces; `CoverMediaSelector` from admin components; TipTap; `GalleryManagerModal`
- Produces: 4 functional block editors + routing panel

Before starting, locate the exact import paths for `CoverMediaSelector` and `GalleryManagerModal` by running:
```bash
# In the terminal, search for these components:
# Glob: src/presentation/components/admin/Cover*.tsx
# Glob: src/presentation/components/admin/Gallery*.tsx
```

- [ ] **Step 1: Replace `BlockEditorPanel.tsx` stub with router**

```tsx
'use client'

import type { PageBlock } from '@/types/pageBlocks'
import { HeroEditor } from './editors/HeroEditor'
import { RichTextEditor } from './editors/RichTextEditor'
import { GalleryEditor } from './editors/GalleryEditor'
import { ProcessEditor } from './editors/ProcessEditor'
import { TwoColumnEditor } from './editors/TwoColumnEditor'
import { FeaturesGridEditor } from './editors/FeaturesGridEditor'
import { CtaEditor } from './editors/CtaEditor'
import { ImageCarouselEditor } from './editors/ImageCarouselEditor'
import { ComparisonCardsEditor } from './editors/ComparisonCardsEditor'
import { WhatsAppCtaEditor } from './editors/WhatsAppCtaEditor'
import { BLOCK_LABELS } from '@/types/pageBlocks'

interface BlockEditorPanelProps {
  block: PageBlock
  onChange: (data: PageBlock['data']) => void
}

export function BlockEditorPanel({ block, onChange }: BlockEditorPanelProps) {
  return (
    <div style={{ borderTop: '1px solid #E5DDD0' }}>
      <div className="px-4 py-2.5" style={{ backgroundColor: '#F5EFE8', borderBottom: '1px solid #E5DDD0' }}>
        <p className="text-fluid-xs font-semibold" style={{ color: '#2D2924' }}>
          Editing: {BLOCK_LABELS[block.type]}
        </p>
      </div>
      <div className="p-4 space-y-4">
        {block.type === 'hero'             && <HeroEditor            data={block.data} onChange={onChange} />}
        {block.type === 'rich-text'        && <RichTextEditor        data={block.data} onChange={onChange} />}
        {block.type === 'gallery'          && <GalleryEditor         data={block.data} onChange={onChange} />}
        {block.type === 'process'          && <ProcessEditor         data={block.data} onChange={onChange} />}
        {block.type === 'two-column'       && <TwoColumnEditor       data={block.data} onChange={onChange} />}
        {block.type === 'features-grid'    && <FeaturesGridEditor    data={block.data} onChange={onChange} />}
        {block.type === 'cta'             && <CtaEditor             data={block.data} onChange={onChange} />}
        {block.type === 'image-carousel'  && <ImageCarouselEditor   data={block.data} onChange={onChange} />}
        {block.type === 'comparison-cards' && <ComparisonCardsEditor data={block.data} onChange={onChange} />}
        {block.type === 'whatsapp-cta'    && <WhatsAppCtaEditor     data={block.data} onChange={onChange} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `editors/HeroEditor.tsx`**

```tsx
'use client'

import type { HeroBlockData } from '@/types/pageBlocks'
import CoverMediaSelector from '@/presentation/components/admin/CoverMediaSelector'

interface HeroEditorProps {
  data: HeroBlockData
  onChange: (data: HeroBlockData) => void
}

const labelStyle = { color: '#6B6560' } as const
const inputStyle = {
  backgroundColor: '#F0EBE3',
  color: '#2D2924',
  border: '1px solid #E5DDD0',
} as const

export function HeroEditor({ data, onChange }: HeroEditorProps) {
  const set = <K extends keyof HeroBlockData>(key: K, value: HeroBlockData[K]) =>
    onChange({ ...data, [key]: value })

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={labelStyle}>Background Image / Video URL</label>
        <CoverMediaSelector
          value={data.imageUrl}
          onChange={(url) => set('imageUrl', url)}
          folder="services/blocks"
        />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={labelStyle}>Video URL (optional, overrides image)</label>
        <input
          type="url"
          value={data.videoUrl ?? ''}
          onChange={(e) => set('videoUrl', e.target.value || undefined)}
          placeholder="https://…/video.mp4"
          className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none"
          style={inputStyle}
        />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={labelStyle}>Title</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Hero title"
          className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none"
          style={inputStyle}
        />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={labelStyle}>Subtitle (optional)</label>
        <input
          type="text"
          value={data.subtitle ?? ''}
          onChange={(e) => set('subtitle', e.target.value || undefined)}
          placeholder="Subtitle text"
          className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none"
          style={inputStyle}
        />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-2" style={labelStyle}>
          Overlay Opacity: {data.overlayOpacity}%
        </label>
        <input
          type="range"
          min={0}
          max={90}
          step={5}
          value={data.overlayOpacity}
          onChange={(e) => set('overlayOpacity', Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  )
}
```

Note: `CoverMediaSelector` default export path may differ — verify with `Glob: src/presentation/components/admin/Cover*.tsx` before implementing.

- [ ] **Step 3: Create `editors/RichTextEditor.tsx`**

```tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { RichTextBlockData } from '@/types/pageBlocks'

interface RichTextEditorProps {
  data: RichTextBlockData
  onChange: (data: RichTextBlockData) => void
}

export function RichTextEditor({ data, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: data.html,
    onUpdate: ({ editor }) => {
      onChange({ html: editor.getHTML() })
    },
  })

  if (!editor) return null

  const btn = (label: string, action: () => boolean, isActive?: boolean) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); action() }}
      className="px-2 py-1 rounded text-fluid-xs font-medium transition-all"
      style={{
        backgroundColor: isActive ? 'rgba(226,192,99,0.2)' : 'transparent',
        color: isActive ? '#A07B2A' : '#6B6560',
        border: isActive ? '1px solid #E2C063' : '1px solid transparent',
      }}
    >
      {label}
    </button>
  )

  return (
    <div>
      {/* Toolbar */}
      <div
        className="flex flex-wrap gap-1 p-2 mb-2 rounded-t-lg"
        style={{ backgroundColor: '#F0EBE3', border: '1px solid #E5DDD0', borderBottom: 'none' }}
      >
        {btn('H1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
        {btn('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
        {btn('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
        {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
        {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
        {btn('• List', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
        {btn('1. List', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
      </div>
      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none min-h-[120px] px-3 py-2 rounded-b-lg outline-none"
        style={{ backgroundColor: '#F0EBE3', border: '1px solid #E5DDD0', color: '#2D2924', fontSize: '0.875rem' }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Create `editors/GalleryEditor.tsx`**

Find the exact component name for the gallery manager by checking `src/presentation/components/admin/`. It is likely `GalleryManagerModal.tsx`. Use it exactly as in ServiceForm. The editor is a thin wrapper:

```tsx
'use client'

import { useState } from 'react'
import type { GalleryBlockData } from '@/types/pageBlocks'
// Adjust import path to match the actual component location found:
import { GalleryManagerModal } from '@/presentation/components/admin/GalleryManagerModal'
import type { GalleryItem } from '@/types/media'

interface GalleryEditorProps {
  data: GalleryBlockData
  onChange: (data: GalleryBlockData) => void
}

export function GalleryEditor({ data, onChange }: GalleryEditorProps) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <p className="text-fluid-xs mb-3" style={{ color: '#6B6560' }}>
        {data.items.length} image{data.items.length !== 1 ? 's' : ''} in gallery
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg text-fluid-xs font-semibold transition-all"
        style={{ border: '1.5px solid #E2C063', color: '#A07B2A' }}
      >
        Manage Gallery
      </button>
      {open && (
        <GalleryManagerModal
          items={data.items as GalleryItem[]}
          serviceSlug="block"
          onSave={(items) => { onChange({ items }); setOpen(false) }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
```

If `GalleryManagerModal` has a different prop signature, adjust to match what ServiceForm uses.

- [ ] **Step 5: Create `editors/ProcessEditor.tsx`**

```tsx
'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { ProcessBlockData } from '@/types/pageBlocks'

interface ProcessEditorProps {
  data: ProcessBlockData
  onChange: (data: ProcessBlockData) => void
}

const inputStyle = { backgroundColor: '#F0EBE3', color: '#2D2924', border: '1px solid #E5DDD0' }

export function ProcessEditor({ data, onChange }: ProcessEditorProps) {
  const update = (idx: number, key: 'title' | 'description', value: string) => {
    const steps = data.steps.map((s, i) => i === idx ? { ...s, [key]: value } : s)
    onChange({ steps })
  }

  const add = () => onChange({ steps: [...data.steps, { title: '', description: '' }] })
  const remove = (idx: number) => onChange({ steps: data.steps.filter((_, i) => i !== idx) })

  return (
    <div className="space-y-4">
      {data.steps.map((step, idx) => (
        <div key={idx} className="space-y-2 p-3 rounded-lg" style={{ border: '1px solid #E5DDD0' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-fluid-xs font-medium" style={{ color: '#A07B2A' }}>Step {idx + 1}</span>
            {data.steps.length > 1 && (
              <button onClick={() => remove(idx)} className="p-1 rounded hover:bg-red-50" style={{ color: '#9C8F83' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <input
            type="text"
            value={step.title}
            onChange={(e) => update(idx, 'title', e.target.value)}
            placeholder="Step title"
            className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none"
            style={inputStyle}
          />
          <textarea
            value={step.description}
            onChange={(e) => update(idx, 'description', e.target.value)}
            placeholder="Step description (optional)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-fluid-xs resize-none outline-none"
            style={inputStyle}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1 text-fluid-xs font-medium transition-all"
        style={{ color: '#A07B2A' }}
      >
        <Plus className="w-3.5 h-3.5" /> Add step
      </button>
    </div>
  )
}
```

- [ ] **Step 6: Verify types**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/presentation/components/admin/page-builder/
git commit -m "feat: implement BlockEditorPanel router and Hero/RichText/Gallery/Process editors"
```

---

## Task 11: Block Editors Part 2 (TwoColumn, FeaturesGrid, CTA, ImageCarousel, ComparisonCards, WhatsAppCta)

**Files:**
- Create: `editors/TwoColumnEditor.tsx`
- Create: `editors/FeaturesGridEditor.tsx`
- Create: `editors/CtaEditor.tsx`
- Create: `editors/ImageCarouselEditor.tsx`
- Create: `editors/ComparisonCardsEditor.tsx`
- Create: `editors/WhatsAppCtaEditor.tsx`

**Interfaces:**
- Consumes: remaining `*BlockData` interfaces; `CoverMediaSelector`
- Produces: 6 functional editors completing the V1 block set

Common patterns used throughout (do not repeat setup):
```ts
const inputStyle = { backgroundColor: '#F0EBE3', color: '#2D2924', border: '1px solid #E5DDD0' }
const labelStyle = { color: '#6B6560' }
```

- [ ] **Step 1: Create `editors/TwoColumnEditor.tsx`**

```tsx
'use client'

import type { TwoColumnBlockData } from '@/types/pageBlocks'
import CoverMediaSelector from '@/presentation/components/admin/CoverMediaSelector'

interface TwoColumnEditorProps { data: TwoColumnBlockData; onChange: (data: TwoColumnBlockData) => void }

export function TwoColumnEditor({ data, onChange }: TwoColumnEditorProps) {
  const set = <K extends keyof TwoColumnBlockData>(k: K, v: TwoColumnBlockData[K]) => onChange({ ...data, [k]: v })
  const s = { backgroundColor: '#F0EBE3', color: '#2D2924', border: '1px solid #E5DDD0' }
  const l = { color: '#6B6560' }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Image</label>
        <CoverMediaSelector value={data.imageUrl} onChange={(url) => set('imageUrl', url)} folder="services/blocks" />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Image Side</label>
        <div className="flex gap-2">
          {(['left', 'right'] as const).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => set('imageSide', side)}
              className="flex-1 py-2 rounded-lg text-fluid-xs font-medium capitalize"
              style={data.imageSide === side
                ? { backgroundColor: 'rgba(226,192,99,0.15)', color: '#A07B2A', border: '1px solid #E2C063' }
                : { ...s }}
            >
              {side}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Title (optional)</label>
        <input type="text" value={data.title ?? ''} onChange={(e) => set('title', e.target.value || undefined)}
          placeholder="Section title" className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none" style={s} />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Text</label>
        <textarea value={data.text} onChange={(e) => set('text', e.target.value)}
          rows={4} placeholder="Description text" className="w-full px-3 py-2 rounded-lg text-fluid-xs resize-none outline-none" style={s} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `editors/FeaturesGridEditor.tsx`**

```tsx
'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { FeaturesGridBlockData } from '@/types/pageBlocks'

interface FeaturesGridEditorProps { data: FeaturesGridBlockData; onChange: (data: FeaturesGridBlockData) => void }

export function FeaturesGridEditor({ data, onChange }: FeaturesGridEditorProps) {
  const s = { backgroundColor: '#F0EBE3', color: '#2D2924', border: '1px solid #E5DDD0' }
  const l = { color: '#6B6560' }

  const update = (idx: number, key: keyof FeaturesGridBlockData['features'][0], value: string) => {
    onChange({ features: data.features.map((f, i) => i === idx ? { ...f, [key]: value } : f) })
  }
  const add = () => onChange({ features: [...data.features, { iconName: 'check', title: '', description: '' }] })
  const remove = (idx: number) => onChange({ features: data.features.filter((_, i) => i !== idx) })

  return (
    <div className="space-y-3">
      {data.features.map((f, idx) => (
        <div key={idx} className="p-3 rounded-lg space-y-2" style={{ border: '1px solid #E5DDD0' }}>
          <div className="flex items-center justify-between">
            <span className="text-fluid-xs font-medium" style={{ color: '#A07B2A' }}>Feature {idx + 1}</span>
            {data.features.length > 1 && (
              <button onClick={() => remove(idx)} className="p-1 rounded hover:bg-red-50" style={{ color: '#9C8F83' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <input type="text" value={f.iconName} onChange={(e) => update(idx, 'iconName', e.target.value)}
            placeholder="Lucide icon name (e.g. check, home, wrench)" className="w-full px-3 py-1.5 rounded-lg text-fluid-xs outline-none" style={s} />
          <input type="text" value={f.title} onChange={(e) => update(idx, 'title', e.target.value)}
            placeholder="Feature title" className="w-full px-3 py-1.5 rounded-lg text-fluid-xs outline-none" style={s} />
          <textarea value={f.description} onChange={(e) => update(idx, 'description', e.target.value)}
            rows={2} placeholder="Short description" className="w-full px-3 py-1.5 rounded-lg text-fluid-xs resize-none outline-none" style={s} />
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-fluid-xs font-medium" style={{ color: '#A07B2A' }}>
        <Plus className="w-3.5 h-3.5" /> Add feature
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create `editors/CtaEditor.tsx`**

```tsx
'use client'

import type { CtaBlockData } from '@/types/pageBlocks'

interface CtaEditorProps { data: CtaBlockData; onChange: (data: CtaBlockData) => void }

export function CtaEditor({ data, onChange }: CtaEditorProps) {
  const s = { backgroundColor: '#F0EBE3', color: '#2D2924', border: '1px solid #E5DDD0' }
  const l = { color: '#6B6560' }
  const set = <K extends keyof CtaBlockData>(k: K, v: CtaBlockData[K]) => onChange({ ...data, [k]: v })

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Title (optional)</label>
        <input type="text" value={data.title ?? ''} onChange={(e) => set('title', e.target.value || undefined)}
          placeholder="CTA heading" className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none" style={s} />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Subtitle (optional)</label>
        <input type="text" value={data.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value || undefined)}
          placeholder="Supporting text" className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none" style={s} />
      </div>
      <div className="space-y-2 p-3 rounded-lg" style={{ border: '1px solid #E5DDD0' }}>
        <p className="text-fluid-xs font-semibold" style={{ color: '#A07B2A' }}>Primary Button</p>
        <input type="text" value={data.primaryBtn.label} onChange={(e) => set('primaryBtn', { ...data.primaryBtn, label: e.target.value })}
          placeholder="Button label" className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none" style={s} />
        <input type="text" value={data.primaryBtn.href} onChange={(e) => set('primaryBtn', { ...data.primaryBtn, href: e.target.value })}
          placeholder="URL (e.g. /#contact)" className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none" style={s} />
      </div>
      <div className="space-y-2 p-3 rounded-lg" style={{ border: '1px solid #E5DDD0' }}>
        <p className="text-fluid-xs font-semibold" style={{ color: '#6B6560' }}>Secondary Button (optional)</p>
        <input type="text" value={data.secondaryBtn?.label ?? ''} onChange={(e) => set('secondaryBtn', e.target.value ? { label: e.target.value, href: data.secondaryBtn?.href ?? '' } : undefined)}
          placeholder="Button label" className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none" style={s} />
        <input type="text" value={data.secondaryBtn?.href ?? ''} onChange={(e) => set('secondaryBtn', data.secondaryBtn ? { ...data.secondaryBtn, href: e.target.value } : undefined)}
          placeholder="URL" className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none" style={s} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `editors/ImageCarouselEditor.tsx`**

```tsx
'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { ImageCarouselBlockData } from '@/types/pageBlocks'
import CoverMediaSelector from '@/presentation/components/admin/CoverMediaSelector'

interface ImageCarouselEditorProps { data: ImageCarouselBlockData; onChange: (data: ImageCarouselBlockData) => void }

export function ImageCarouselEditor({ data, onChange }: ImageCarouselEditorProps) {
  const s = { backgroundColor: '#F0EBE3', color: '#2D2924', border: '1px solid #E5DDD0' }

  const update = (idx: number, key: 'url' | 'caption', value: string) => {
    onChange({ images: data.images.map((img, i) => i === idx ? { ...img, [key]: value } : img) })
  }
  const add = () => onChange({ images: [...data.images, { url: '', caption: '' }] })
  const remove = (idx: number) => onChange({ images: data.images.filter((_, i) => i !== idx) })

  return (
    <div className="space-y-3">
      {data.images.map((img, idx) => (
        <div key={idx} className="p-3 rounded-lg space-y-2" style={{ border: '1px solid #E5DDD0' }}>
          <div className="flex items-center justify-between">
            <span className="text-fluid-xs font-medium" style={{ color: '#A07B2A' }}>Image {idx + 1}</span>
            <button onClick={() => remove(idx)} className="p-1 rounded hover:bg-red-50" style={{ color: '#9C8F83' }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <CoverMediaSelector value={img.url} onChange={(url) => update(idx, 'url', url)} folder="services/blocks" />
          <input type="text" value={img.caption ?? ''} onChange={(e) => update(idx, 'caption', e.target.value)}
            placeholder="Caption (optional)" className="w-full px-3 py-1.5 rounded-lg text-fluid-xs outline-none" style={s} />
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-fluid-xs font-medium" style={{ color: '#A07B2A' }}>
        <Plus className="w-3.5 h-3.5" /> Add image
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Create `editors/ComparisonCardsEditor.tsx`**

```tsx
'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { ComparisonCardsBlockData } from '@/types/pageBlocks'
import CoverMediaSelector from '@/presentation/components/admin/CoverMediaSelector'

interface ComparisonCardsEditorProps { data: ComparisonCardsBlockData; onChange: (data: ComparisonCardsBlockData) => void }

export function ComparisonCardsEditor({ data, onChange }: ComparisonCardsEditorProps) {
  const s = { backgroundColor: '#F0EBE3', color: '#2D2924', border: '1px solid #E5DDD0' }

  const updateCard = (idx: number, key: keyof ComparisonCardsBlockData['cards'][0], value: unknown) => {
    onChange({ cards: data.cards.map((c, i) => i === idx ? { ...c, [key]: value } : c) })
  }
  const addCard = () => onChange({ cards: [...data.cards, { title: '', points: [''] }] })
  const removeCard = (idx: number) => onChange({ cards: data.cards.filter((_, i) => i !== idx) })
  const updatePoint = (cardIdx: number, ptIdx: number, value: string) => {
    const points = data.cards[cardIdx].points.map((p, i) => i === ptIdx ? value : p)
    updateCard(cardIdx, 'points', points)
  }
  const addPoint = (cardIdx: number) => updateCard(cardIdx, 'points', [...data.cards[cardIdx].points, ''])
  const removePoint = (cardIdx: number, ptIdx: number) =>
    updateCard(cardIdx, 'points', data.cards[cardIdx].points.filter((_, i) => i !== ptIdx))

  return (
    <div className="space-y-4">
      {data.cards.map((card, idx) => (
        <div key={idx} className="p-3 rounded-lg space-y-2" style={{ border: '1px solid #E5DDD0' }}>
          <div className="flex items-center justify-between">
            <span className="text-fluid-xs font-semibold" style={{ color: '#A07B2A' }}>Card {idx + 1}</span>
            {data.cards.length > 1 && (
              <button onClick={() => removeCard(idx)} style={{ color: '#9C8F83' }}><Trash2 className="w-3.5 h-3.5" /></button>
            )}
          </div>
          <input type="text" value={card.title} onChange={(e) => updateCard(idx, 'title', e.target.value)}
            placeholder="Card title" className="w-full px-3 py-1.5 rounded-lg text-fluid-xs outline-none" style={s} />
          <CoverMediaSelector value={card.imageUrl ?? ''} onChange={(url) => updateCard(idx, 'imageUrl', url || undefined)} folder="services/blocks" />
          <div className="space-y-1">
            <p className="text-fluid-xs" style={{ color: '#6B6560' }}>Bullet points:</p>
            {card.points.map((pt, ptIdx) => (
              <div key={ptIdx} className="flex gap-1">
                <input type="text" value={pt} onChange={(e) => updatePoint(idx, ptIdx, e.target.value)}
                  placeholder={`Point ${ptIdx + 1}`} className="flex-1 px-3 py-1.5 rounded-lg text-fluid-xs outline-none" style={s} />
                {card.points.length > 1 && (
                  <button onClick={() => removePoint(idx, ptIdx)} style={{ color: '#9C8F83' }}><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addPoint(idx)} className="text-fluid-xs" style={{ color: '#A07B2A' }}>
              + Add point
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addCard} className="flex items-center gap-1 text-fluid-xs font-medium" style={{ color: '#A07B2A' }}>
        <Plus className="w-3.5 h-3.5" /> Add card
      </button>
    </div>
  )
}
```

- [ ] **Step 6: Create `editors/WhatsAppCtaEditor.tsx`**

```tsx
'use client'

import type { WhatsAppCtaBlockData } from '@/types/pageBlocks'

interface WhatsAppCtaEditorProps { data: WhatsAppCtaBlockData; onChange: (data: WhatsAppCtaBlockData) => void }

export function WhatsAppCtaEditor({ data, onChange }: WhatsAppCtaEditorProps) {
  const s = { backgroundColor: '#F0EBE3', color: '#2D2924', border: '1px solid #E5DDD0' }
  const l = { color: '#6B6560' }
  const set = <K extends keyof WhatsAppCtaBlockData>(k: K, v: WhatsAppCtaBlockData[K]) => onChange({ ...data, [k]: v })

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Phone Number (with country code)</label>
        <input type="tel" value={data.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)}
          placeholder="+61 412 345 678" className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none" style={s} />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Pre-filled Message</label>
        <textarea value={data.message} onChange={(e) => set('message', e.target.value)}
          rows={3} className="w-full px-3 py-2 rounded-lg text-fluid-xs resize-none outline-none" style={s} />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Button Label</label>
        <input type="text" value={data.label} onChange={(e) => set('label', e.target.value)}
          placeholder="Chat on WhatsApp" className="w-full px-3 py-2 rounded-lg text-fluid-xs outline-none" style={s} />
      </div>
      <div>
        <label className="block text-fluid-xs font-medium mb-1" style={l}>Style</label>
        <div className="flex gap-2">
          {(['button', 'banner'] as const).map((style) => (
            <button key={style} type="button" onClick={() => set('style', style)}
              className="flex-1 py-2 rounded-lg text-fluid-xs font-medium capitalize"
              style={data.style === style
                ? { backgroundColor: 'rgba(226,192,99,0.15)', color: '#A07B2A', border: '1px solid #E2C063' }
                : { ...s }}>
              {style}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Verify full type check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/presentation/components/admin/page-builder/editors/
git commit -m "feat: implement all 10 block editors (TwoColumn, FeaturesGrid, CTA, Carousel, Comparison, WhatsApp)"
```

---

## Task 12: Admin Services Builder Button + Full Verification

**Files:**
- Modify: `src/presentation/components/admin/ServiceGroupedView.tsx`

**Interfaces:**
- Consumes: `ServiceGroupedView` existing row structure; `/admin/services/[id]/builder` route from Task 7

- [ ] **Step 1: Add Builder button to `ServiceGroupedView.tsx`**

In `src/presentation/components/admin/ServiceGroupedView.tsx`, find the Actions section in the service row (currently has Edit and Delete buttons). Add a Builder button between Edit and Delete:

```tsx
import { Pencil, Settings2, Trash2 } from 'lucide-react'

// In the actions div, add between Edit and Delete:
<Button
  asChild
  size="sm"
  variant="outline"
  className="min-h-[36px] min-w-[36px] p-0 transition-all duration-150"
  style={{ borderColor: '#E5DDD0', color: '#6B6560' }}
>
  <Link href={`/admin/services/${svc.id}/builder`}>
    <Settings2 className="w-3.5 h-3.5" />
  </Link>
</Button>
```

- [ ] **Step 2: Full type check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Full build**

```bash
npm run build
```
Expected: all routes compile, 4 static `/services/[category]/[item]` paths render, no errors.

- [ ] **Step 4: Manual verification checklist**

Start dev server: `npm run dev`

Check each item:
- [ ] Navigate to `/services/carpentry` → all service cards show "View Detail →" button (published fix)
- [ ] Click "View Detail →" → navigates to `/services/carpentry/[slug]` → legacy template renders correctly
- [ ] Navigate to `/admin/services` → each service row has 3 icon buttons: Edit (pencil), Builder (settings gear), Delete (trash)
- [ ] Click Builder icon on any service → navigates to `/admin/services/[id]/builder` → full-screen layout (no admin sidebar)
- [ ] Builder header shows: service name, Draft/Published toggle, Save button
- [ ] Left pane shows 1 pre-populated Hero block (from service's cover image + name)
- [ ] Right pane shows hero preview
- [ ] Click `+ Add Block` → BlockPicker dropdown opens with 10 block types
- [ ] Click "Rich Text" → block added to list, editor switches to TipTap
- [ ] Type in TipTap → right pane preview updates in real time
- [ ] Click "Process / Steps" → process block added, 1 step input shows
- [ ] Add a second step → preview updates
- [ ] Drag hero block below rich text → preview reorders
- [ ] Click Save → toast "Page saved" appears
- [ ] Navigate to the service's public URL → blocks render (no legacy template)
- [ ] Navigate to a service that has NOT been through the builder → legacy template renders correctly

- [ ] **Step 5: Final commit**

```bash
git add src/presentation/components/admin/ServiceGroupedView.tsx
git commit -m "feat: add Builder button to ServiceGroupedView rows"
```

Then tag the feature complete:
```bash
git commit --allow-empty -m "feat: complete service visual page builder V1"
```
