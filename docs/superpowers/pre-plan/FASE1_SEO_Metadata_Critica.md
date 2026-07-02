# Work Order — FASE 1: Metadata SEO Crítica
**Proyecto:** Contigo Constructions Platform  
**Repo:** `github.com/zipnegocios/contigo-platform`  
**Branch:** `main`  
**Ejecutar en:** Claude Code  
**Fuente de verdad:** `Contigo_SEO_Definicion.docx` (completado por Anamaria Osorio, Julio 2026)

---

## Contexto

Google muestra actualmente a Contigo Constructions como **"Luxury Home Builders Adelaide"** — una descripción incorrecta que proviene del metadata hardcodeado en `app/layout.tsx`. Esta fase lo corrige en su totalidad e implementa el SEO aprobado por la cliente para las páginas principales: Home, About y Contact.

**Problema activo en producción:**
```
// app/layout.tsx — INCORRECTO (estado actual)
title: 'Contigo Constructions | Luxury Home Builders Adelaide'
description: 'Premium construction, extensions, and renovations in Adelaide. Award-winning builders specializing in luxury homes.'
```

---

## Reglas de ejecución

1. **Audit first** — leer cada archivo antes de modificarlo.
2. **No hacer commits ni pushes.** Solo modificar archivos.
3. **No inventar rutas** — si un archivo no existe, reportarlo antes de crearlo.
4. **Respetar la arquitectura** — el proyecto usa Next.js 15 App Router con route groups `(marketing)` y `(portfolio)`.
5. **Entregar change report** al final listando cada archivo modificado y qué cambió.

---

## Archivos a modificar

| Archivo | Acción |
|---|---|
| `app/layout.tsx` | Reemplazar metadata global, agregar Open Graph completo, Twitter Cards, robots, alternates |
| `app/(marketing)/page.tsx` | Agregar `export const metadata` con datos de Home |
| `app/(marketing)/about/page.tsx` | Agregar `export const metadata` con datos de About — **verificar ruta exacta** |
| `app/(marketing)/contact/page.tsx` | Agregar `export const metadata` con datos de Contact — **verificar ruta exacta** |

> Si `about/page.tsx` o `contact/page.tsx` no existen bajo `(marketing)/`, buscar en rutas alternativas (`app/about/`, `app/contact/`) y reportar la ruta real encontrada.

---

## TAREA 1 — Auditoría inicial

Antes de modificar cualquier archivo, leer y reportar el contenido actual de:

```
app/layout.tsx
app/(marketing)/page.tsx
app/(marketing)/about/page.tsx   (o variante)
app/(marketing)/contact/page.tsx (o variante)
```

Verificar si ya existe algún `export const metadata` en las páginas individuales.

---

## TAREA 2 — `app/layout.tsx` · Metadata global

Reemplazar el bloque `export const metadata: Metadata = { ... }` por el siguiente. **No tocar nada fuera del bloque metadata** (fonts, providers, html, body).

