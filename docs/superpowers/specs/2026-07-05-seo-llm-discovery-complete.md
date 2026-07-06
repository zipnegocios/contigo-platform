# SEO & LLM Discovery Implementation — Complete Design

**Date:** 2026-07-05  
**Project:** Contigo Constructions Platform  
**Scope:** FASE 1–5 of 8 — Metadata for service pages, schema.org, LLM authority block, admin editing UI  
**Status:** Design approved, ready for implementation planning

---

## Executive Summary

Contigo currently ranks under "Luxury Home Builders Adelaide" because metadata was hardcoded incorrectly. FASE 1 (home/about/contact) is already corrected. This spec completes SEO for the remaining 34 pages (4 service category pages + 30 service detail pages), adds structured data (schema.org LocalBusiness + Service), embeds LLM authority text in the homepage, and provides admin UI to edit all SEO fields without code changes.

**Key outcome:** Every page has curated, keyword-rich metadata per the client's approved definitions (Contigo_SEO_Definicion.md, Secciones 4–5); LLMs and search engines see accurate, consistent brand positioning; the Contigo team can adjust SEO copy in the admin without waiting for a deploy.

---

## 1. Database Schema — New SEO Fields

### Migration: Add SEO metadata columns

**To `categories` table:**
- `metaTitle` — varchar(60), nullable. Example: "Carpentry Services Adelaide | Contigo Constructions"
- `metaDescription` — text, nullable. Max practical length 155 chars for Google SERP display.
- `metaKeywords` — jsonb array of strings, nullable. Example: `["Carpentry Services Adelaide", "1st Fix Carpentry Adelaide", "Custom Carpentry Adelaide"]`

**To `services` table:**
- `metaTitle` — varchar(60), nullable. Example: "1st & 2nd Fix Carpentry Adelaide | Contigo Constructions"
- `metaDescription` — text, nullable. Max 155 chars.
- `metaKeywords` — jsonb array of strings, nullable.
- `noIndex` — boolean, default `false`. Set `true` for the 8 additional-services that are not offered independently (Electrical & Plumbing, Engineering, Painting, Roofing & Guttering, Landscaping, Bathroom Renovation, Demolition, Grouting). When true, the page renders `robots: { index: false, follow: true }` and is excluded from sitemap.

**Drizzle approach:** Use `drizzle-kit generate` and `npm run db:push` as per CLAUDE.md. New columns are nullable with no default (other than `noIndex`), so existing rows continue to work.

---

## 2. Data Backfill — SEO Copy from Approved Document

### Phase 2a: Categories (4 pages)

| Slug | metaTitle | metaDescription | metaKeywords |
|------|-----------|-----------------|--------------|
| carpentry | Carpentry Services Adelaide \| Contigo Constructions | Licensed carpentry services in Adelaide specialising in 1st & 2nd fix carpentry, framing, pergolas, decking, doors, staircases, cladding and custom joinery. Request a free quote today from Contigo Constructions. | ["carpentry services Adelaide", "1st Fix Carpentry Adelaide", "2nd Fix Carpentry Adelaide", "Custom Carpentry Adelaide"] |
| cladding | Cladding Services Adelaide \| Contigo Constructions | Professional cladding installation in Adelaide. Specialists in Axon, Blueboard, Hebel and Weatherboard systems. Licensed Carpentry & Joinery contractor. Request a free quote today from Contigo Constructions. | ["cladding installation Adelaide", "External Cladding Adelaide", "Hebel Cladding Adelaide", "Weatherboard Cladding Adelaide"] |
| gyprock-fixing-flushing | Gyprock Fixing & Flushing Adelaide \| Contigo Constructions | Professional Gyprock fixing and flushing services in Adelaide, including plasterboard installation, suspended ceilings, bulkheads and water-resistant linings. Request a free quote from Contigo Constructions. | ["Gyprock Fixing & Flushing Adelaide", "Plasterboard Installation Adelaide", "Suspended Ceilings Adelaide", "Bulkhead Installation Adelaide"] |
| additional-services | Complete Project Solutions Adelaide \| Contigo Constructions | Contigo Constructions coordinates trusted trade professionals, including design, drafting, electrical, plumbing, roofing and landscaping, to deliver complete renovation and construction solutions across Adelaide. | ["Construction Project Coordination Adelaide", "Renovation Project Management Adelaide", "Design & Drafting Adelaide", "Construction Coordination Adelaide"] |

