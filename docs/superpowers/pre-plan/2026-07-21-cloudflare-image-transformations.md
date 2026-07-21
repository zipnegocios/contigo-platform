# Cloudflare Image Transformations — Migración de entrega de imágenes del CDN
**Contigo Platform · Work order de planificación**
**Repo:** `github.com/zipnegocios/contigo-platform` · Rama `main` · Commit de corte auditado: `cdd5c614` (2026-07-18)

---

## 0. Contexto y origen

**Incidente reportado:** en el home page, la sección "Our Services" (carrusel de tarjetas volteables) mostraba covers rotas — `GET /_next/image?url=...` devolvía `400 "url" parameter is not allowed`.

**Diagnóstico confirmado (con evidencia, no supuesto):**
- `next.config.ts:6-12` ya tiene `assets.contigoconstructions.com.au` en `images.remotePatterns` desde el commit `d038449` (2026-07-17).
- `FlippableServiceCard.tsx:74-79` ya tiene `sizes` correctamente configurado.
- **No hay nada que corregir en el código fuente** para el bug tal como fue reportado originalmente.
- El comportamiento intermitente reportado por el cliente ("se arregla tras redeploy, luego vuelve") es coherente con un desfase entre lo desplegado en EasyPanel/Docker Swarm y lo que hay en `main` — ver Fase 0 de este documento.

**Decisión del cliente (Gustavo, 2026-07-21):** en lugar de seguir dependiendo del optimizador built-in de Next.js (`/_next/image`), migrar la entrega de imágenes del CDN a **Cloudflare Image Transformations**, ya habilitado en la zona `contigoconstructions.com.au`. Alcance decidido: **todo el sitio público**, no solo el carrusel.

---

## 1. Inventario real de archivos afectados (auditado contra el repo, no supuesto)

Se buscaron **todos** los usos de `next/image` y de imágenes remotas del CDN en `src/` y `app/`. Hallazgo relevante: `ServicesGrid.tsx` **no tiene ningún caller** — es código muerto. La página real `/services/[category]` usa `ServiceCategoryCarousel.tsx`, que no usa `<img>` ni `next/image` sino CSS `background-image`.

| # | Archivo | Mecanismo actual | Contexto visual |
|---|---|---|---|
| 1 | `src/presentation/sections/services/FlippableServiceCard.tsx` | `next/image` (`fill`) → **roto (400)** | Carrusel "Our Services", home |
| 2 | `src/presentation/sections/ServiceCategoryCarousel.tsx` | CSS `background-image: url()` | Cover hero-card, `/services/[category]` |
| 3 | `src/presentation/components/ProjectGallery.tsx` | `<img>` plano, sin resize | Galería en detalle de proyecto/servicio |
| 4 | `src/presentation/components/Lightbox.tsx` | `<img>` plano, sin resize | Visor full-screen (abierto desde ProjectGallery) |
| 5 | `src/presentation/components/GalleryThumbnail.tsx` | `<img>` plano, sin resize | Miniaturas — **compartido con admin** (`ServiceForm`, `ProjectForm`, `GalleryManagerModal`) |
| 6 | `src/presentation/components/ProjectsGrid.tsx` | `<img>` plano, sin resize | Grid de portafolio, `/projects` |
| 7 | `src/presentation/components/blocks/ImageCarouselBlock.tsx` | `<img>` plano, sin resize | Bloque CMS (page builder) |
| 8 | `src/presentation/components/blocks/ComparisonCardsBlock.tsx` | `<img>` plano, sin resize | Bloque CMS (page builder) |
| 9 | `src/presentation/components/blocks/TwoColumnBlock.tsx` | `<img>` plano, sin resize | Bloque CMS (page builder) |
| 10 | `src/presentation/sections/HeroSection.tsx` | `<picture><source media><img>` (art direction móvil/desktop) | Hero principal del home — **crítico para LCP** |

**Explícitamente fuera de alcance** (con justificación):
- `MissionVisionSection.tsx` → usa un asset local de `/public`, no del CDN. No aporta nada transformarlo.
- `ReviewsCarouselClient.tsx` (avatar de reseñas, `reviewerAvatarUrl`) → viene de `profilePhotoUrl` de la API de Google Business Profile (dominio `googleusercontent.com`, no nuestro CDN). El módulo de reseñas sigue bloqueado (ver memoria: GBP v4 quota pendiente), y en producción hoy son datos de muestra (`null`). Agregar el dominio de Google a los orígenes permitidos de Cloudflare es una decisión aparte, para cuando ese módulo se active.
- Componentes exclusivamente admin (`GalleryUpload`, `MediaCard`, `MediaPickerModal`, `CoverMediaSelector`, etc.) que no comparten componente con el público — se dejan como están; el equipo interno necesita ver el archivo real al gestionar contenido.

