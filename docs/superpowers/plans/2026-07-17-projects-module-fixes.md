# Work Order — Ajustes Módulo Projects (Admin + Portfolio Público)

**Fecha:** 2026-07-17
**Repositorio:** `zipnegocios/contigo-platform` · branch `main`
**Alcance:** `/admin/projects` (editor + Gallery Manager), `/projects` (listado público con filtros), `/projects/[slug]` (detalle + lightbox), home (`ProjectsSection` / featured).
**Prioridad:** Alta — afecta contenido publicado visible al cliente final.

> **Reglas globales vigentes (obligatorias):** no ejecutar `git commit` / `git push` / PRs / releases; validación vía build + lint + typecheck + tests (no pruebas manuales como mecanismo principal); prohibido MCP Chrome DevTools; no crear archivos Markdown de resumen — el cierre se entrega en el chat con el formato de Respuesta Final Obligatoria (Resumen Ejecutivo, Verificación Manual en Producción, Migraciones Ejecutadas, Builds y Validaciones, Commits Sugeridos).

---

## Contexto

Se detectaron 6 defectos/mejoras en el módulo de Projects:

1. **[BUG]** En `/admin/projects/[id]/edit`, el grid "Gallery (N items)" y el Gallery Manager no renderizan thumbnail para elementos de tipo video (aparece un recuadro vacío / icono genérico).
2. **[BUG]** La `description` del proyecto se ve correcta en el textarea del admin (saltos de línea, párrafos, lista "Scope of works"), pero en la página pública de detalle se renderiza como un solo bloque de texto colapsado, perdiendo saltos de línea y estructura de lista.
3. **[BUG]** En `/projects` (listado público), el filtro por categoría "Carpentry" no devuelve el card del proyecto, pero el mismo proyecto sí aparece bajo "All".
4. **[BUG]** Un proyecto marcado como `featured = true` en el admin no aparece en la sección Featured Projects de la home.
5. **[FEATURE]** Al renombrar un proyecto, el `slug` debe regenerarse automáticamente a partir del nuevo título (slug friendly), usando el `SlugGeneratorService` existente. Estructura de URL pública deseada: `/projects/[category]/[slug]`. ⚠️ **Gated por preguntas abiertas §8.**
6. **[FEATURE/BUG]** El lightbox fullscreen de la galería pública solo muestra imágenes. Los videos deben ser navegables y reproducibles dentro del mismo marco del lightbox (si hay 5 imágenes + 1 video, el video es el sexto elemento del carrusel; con múltiples videos, todos incluidos).

**Hipótesis a verificar (no asumir):** los síntomas 2, 3 y 4 podrían compartir causa raíz — caché de páginas públicas (ISR/`fetch` cache) sin `revalidatePath`/`revalidateTag` tras el `PATCH /api/admin/projects/[id]` — o ser tres bugs independientes de renderizado/query. La Fase 0 debe determinar cuál escenario es el real con evidencia antes de proponer fixes.

---

## Fase 0 — Auditoría (BLOQUEANTE — no avanzar sin cerrar este checklist)

Reportar hallazgos en el chat antes de escribir cualquier fix.