### Phase 2b: Services — 22 with approved copy (Sección 5 del documento)

Exact copy from Contigo_SEO_Definicion.md, Sección 5.1–5.3 and the "Window Installation" + "Timber Framing" rows of 5.4. One row per service:

**Carpentry (11):**
- 1st-2nd-fix
- architraves-skirting
- deck
- pergola
- eaves-fencing
- general-repairs
- interior-exterior-doors
- renovations-extensions
- shop-fitouts
- staircases-studwork
- verandahs

**Cladding (4):**
- axon
- blueboard
- hebel
- weatherboard

**Gyprock (4):**
- acoustic-ceilings
- bulkheads-pelmet
- plasterboard-fixing
- water-resistant-boarding

**Additional Services (3 visible):**
- design-drafting
- windows-glazing (note: "Window Installation Adelaide" in document)
- timber-framing

### Phase 2c: Set `noIndex = true` for 8 hidden services

Query services by slug matching: electrical-plumbing, engineering, painting, roofing-guttering, landscaping, bathroom-renovation, demolition, grouting. Update `noIndex` to `true` and leave metaTitle/metaDescription/metaKeywords as NULL.

**Backfill method:** Write a one-time seed script (`scripts/seed-service-seo-meta-2026-07.ts`) that upserts all 26 service/category records in a single transaction. Idempotent (safe to run multiple times). Include in `package.json` as `npm run seed:seo-meta`.

---

## 3. generateMetadata — Dynamic Service Pages