---

## 2. Arquitectura de la solución

### 2.1 Utilidad compartida (una sola fuente de verdad)

```ts
// src/presentation/lib/cloudflareImage.ts
const CF_ZONE = process.env.NEXT_PUBLIC_SITE_URL // https://contigoconstructions.com.au (ya existe en .env)

interface CloudflareImageOptions {
  width?: number
  quality?: number
  fit?: 'cover' | 'contain' | 'scale-down' | 'crop' | 'pad'
}

/** Construye una URL de Cloudflare Image Transformations para una imagen ya
 *  alojada en un origen remoto (assets.contigoconstructions.com.au u otro
 *  origen permitido). Si `src` es un asset local (no empieza con http),
 *  se devuelve sin modificar — no tiene sentido transformar algo que Next
 *  ya sirve estático desde /public. */
export function cfImage(
  src: string | null | undefined,
  { width, quality = 75, fit = 'cover' }: CloudflareImageOptions = {},
): string {
  if (!src) return ''
  if (!src.startsWith('http')) return src
  const options = [width ? `width=${width}` : null, `quality=${quality}`, 'format=auto', `fit=${fit}`]
    .filter(Boolean)
    .join(',')
  return `${CF_ZONE}/cdn-cgi/image/${options}/${src}`
}
```

### 2.2 Aplicación por componente

- **`FlippableServiceCard.tsx`** (único caso con `next/image`): usar la prop `loader` **por instancia** (soportada nativamente por `next/image`, no requiere tocar `next.config.ts` ni afectar los otros 8 usos de `next/image` en admin/login):
  ```tsx
  <Image
    src={imageUrl}
    alt={name}
    fill
    loader={({ src, width, quality }) => cfImage(src, { width, quality })}
    sizes="(max-width: 1024px) 82vw, 420px"
    ...
  />
  ```
- **`ServiceCategoryCarousel.tsx`**: `backgroundImage: item.imageUrl ? \`url(${cfImage(item.imageUrl, { width: 1600 })})\` : undefined`. Nota: al ser CSS background sin `srcset`, no hay responsividad real por breakpoint — se sirve un único ancho generoso. Si en el futuro se quiere responsividad fina aquí, habría que migrar este componente de `background-image` a `<img>`, pero eso es un cambio de UI más grande y no es parte de este work order.
- **Resto de componentes (`ProjectGallery`, `Lightbox`, `GalleryThumbnail`, `ProjectsGrid`, los 3 bloques CMS, `HeroSection`)**: envolver el `src` existente con `cfImage(url, { width, quality })`, sin tocar layout, clases ni lógica.

### 2.3 Anchos propuestos por componente (ajustables — ver §5)

| Componente | Ancho propuesto | Calidad | Razón |
|---|---|---|---|
| `FlippableServiceCard` | dinámico (via loader, Next decide el srcset) | 75 (default) | Ya tiene `sizes` responsivo |
| `ServiceCategoryCarousel` | 1600 | 75 | Hero-card puede expandirse a casi todo el viewport |
| `ProjectGallery` (grid) | 800 | 75 | Tarjetas de galería, no full-bleed |
| `Lightbox` (visor full-screen) | 2000 | 80 | Es la vista de "zoom", conviene algo más de fidelidad |
| `GalleryThumbnail` | 300 | 75 | Miniatura pequeña (admin + filmstrip del lightbox) |
| `ProjectsGrid` | 900 | 75 | Cards de portafolio |
| `ImageCarouselBlock` / `ComparisonCardsBlock` / `TwoColumnBlock` | 1200 | 75 | Contenido de CMS de ancho variable, valor conservador |
| `HeroSection` — `desktopImageUrl` | 1920 | 75 | Full-bleed, crítico para LCP |
| `HeroSection` — `mobileImageUrl` | 750 | 75 | Ya tiene su propio breakpoint vía `<source media>` |

---

## 3. Fases de implementación (Claude Code)

- [ ] **Fase 0 — Auditoría de infraestructura (paralela, no bloqueante)**
  - Verificar en EasyPanel/SSH qué commit SHA está corriendo realmente en el/los contenedor(es) de producción (`docker service ps <servicio>` → columna IMAGE, o inspeccionar el digest de la imagen activa) y compararlo contra `cdd5c614` (HEAD de `main`).
  - Verificar cuántas réplicas tiene el servicio (`docker service inspect <servicio> --pretty` → `Replicas`). Si hay >1 réplica, confirmar que todas corren el mismo digest de imagen — un desfase aquí explicaría por qué el fix "se pierde" después de un rato.
  - No requiere cambios de código. Es un ítem de diagnóstico — documentar el hallazgo en el reporte final, no corregir nada de infraestructura sin discutirlo antes.