```typescript
export const metadata: Metadata = {
  // ── Títulos ──────────────────────────────────────────────────────────────
  title: {
    default: 'Contigo Constructions | Carpentry & Renovations Adelaide',
    template: '%s | Contigo Constructions',
  },

  // ── Descripción ──────────────────────────────────────────────────────────
  description:
    'Licensed Carpentry & Joinery contractor in Adelaide specialising in renovations, home extensions, pergolas, decking, framing and cladding. Request a free quote today.',

  // ── Keywords ─────────────────────────────────────────────────────────────
  keywords: [
    'carpentry Adelaide',
    'carpentry services Adelaide',
    'home renovations Adelaide',
    'home extensions Adelaide',
    'cladding Adelaide',
    'gyprock Adelaide',
    'licensed builder Adelaide',
    'licensed carpentry contractor Adelaide',
    'BLD licence 357596',
    'Contigo Constructions',
  ],

  // ── Open Graph ───────────────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://contigoconstructions.com.au',
    siteName: 'Contigo Constructions',
    title: 'Contigo Constructions | Carpentry & Renovations Adelaide',
    description:
      'Licensed Carpentry & Joinery contractor in Adelaide. BLD Licence 357596. Master Builders member. Specialising in renovations, extensions, carpentry, cladding and gyprock.',
    images: [
      {
        url: 'https://contigoconstructions.com.au/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Contigo Constructions — Carpentry & Renovations Adelaide',
      },
    ],
  },

  // ── Twitter / X Card ─────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: 'Contigo Constructions | Carpentry & Renovations Adelaide',
    description:
      'Licensed Carpentry & Joinery contractor in Adelaide. BLD Licence 357596. Master Builders member.',
    images: ['https://contigoconstructions.com.au/og-image.jpg'],
  },

  // ── Robots ───────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── Canonical ────────────────────────────────────────────────────────────
  alternates: {
    canonical: 'https://contigoconstructions.com.au',
  },

  // ── Verificación ─────────────────────────────────────────────────────────
  // Agregar si se tiene el código de Google Search Console
  // verification: {
  //   google: 'GOOGLE_VERIFICATION_CODE',
  // },

  // ── Metadatos de aplicación ──────────────────────────────────────────────
  applicationName: 'Contigo Constructions',
  authors: [{ name: 'Contigo Constructions', url: 'https://contigoconstructions.com.au' }],
  creator: 'Contigo Constructions Pty Ltd',
  publisher: 'Contigo Constructions Pty Ltd',
}
```

**Asegurarse** de que el import de `Metadata` esté presente al tope del archivo:
```typescript
import type { Metadata } from 'next'
```

---

## TAREA 3 — `app/(marketing)/page.tsx` · Home

Agregar el siguiente bloque **antes** del componente default export. Si ya existe un `export const metadata`, reemplazarlo por completo.

```typescript
export const metadata: Metadata = {
  title: 'Contigo Constructions | Carpentry & Renovations Adelaide',
  description:
    'Licensed Carpentry & Joinery contractor in Adelaide specialising in renovations, home extensions, pergolas, decking, framing and cladding. Request a free quote today.',
  keywords: [
    'Carpentry & Renovations Adelaide',
    'Home Renovations Adelaide',
    'Home Extensions Adelaide',
    'Carpentry Services Adelaide',
  ],
  alternates: {
    canonical: 'https://contigoconstructions.com.au',
  },
  openGraph: {
    title: 'Contigo Constructions | Carpentry & Renovations Adelaide',
    description:
      'Licensed Carpentry & Joinery contractor in Adelaide specialising in renovations, home extensions, pergolas, decking, framing and cladding. Request a free quote today.',
    url: 'https://contigoconstructions.com.au',
  },
}
```

> **H1 de la página** (no es metadata — es contenido visible). Verificar si el componente Hero de la home tiene un `<h1>`. Si lo tiene y su texto actual no es correcto, cambiarlo a:
> ```
> Quality Carpentry, Renovations & Home Extensions in Adelaide
> ```
> Si no hay `<h1>` visible en la home, reportarlo sin modificar la estructura — se abordará en un work order de contenido separado.

---

## TAREA 4 — About · Metadata

Localizar la página About. Buscar en este orden hasta encontrarla:
1. `app/(marketing)/about/page.tsx`
2. `app/about/page.tsx`
3. Cualquier otra ruta que renderice `/about`

Agregar (o reemplazar) el bloque `export const metadata`:

```typescript
export const metadata: Metadata = {
  title: 'About Contigo Constructions | Licensed Carpentry & Joinery Adelaide',
  description:
    'Learn more about Contigo Constructions, a licensed Carpentry & Joinery contractor in Adelaide specialising in renovations, home extensions, framing, pergolas, decking and cladding.',
  keywords: [
    'Carpentry & Joinery Adelaide',
    'Licensed Carpentry Contractor Adelaide',
    'Home Renovations Adelaide',
    'Master Builders South Australia',
  ],
  alternates: {
    canonical: 'https://contigoconstructions.com.au/about',
  },
  openGraph: {
    title: 'About Contigo Constructions | Licensed Carpentry & Joinery Adelaide',
    description:
      'Learn more about Contigo Constructions, a licensed Carpentry & Joinery contractor in Adelaide specialising in renovations, home extensions, framing, pergolas, decking and cladding.',
    url: 'https://contigoconstructions.com.au/about',
  },
}
```