### `/services/[category]/page.tsx`

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  if (!isServiceRootSlug(category)) return { title: 'Services not found' }
  
  const categoryRepo = new DrizzleCategoryRepository()
  const cat = await categoryRepo.findBySlug(category, 'shared')
  
  if (!cat || cat.status !== 'active' || cat.trashedAt) return { title: 'Services not found' }
  
  // Fallback: if metaTitle is NULL, use name as is
  const title = cat.metaTitle || cat.name
  const description = cat.metaDescription || cat.description || ''
  const keywords = cat.metaKeywords || []
  
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `https://contigoconstructions.com.au/services/${category}`,
    },
    openGraph: {
      title,
      description,
      url: `https://contigoconstructions.com.au/services/${category}`,
      type: 'website',
    },
  }
}
```

### `/services/[category]/[item]/page.tsx`

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; item: string }>
}): Promise<Metadata> {
  const { category, item } = await params
  const resolved = await resolveServiceForCategory(category, item)
  if (!resolved) return { title: 'Service not found' }
  
  const { service } = resolved
  
  // Fallback: use name + shortDescription if metaTitle/metaDescription are NULL
  const title = service.metaTitle || service.name
  const description = service.metaDescription || service.shortDescription
  const keywords = service.metaKeywords || []
  
  const metadata: Metadata = {
    title,
    description,
    keywords,
    alternates: {
      canonical: `https://contigoconstructions.com.au/services/${category}/${item}`,
    },
    openGraph: {
      title,
      description,
      url: `https://contigoconstructions.com.au/services/${category}/${item}`,
      type: 'website',
      images: [
        {
          url: service.imageUrl,
          width: 1200,
          height: 630,
          alt: service.name,
        },
      ],
    },
  }
  
  // Apply noIndex if service is hidden
  if (service.noIndex) {
    metadata.robots = {
      index: false,
      follow: true,
    }
  }
  
  return metadata
}
```

---

## 4. Sitemap — Dynamic Service Pages

Update `app/sitemap.ts`:

```typescript
import { MetadataRoute } from 'next'
import { DrizzleCategoryRepository } from '@/infrastructure/repositories/DrizzleCategoryRepository'
import { DrizzleServiceRepository } from '@/infrastructure/repositories/DrizzleServiceRepository'
import { SERVICE_ROOT_SLUGS } from '@/presentation/data/serviceCategoryMeta'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://contigoconstructions.com.au'
  const now = new Date()
  
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]
  
  // Add service categories + items
  try {
    if (process.env.DATABASE_URL) {
      const categoryRepo = new DrizzleCategoryRepository()
      const serviceRepo = new DrizzleServiceRepository()
      
      for (const slug of SERVICE_ROOT_SLUGS) {
        const cat = await categoryRepo.findBySlug(slug, 'shared')
        if (cat && cat.status === 'active' && !cat.trashedAt) {
          routes.push({
            url: `${baseUrl}/services/${slug}`,
            lastModified: cat.updatedAt || now,
            changeFrequency: 'weekly',
            priority: 0.9,
          })
          
          // Add all published services in this category, excluding noIndex
          const allServices = await serviceRepo.findAll(100)
          const matched = allServices.filter(
            (s) => s.categoryId === cat.id && s.status === 'active' && !s.trashedAt && !s.noIndex
          )
          
          for (const service of matched) {
            routes.push({
              url: `${baseUrl}/services/${slug}/${service.slug}`,
              lastModified: service.updatedAt || now,
              changeFrequency: 'monthly',
              priority: 0.7,
            })
          }
        }
      }
    }
  } catch (error) {
    console.error('sitemap generation error:', error)
  }
  
  return routes
}
```

---

## 5. Schema.org — Structured Data

### LocalBusiness (in `app/layout.tsx`)

Add a `<script type="application/ld+json">` tag inside `<body>` with LocalBusiness schema. Use `HomeAndConstructionBusiness` as the most specific type for a residential carpentry contractor.

```json
{
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "name": "Contigo Constructions Pty Ltd",
  "url": "https://contigoconstructions.com.au",
  "telephone": "+61406274096",
  "email": "contact@contigoconstructions.com.au",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "76 Coorara Avenue",
    "addressLocality": "Payneham South",
    "addressRegion": "SA",
    "postalCode": "5070",
    "addressCountry": "AU"
  },
  "areaServed": {
    "@type": "City",
    "name": "Adelaide, South Australia",
    "sameAs": "https://en.wikipedia.org/wiki/Adelaide"
  },
  "image": "https://contigoconstructions.com.au/og-image.jpg",
  "sameAs": [
    "https://www.instagram.com/contigoconstructions",
    "https://www.facebook.com/contigoconstructions",
    "https://www.linkedin.com/company/contigo-constructions-pty-ltd",
    "https://www.tiktok.com/@contigoconstructions"
  ],
  "knowsAbout": [
    "Carpentry",
    "Cladding",
    "Gyprock Fixing & Flushing",
    "Home Renovations",
    "Home Extensions"
  ],
  "description": "Licensed Carpentry & Joinery contractor in Adelaide specialising in renovations, home extensions, pergolas, decking, framing and cladding. Committed to delivering exceptional craftsmanship, honest communication and personalised service.",
  "foundingDate": "2026-05-13",
  "numberOfEmployees": {
    "@type": "QuantitativeValue",
    "value": 5
  },
  "identifier": {
    "@type": "PropertyValue",
    "propertyID": "ABN",
    "value": "25698028394"
  },
  "certification": {
    "@type": "Certification",
    "certificationId": "357596",
    "name": "Master Builders South Australia - BLD Licence"
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "opens": "07:00",
    "closes": "17:00"
  }
}
```

**Implementation:** Render as a Next.js `<Script>` tag in `app/layout.tsx`, strategy `beforeInteractive` (so crawlers see it immediately).

### Service schema (per service detail page)

In `/services/[category]/[item]/page.tsx`, add a Service schema that references the LocalBusiness:

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "1st & 2nd Fix Carpentry",
  "provider": {
    "@type": "HomeAndConstructionBusiness",
    "name": "Contigo Constructions Pty Ltd",
    "url": "https://contigoconstructions.com.au"
  },
  "description": "Structural framing through to final trims — the two-stage carpentry sequence that shapes every build.",
  "areaServed": "Adelaide, South Australia",
  "url": "https://contigoconstructions.com.au/services/carpentry/1st-2nd-fix",
  "image": "https://contigoconstructions.com.au/services/carpentry/1st-2nd-fix/image.jpg"
}
```