- [ ] **Fase 1 — Utilidad compartida**
  - Crear `src/presentation/lib/cloudflareImage.ts` (código en §2.1).
  - Sin tests unitarios existentes en el repo para `src/presentation/lib/` — evaluar si vale la pena uno simple (input/output de `cfImage`) dado que es lógica pura sin dependencias.

- [ ] **Fase 2 — Aplicar en los 10 archivos del inventario (§1)**
  - Cada archivo: un solo `import { cfImage } from '@/presentation/lib/cloudflareImage'` + envolver el/los `src`/`backgroundImage` existentes.
  - No tocar `next.config.ts` (no hace falta para este alcance).
  - No tocar los otros 8 usos de `next/image` (logos, login admin) — quedan con el optimizador built-in de Next, sin cambios.

- [ ] **Fase 3 — Prerrequisito de Cloudflare (checklist manual, NO ejecutable por Claude Code)**
  - Ver §4 — pasos que Gustavo debe ejecutar en el dashboard de Cloudflare antes de que el deploy de la Fase 2 funcione en producción.

- [ ] **Fase 4 — Validación**
  - Build, lint, typecheck (comandos según `package.json` del repo).
  - No hay tests automatizados de UI para estos componentes — la validación es visual (ver checklist de verificación manual en el reporte final).

---

## 4. Pasos manuales en Cloudflare (Gustavo — antes o en paralelo a la Fase 2)

1. Cloudflare Dashboard → zona `contigoconstructions.com.au` → **Images → Transformations** (ya está Enabled).
2. Pestaña **Sources**:
   - Confirmar que el modo es **"Allowed origins"** (default) y **no** "Any origin" (este último expondría la zona como proxy abierto de transformación de imágenes de terceros).
   - **Add origin** → Domain: `assets.contigoconstructions.com.au` → Path: dejar en blanco → Add → Save. Efecto inmediato, sin necesidad de purgar caché.
   - Nota de la documentación de Cloudflare: al agregar un dominio raíz manualmente, los subdominios *no* se heredan automáticamente — por eso hay que agregar el subdominio explícito aunque técnicamente ya esté en la misma zona DNS.
3. No se requiere Worker, no se requiere plan Paid. El plan Free incluye 5,000 transformaciones únicas/mes (una "transformación única" = combinación distinta de imagen origen × ancho; `format=auto` no cuenta como variante extra). Con ~10 componentes y anchos fijos o acotados, el uso estimado del sitio queda muy por debajo del límite gratuito.
4. Después del deploy, revisar **Images → Transformations → Analytics** en el dashboard durante la primera semana para confirmar el volumen real de transformaciones únicas.

---

## 5. Supuestos técnicos a confirmar (no bloquean el inicio, pero conviene revisarlos)

- Los anchos de la tabla en §2.3 son estimaciones razonables basadas en el layout observado en el código (tamaños de card, breakpoints existentes), no medidos pixel a pixel contra el CSS real. Ajustar es trivial (son literales en cada archivo).
- `GalleryThumbnail.tsx` es compartido con el panel admin — el efecto colateral (miniaturas comprimidas también en `ServiceForm`/`ProjectForm`/`GalleryManagerModal`) se considera deseable (panel más liviano), pero queda documentado por si Gustavo prefiere excluir el admin.
- `ServiceCategoryCarousel.tsx` seguirá sin responsividad real por breakpoint al usar CSS `background-image` — se sirve un único ancho (1600). Si esto no es suficiente en pantallas grandes o se ve pesado en móvil, la solución correcta a futuro es migrar ese componente a `<img>`, fuera de este alcance.

---

## 6. Fuera de alcance (explícito)

- Refactor de `ServiceCategoryCarousel.tsx` de `background-image` a `<img>` con `srcset` real.
- Eliminar el código muerto `ServicesGrid.tsx` (mencionarlo en el reporte de Claude Code como hallazgo, pero no borrarlo sin que Gustavo lo confirme).
- Avatares de reseñas de Google (módulo GBP aún bloqueado).
- Cualquier cambio a `next.config.ts` / `remotePatterns` / optimizador built-in.
- Cualquier corrección de infraestructura en EasyPanel — la Fase 0 es solo diagnóstico.