> **H1 de About:** Si existe un `<h1>` o título principal visible en la página, verificar si puede actualizarse a:
> ```
> Built on Craftsmanship. Driven by Trust.
> ```
> Si el H1 está dentro de un componente importado o una sección reutilizable, solo reportarlo — no modificar.

---

## TAREA 5 — Contact · Metadata

Localizar la página Contact. Buscar en este orden:
1. `app/(marketing)/contact/page.tsx`
2. `app/contact/page.tsx`
3. Cualquier otra ruta que renderice `/contact`

Agregar (o reemplazar) el bloque `export const metadata`:

```typescript
export const metadata: Metadata = {
  title: 'Contact Contigo Constructions | Carpentry & Renovations Adelaide',
  description:
    'Get in touch with Contigo Constructions. Call +61 406 274 096 or email contact@contigoconstructions.com.au. Mon–Fri 7:00 AM – 5:00 PM.',
  keywords: [
    'Carpentry Adelaide Contact',
    'Free Carpentry Quote Adelaide',
    'Home Extensions Adelaide',
    'Renovation Contractors Adelaide',
    'Construction Company Adelaide',
  ],
  alternates: {
    canonical: 'https://contigoconstructions.com.au/contact',
  },
  openGraph: {
    title: 'Contact Contigo Constructions | Carpentry & Renovations Adelaide',
    description:
      'Get in touch with Contigo Constructions. Call +61 406 274 096 or email contact@contigoconstructions.com.au. Mon–Fri 7:00 AM – 5:00 PM.',
    url: 'https://contigoconstructions.com.au/contact',
  },
}
```

> **H1 de Contact:** Verificar si existe un `<h1>` o headline principal. El texto aprobado es:
> ```
> Let's Build Together
> ```
> Reportar si el actual coincide o difiere — no modificar si es parte de un componente complejo.

---

## TAREA 6 — Verificación de import `Metadata`

En **cada** archivo modificado en las Tareas 3–5, verificar que exista el import de `Metadata` al inicio del archivo:

```typescript
import type { Metadata } from 'next'
```

Si la página usa `'use client'` al tope, **no agregar metadata directamente**. En ese caso:
- Crear un archivo `layout.tsx` en la misma carpeta con el bloque `export const metadata`.
- Reportar el caso antes de proceder.

---

## TAREA 7 — Verificación del `lang` en `<html>`

En `app/layout.tsx`, confirmar que el tag `<html>` tenga `lang="en-AU"` (no `lang="en"`). Si tiene `lang="en"`, actualizar a `lang="en-AU"` para señalizar correctamente el contenido australiano a Google.

```tsx
// Antes
<html lang="en" ...>

// Después
<html lang="en-AU" ...>
```

---

## TAREA 8 — Verificación de `robots.txt` y `sitemap.xml`

### 8.1 `robots.txt`
Verificar si existe `app/robots.ts` o `public/robots.txt`. 

Si **no existe**, crear `app/robots.ts`:

```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: 'https://contigoconstructions.com.au/sitemap.xml',
  }
}
```

Si ya existe, verificar que `/admin/` y `/api/` estén en `disallow`.

### 8.2 `sitemap.xml`
Verificar si existe `app/sitemap.ts` o `public/sitemap.xml`.

Si **no existe**, crear `app/sitemap.ts` con las páginas de esta fase (las páginas de servicios se agregarán en Fases 2 y 4):

```typescript
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://contigoconstructions.com.au'
  const now = new Date()

  return [
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
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]
}
```

> El sitemap completo con los 23 slugs de servicios se genera en la **Fase 4** usando `generateStaticParams` de la DB.