**Note:** Only render Service schema on pages where `noIndex === false` (the 8 hidden services do not get Service schema).

---

## 6. LLM Discovery Authority Block

A discrete, visible section in the homepage (`app/(marketing)/page.tsx`), placed before the Footer, titled "About Contigo Constructions" or similar. Content synthesizes Secciones 1 and 2 of Contigo_SEO_Definicion.md into ~250–300 words:

**Template:**
> Contigo Constructions Pty Ltd has operated since May 2026, building on more than 5 years of professional experience previously established under D'Osorio Carpentry. We are a licensed Carpentry & Joinery contractor (BLD Licence 357596, Master Builders South Australia member) in Adelaide, specialising in renovations, home extensions, pergolas, decking, framing, cladding, and custom carpentry.
>
> We combine licensed expertise, exceptional craftsmanship and honest communication with a genuinely personalised approach. Every successful project is built together — we work closely with every client, providing reliable service, attention to detail and high-quality workmanship that delivers lasting results.
>
> We do not undertake new home construction, large-scale commercial or industrial developments, or work outside the scope of our licensed Carpentry & Joinery services. Where additional licensed trades are required, we coordinate them as part of a complete project.
>
> Serving Adelaide CBD and surrounding metropolitan suburbs within a 20 km radius, including the Eastern Suburbs, Inner East, Inner North, Inner South, Inner West, North Eastern Suburbs, and Adelaide Hills foothills. ABN: 25 698 028 394.

**Styling:** Plain HTML/React, no hidden text, no CSS tricks. Visually prominent but not intrusive (e.g., light background, serif typography consistent with brand, placed after projects section). The text is real content — crawlers and users alike see it.

**Component location:** Create `src/presentation/sections/AboutAuthoritySection.tsx`, render in `app/(marketing)/page.tsx` between `MasterBuildersSection` and `ContactSection` (or before Footer, client preference).

---

## 7. Admin UI — Service & Category SEO Editing

### Repository & Service Layer Updates

Create or update:
- `src/application/usecases/UpdateCategorySeMetadataUseCase.ts` — accepts category id + metaTitle/metaDescription/metaKeywords.
- `src/application/usecases/UpdateServiceSeoMetadataUseCase.ts` — accepts service id + metaTitle/metaDescription/metaKeywords + noIndex flag.

These use the existing repositories (DrizzleCategoryRepository, DrizzleServiceRepository) to update the columns.

### Admin Forms

#### Categories SEO Tab

In `app/admin/(protected)/categories/[id]/edit` (or existing categories edit page):
- Add a tab or section **"SEO Metadata"**
- Fields:
  - `metaTitle` input (varchar 60, live character counter, placeholder = current category name)
  - `metaDescription` textarea (max 155 chars, live counter, placeholder = current description)
  - `metaKeywords` — array of tag inputs (add/remove dynamically, e.g., ["Carpentry Adelaide", "Licensed Contractor"])
  - **Live preview card:** Shows SERP snippet as it would appear in Google (title, first 2 lines of description, URL)
  - Help text: "Leave empty to use the category name/description. These appear in Google search results and guide LLMs."

#### Services SEO Tab