- [ ] **0.1 Modelo de galería:** confirmar cómo se persiste la galería del proyecto. ¿`projects.gallery_urls` (JSON de strings) o tabla relacional con `media_type`? ¿Existe algún campo/convención que distinga imagen de video (extensión, mime, metadata en Media Library vía `media_metadata`)? Documentar el shape exacto de un item de galería con un registro real.
- [ ] **0.2 Renderizado de thumbnails admin:** localizar los componentes del grid de Gallery y del Gallery Manager en `/admin/projects/[id]/edit`. Confirmar si usan `<img>` / `next/image` incondicional (causa probable del thumbnail vacío para URLs `.mp4`/`.webm`).
- [ ] **0.3 Renderizado de description pública:** localizar el componente de detalle en `app/(portfolio)/projects/[slug]/`. Confirmar cómo se imprime `description` (¿`{description}` plano sin `whitespace-pre-line`, sin split de párrafos, sin sanitizado?).
- [ ] **0.4 Query del filtro público:** identificar el endpoint/consulta que alimenta `/projects` con filtro por categoría. Confirmar contra qué campo filtra (¿`categoryId` FK, `service_type` string legado, slug vs. nombre, case-sensitivity?) y contra qué valor real tiene guardado el proyecto "Carpentry" en DB. Registrar la discrepancia exacta.
- [ ] **0.5 Featured en home:** revisar `GET /api/projects/featured` y `ProjectsSection.tsx`. Confirmar condiciones del query (`featured = true`, ¿`published_at not null`?, ¿`trashed_at is null`?, ¿límite/order_index?) y verificar el estado real del proyecto en DB contra esas condiciones.
- [ ] **0.6 Caché/revalidación:** determinar si las rutas públicas (`/`, `/projects`, `/projects/[slug]`) son estáticas/ISR y si el `PATCH /api/admin/projects/[id]` ejecuta `revalidatePath`/`revalidateTag`. Evidencia: headers de respuesta, config de `revalidate` en las páginas, y presencia/ausencia de llamadas de revalidación en la ruta admin.
- [ ] **0.7 Slug actual:** revisar `SlugGeneratorService` y el `PATCH` de proyectos. Confirmar si el slug se genera solo en creación, si es editable manualmente, y si existe constraint de unicidad.
- [ ] **0.8 Estructura de ruta:** confirmar que la ruta pública actual es `app/(portfolio)/projects/[slug]/` (sin segmento de categoría) e inventariar todos los lugares que construyen links a proyectos (cards del listado, featured de home, sitemap si existe, breadcrumbs).
- [ ] **0.9 Lightbox:** localizar el componente de lightbox/carrusel del detalle público. Confirmar si itera solo sobre imágenes o sobre toda la galería, y si el conteo de dots/indicadores incluye los videos.

**Gate:** publicar en el chat el resumen de hallazgos 0.1–0.9 y la causa raíz confirmada de cada síntoma. **Detenerse y esperar confirmación antes de la Fase 5** (las Fases 1–4 y 6 pueden continuar tras reportar hallazgos, salvo que la auditoría revele dependencias cruzadas).

---

## Fase 1 — Thumbnails de video en admin (síntoma 1)

- [ ] 1.1 Crear un helper compartido de detección de tipo de media (p. ej. `src/presentation/lib/media-type.ts` con `isVideoUrl(url): boolean` basado en extensión y/o metadata disponible). **Un solo helper reutilizado por admin y público — no duplicar la detección en cada componente.**
- [ ] 1.2 En el grid "Gallery (N items)" del edit de proyecto: renderizar los videos con `<video muted preload="metadata" playsInline>` (que muestra el primer frame) más overlay de icono play, manteniendo el mismo tamaño/aspect del thumbnail de imagen.
- [ ] 1.3 Aplicar el mismo tratamiento en el Gallery Manager (fila con thumbnail 64px aprox.).
- [ ] 1.4 Fallback: si el navegador no puede cargar metadata del video, mostrar placeholder con icono de video (no recuadro vacío).
- [ ] 1.5 Verificar drag-to-reorder, delete y edición de title/description siguen funcionando para items de video.

## Fase 2 — Description en página pública (síntoma 2)

- [ ] 2.1 Según hallazgo 0.3, corregir el renderizado para preservar la estructura escrita en el admin: párrafos separados y líneas de "Scope of works" como líneas independientes. Opción mínima: split por `\n\n` en `<p>` + `whitespace-pre-line`; evitar `dangerouslySetInnerHTML` con input sin sanitizar.
- [ ] 2.2 Respetar la tipografía/estilos existentes del detalle (Alegreya body, tokens de marca). No introducir librería de markdown salvo que la auditoría demuestre que ya existe una en el bundle.
- [ ] 2.3 Verificar que el cambio no rompa proyectos con descripciones de una sola línea.

## Fase 3 — Filtro por categoría en /projects (síntoma 3)

- [ ] 3.1 Corregir la discrepancia identificada en 0.4 en la capa correcta: si el proyecto guarda un valor legado (`service_type` string) y el filtro compara contra `categories`, alinear la fuente de verdad hacia el campo FK/slug de categoría — consistente con la regla del sistema de que la taxonomía de Anamaria es la fuente de verdad.
- [ ] 3.2 Si la corrección implica normalizar datos existentes (proyectos con valor de categoría inconsistente), **generar migración/seed vía Drizzle** — nunca ajuste manual en DB.
- [ ] 3.3 Verificar los 4 rubros (Carpentry, Cladding, Gyprock Fixing & Flushing, Additional Services): cada filtro devuelve sus proyectos y "All" sigue devolviendo el total.