---

## TAREA 9 — Verificación de `og-image.jpg`

Confirmar si existe el archivo `public/og-image.jpg` (o `.png`).

- Si **existe**: reportar dimensiones si es posible verificarlas. No modificar.
- Si **no existe**: reportarlo en el change report. El metadata ya referencia la URL — la imagen se creará en un task de assets separado. No bloquear el deploy por esto.

---

## Change report esperado

Al finalizar, entregar un reporte con este formato:

```
## FASE 1 — Change Report

### Archivos modificados
- app/layout.tsx
  - metadata.title: 'Luxury Home Builders Adelaide' → 'Carpentry & Renovations Adelaide'
  - metadata.description: actualizado
  - openGraph: reescrito completo
  - twitter: agregado
  - robots: agregado
  - alternates.canonical: agregado
  - html lang: "en" → "en-AU"

- app/(marketing)/page.tsx  [o ruta real encontrada]
  - metadata: agregado (no existía)

- app/(RUTA)/about/page.tsx  [ruta real encontrada]
  - metadata: [agregado / reemplazado]

- app/(RUTA)/contact/page.tsx  [ruta real encontrada]
  - metadata: [agregado / reemplazado]

### Archivos creados
- app/robots.ts  [si no existía]
- app/sitemap.ts  [si no existía]

### Pendientes / Hallazgos
- H1 de Home: [coincide / difiere / no encontrado]
- H1 de About: [coincide / difiere / no encontrado]
- H1 de Contact: [coincide / difiere / no encontrado]
- og-image.jpg: [existe / no existe]
- Páginas 'use client' encontradas: [lista o "ninguna"]
```

---

## Referencia de valores — tabla maestra

| Página | Meta Title | Meta Description | H1 aprobado | Primary KW |
|---|---|---|---|---|
| Home | `Contigo Constructions \| Carpentry & Renovations Adelaide` | `Licensed Carpentry & Joinery contractor in Adelaide specialising in renovations, home extensions, pergolas, decking, framing and cladding. Request a free quote today.` | `Quality Carpentry, Renovations & Home Extensions in Adelaide` | `Carpentry & Renovations Adelaide` |
| About | `About Contigo Constructions \| Licensed Carpentry & Joinery Adelaide` | `Learn more about Contigo Constructions, a licensed Carpentry & Joinery contractor in Adelaide specialising in renovations, home extensions, framing, pergolas, decking and cladding.` | `Built on Craftsmanship. Driven by Trust.` | `Carpentry & Joinery Adelaide` |
| Contact | `Contact Contigo Constructions \| Carpentry & Renovations Adelaide` | `Get in touch with Contigo Constructions. Call +61 406 274 096 or email contact@contigoconstructions.com.au. Mon–Fri 7:00 AM – 5:00 PM.` | `Let's Build Together` | `Carpentry Adelaide Contact` |

---

## Datos de empresa — referencia para Schema.org (Fases siguientes)

```
Nombre legal:  Contigo Constructions Pty Ltd
ABN:           25 698 028 394
BLD Licence:   357596 (SA)
Fundación:     13/05/2026
Empleados:     5
Teléfono:      +61 406 274 096
Email:         contact@contigoconstructions.com.au
Dirección:     76 Coorara Avenue, Payneham South SA 5070
Horario:       Mon–Fri 7:00 AM – 5:00 PM
Web:           https://contigoconstructions.com.au
Instagram:     https://www.instagram.com/contigoconstructions
Facebook:      https://www.facebook.com/contigoconstructions
LinkedIn:      https://www.linkedin.com/company/contigo-constructions-pty-ltd
TikTok:        https://www.tiktok.com/@contigoconstructions
WhatsApp:      +61 406 274 096
```

---

*Work Order generado por zipnegocios · Contigo Constructions Platform · Julio 2026*  
*Fase 1 de 8 — Ver: `Contigo_Plan_SEO_Implementacion.docx` para el plan completo*