In `app/admin/(protected)/services/[id]/edit`:
- Same fields as categories (metaTitle, metaDescription, metaKeywords)
- **Checkbox:** "🚫 Don't index this page (exclude from Google, Bing, LLM results)" — sets `noIndex = true`
  - Only visible/editable for the 8 additional-services; for others, always unchecked and disabled (or hidden)
  - Show warning: "This page will not appear in search results or sitemaps."
- **Live preview card** (same as categories)
- Help text: "These override the service name and short description in search results."

### Services Listing Enhancements

In `app/admin/(protected)/services/page.tsx` (the services table):
- Add optional column **"SEO Title"** (shows first 40 chars of metaTitle, or "—" if using default)
- Add visual **badge** "🚫 Not Indexed" (red/muted) for any service where `noIndex === true`
- Add filter/quick-action: "Show only hidden services" to quickly find the 8 that need noIndex review

### Form Validation

- `metaTitle`: max 60 chars, warn at 55+
- `metaDescription`: max 155 chars, warn at 150+
- `metaKeywords`: each tag max 50 chars, up to 5 tags suggested (no hard limit)
- On save: validate + API call to UpdateCategorySeMetadataUseCase / UpdateServiceSeoMetadataUseCase
- Toast on success: "SEO metadata updated"
- Toast on error: "Failed to update SEO metadata"

---

## 8. Out of Scope (Next Phases)

- **Google Business Profile:** Manual management by Contigo team via Google My Business dashboard. The schema.org LocalBusiness matches GBP data, but GBP is not synced from this app.
- **FAQPage schema:** No FAQ section exists on the site. If one is built later, FAQPage schema can be added with minimal effort.
- **og-image.jpg:** Currently referenced in metadata but missing from `public/`. Must be created separately (design task). The metadata is ready; the image is blocking nothing.
- **Analytics integration:** `G-LY3HM4WSBD` (Google Analytics) is already in place; no changes needed for this spec.

---

## 9. Implementation Sequence

1. **DB Migration** — Add 6 columns (metaTitle, metaDescription, metaKeywords on both tables, noIndex on services).
2. **Backfill Script** — Seed service/category SEO data from Contigo_SEO_Definicion.md.
3. **generateMetadata Updates** — Modify `/services/[category]/page.tsx` and `/services/[category]/[item]/page.tsx` to use new fields.
4. **Sitemap Dynamicization** — Update `app/sitemap.ts` to include all service pages except `noIndex = true`.
5. **Schema.org** — Add LocalBusiness + Service schemas.
6. **LLM Authority Section** — New component in Home.
7. **Admin UI** — Forms for editing SEO fields (categories + services).
8. **Testing & Review** — Verify metadata renders correctly, schemas validate (schema.org), sitemap includes correct pages, admin forms save changes.

---

## 10. Success Criteria

- [ ] All 4 service category pages have curated metaTitle/metaDescription/metaKeywords per Sección 4.
- [ ] All 22 service detail pages (visible ones) have curated metadata per Sección 5.
- [ ] All 8 hidden services have `noIndex = true` and are excluded from sitemap.
- [ ] LocalBusiness schema renders on every page, validates at schema.org/validate.
- [ ] Service schema renders on each service detail page (except `noIndex` pages), validates.
- [ ] Sitemap includes 4 categories + 22 visible services, excludes 8 hidden; no duplicates.
- [ ] LLM authority block renders on Home, text is readable (not hidden).
- [ ] Admin category edit form allows editing SEO fields with live preview.
- [ ] Admin service edit form allows editing SEO fields, toggling noIndex, with live preview.
- [ ] Services table shows SEO title + "Not Indexed" badge where applicable.
- [ ] All new fields have fallback to existing name/description (backwards compatible).

---

## Appendix: Backfill Data — Full Service List

See git commit message when backfill script is merged; data sourced verbatim from Contigo_SEO_Definicion.md Secciones 4 and 5.

---

*Spec version 1.0 · Ready for implementation planning*