## Fase 4 — Featured en home (síntoma 4)

- [ ] 4.1 Corregir según causa raíz de 0.5/0.6: query del endpoint featured, o revalidación de la home tras el `PATCH` admin, o ambos.
- [ ] 4.2 Si el problema es caché: añadir `revalidatePath`/`revalidateTag` para `/`, `/projects` y `/projects/[slug]` en las rutas admin de create/update/delete de proyectos (patrón único, no ad-hoc por síntoma).
- [ ] 4.3 Verificar el flujo completo: toggle featured en admin → aparece/desaparece de la home sin redeploy.

## Fase 5 — Slug automático al renombrar + ruta con categoría (síntoma 5) ⚠️ GATED

**No iniciar sin respuestas a §8 (Q1–Q3).**

- [ ] 5.1 En el `PATCH /api/admin/projects/[id]`: si cambia `title`, regenerar `slug` con `SlugGeneratorService` (con sufijo de unicidad si colisiona), según la política decidida en Q1.
- [ ] 5.2 Implementar la política de redirects decidida en Q2 (p. ej. tabla/registro de slugs históricos + redirect 301 en la página de detalle, o `redirects` estáticos — según respuesta).
- [ ] 5.3 Si Q3 aprueba la reestructura de ruta: mover a `app/(portfolio)/projects/[category]/[slug]/`, actualizar **todos** los constructores de links inventariados en 0.8, sitemap, y redirects 301 desde `/projects/[slug]` legacy.
- [ ] 5.4 Migración Drizzle si se requiere estructura nueva (p. ej. tabla `project_slug_history`).

## Fase 6 — Videos en lightbox público (síntoma 6)

- [ ] 6.1 El lightbox itera sobre la galería completa (imágenes + videos) en el orden de `sort_order`; el conteo de indicadores/dots refleja el total real.
- [ ] 6.2 Item de video renderiza `<video controls playsInline>` dentro del mismo marco/dimensiones del lightbox (object-fit consistente con imágenes).
- [ ] 6.3 Al navegar fuera de un slide de video, pausar la reproducción.
- [ ] 6.4 Reutilizar el helper `isVideoUrl` de la Fase 1.
- [ ] 6.5 Verificar thumbnails del strip/carrusel inferior del detalle público también muestran el video (mismo tratamiento de la Fase 1 si aplica).

---

## §7 Validación (antes de cerrar)

- [ ] `pnpm build` ✅
- [ ] `pnpm lint` ✅
- [ ] `pnpm typecheck` (o `tsc --noEmit`) ✅
- [ ] Tests existentes ✅
- [ ] Migraciones/seeds Drizzle ejecutados si las Fases 3/5 los generaron
- [ ] Entregar cierre en chat con el formato de Respuesta Final Obligatoria (incluye checklist de Verificación Manual en Producción cubriendo: thumbnails de video en admin, description con formato en público, filtro por los 4 rubros, featured en home, regeneración de slug + redirects, lightbox con video reproducible y pausa al navegar)

## §8 Preguntas abiertas (responder antes de Fase 5)

- **Q1 — Política de regeneración de slug:** ¿regenerar SIEMPRE que cambie el título, o solo si el slug no fue personalizado manualmente? ¿Debe el admin poder ver/editar el slug resultante antes de guardar?
- **Q2 — Redirects SEO:** al cambiar un slug, ¿mantener redirect 301 desde el slug anterior (recomendado — hay engagement SEO activo y URLs posiblemente ya indexadas)? ¿Cuántos slugs históricos conservar por proyecto?
- **Q3 — Reestructura de ruta:** la ruta actual es `/projects/[slug]`. Adoptar `/projects/[category]/[slug]` es un cambio de estructura de URLs público con impacto SEO (sitemap, indexación, links internos). ¿Confirmar que se hace ahora en este work order, o se difiere a un work order propio coordinado con la estrategia SEO (Contigo_SEO_Definicion_v4)?
- **Q4 — Poster de videos:** ¿es suficiente el primer frame vía `preload="metadata"` (cero costo, client-side), o se desea poster generado/almacenado (requeriría campo adicional y pipeline de generación — mayor alcance)?

---

## Cierre

Al finalizar, entregar en el chat la Respuesta Final Obligatoria según las reglas globales. No crear documentos de resumen en el repositorio.
