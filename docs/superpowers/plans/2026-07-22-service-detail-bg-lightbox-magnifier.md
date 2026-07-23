# Work Order: Fondo Claro en Detalle de Servicio + Lightbox Full-Screen con Lupa Flotante

**Fecha:** 2026-07-22
**Módulo:** Portafolio público — páginas de servicio
**Archivos involucrados:**
- `app/(portfolio)/services/[category]/[item]/page.tsx`
- `src/presentation/components/Lightbox.tsx`
- `src/presentation/components/ProjectGallery.tsx` (solo como consumidor a no romper)
- Nuevo: `src/presentation/components/MagnifierLightboxImage.tsx` (o nombre equivalente)

## Contexto (auditado antes de este work order)

- `/services/[category]` (carrusel por categoría, `ServiceCategoryCarousel.tsx`): el fondo
  YA está fijado en `app/(portfolio)/services/[category]/layout.tsx` vía
  `backgroundColor: 'var(--petrol-800, #0D3C4C)'`. **No tocar este archivo/valor.**
- `/services/[category]/[item]` (detalle, `ServiceItemPage` → `LegacyServiceBody`): hoy NO
  define fondo explícito, hereda el `body` claro global por defecto. Debe quedar fijado
  explícitamente en `#FAF6F0` — mismo tono que usa el listado `/projects`
  (`app/(portfolio)/projects/page.tsx`). El Hero (70vh, imagen + degradado oscuro para el
  título blanco) permanece sin cambios — el ajuste de fondo aplica solo al cuerpo/contenido
  bajo el hero.
- Lightbox reutilizable ya existe: `src/presentation/components/Lightbox.tsx` (usado hoy por
  `ProjectGallery.tsx`). Se EXTIENDE este componente, no se crea uno paralelo.

## Fase 1 — Fondo claro explícito en detalle de servicio

- [ ] En `app/(portfolio)/services/[category]/[item]/page.tsx`, envolver el retorno de
      `ServiceItemPage` en un contenedor con `backgroundColor: '#FAF6F0'` (aplica tanto a la
      rama con `PageBlockRenderer` como a la rama `LegacyServiceBody`), para que el fondo no
      dependa implícitamente del `body` global.
- [ ] Confirmar que los colores de texto ya usados en `LegacyServiceBody`
      (`#3D3530`, `#2D2924`, `#A89E8C`, `#1E1A16` en el sidebar oscuro) mantienen buen
      contraste sobre `#FAF6F0` — ya están pensados para fondo claro, verificación visual,
      sin cambios de paleta esperados.
- [ ] NO modificar `[category]/layout.tsx` ni el degradado del Hero.

## Fase 2 — Botón "foto + ojo" en el Hero (esquina inferior derecha, junto a la descripción)

- [ ] Crear icono SVG inline combinando marco de fotografía + ojo (no existe un ícono
      compuesto equivalente en `lucide-react`): `ImageIcon` de fondo + `Eye` superpuesto
      centrado, o un único `<svg>` custom con ambos trazos.
- [ ] Ubicar el botón en `absolute bottom-12 right-8 md:bottom-16 md:right-16` dentro del
      contenedor del Hero en `page.tsx` (mismo padding que ya usa el bloque de título/
      descripción: `px-8 pb-12 md:px-16 md:pb-16`), alineado visualmente junto al párrafo de
      `service.shortDescription`.
- [ ] Al hacer click, abre el lightbox extendido mostrando `service.imageUrl` (imagen
      principal del hero) — no la galería de `ProjectGallery`.
- [ ] Accesible: `aria-label="View full photo"`, focable por teclado, tamaño mínimo táctil
      44×44px (mismo criterio que los botones existentes del Lightbox).

## Fase 3 — Lightbox: modo "limpio" full-screen

- [ ] Añadir prop opcional a `Lightbox.tsx` (ej. `variant?: 'default' | 'clean'`). En modo
      `clean`: ocultar el bloque de título/descripción bajo la imagen y los indicadores de
      puntos/thumbnails. Imagen a `max-width`/`max-height` grandes, sin recortes ni filtros
      — mismo criterio que ya usa `object-fit: contain`.
- [ ] El uso actual desde `ProjectGallery` sigue en modo `default` (sin cambios de
      comportamiento visible ahí).

## Fase 4 — Lupa flotante (magnifying glass que sigue cursor/dedo)

Decisión de diseño confirmada: **lupa flotante** (círculo aumentado localmente sobre la
imagen), no zoom de imagen completa.

- [ ] Nuevo sub-componente `MagnifierLightboxImage.tsx`, usado dentro de `Lightbox.tsx` solo
      cuando el modo lupa está activo.
- [ ] Mecánica: un círculo (ej. 180–220px de diámetro) que sigue `onMouseMove` (desktop) y
      `onTouchMove` (mobile), mostrando dentro un recorte de la MISMA imagen a mayor escala
      (dos `<img>` o un único `background-image` con `background-size` y `background-position`
      calculados según la posición del cursor relativa a la imagen y el nivel de zoom actual)
      — la imagen base NO se escala, solo el contenido dentro del círculo.
- [ ] Barra de control centrada debajo de la imagen (o superpuesta, esquina inferior):
      `[ − ]  [ 🔍 ]  [ + ]`
      - Botón `🔍` (lupa, `lucide-react` `Search` o `ZoomIn`): toggle on/off del modo lupa.
        Apagado por defecto al abrir el lightbox.
      - Botón `−` (izquierda de la lupa): reduce el nivel de amplificación (pasos de 0.5x,
        mínimo 1.5x).
      - Botón `+` (derecha de la lupa): aumenta el nivel de amplificación (hasta 4x).
      - Los botones `+`/`−` solo activos/visibles cuando el modo lupa está encendido.
- [ ] En touch: el círculo de lupa aparece y sigue el dedo mientras se mantiene presionado
      sobre la imagen, sin bloquear el swipe de navegación entre imágenes cuando el modo lupa
      está apagado.
- [ ] El resto del lightbox (`Escape`, flechas, swipe, thumbnails) sigue intacto cuando el
      modo lupa está apagado.

## Fase 5 — Validación

- [ ] Build: `pnpm build`
- [ ] Lint: `pnpm lint`
- [ ] Typecheck: `pnpm typecheck`
- [ ] Validación visual: `/services/carpentry` (sin cambios), `/services/carpentry/deck`
      (fondo `#FAF6F0`, botón foto+ojo abajo-derecha del hero, lightbox limpio + lupa
      funcional en desktop y mobile), `/projects` y `/projects/[slug]` (sin cambios, para
      confirmar que la paleta compartida no se vio afectada).

## Fuera de alcance

- `ServiceCategoryCarousel.tsx` y su layout petrol (`[category]/layout.tsx`).
- Comportamiento existente del `Lightbox` en `ProjectGallery` fuera del nuevo modo
  `clean`/lupa.
- Chrome DevTools MCP (prohibido).

## Preguntas ya resueltas con el cliente/consultor

1. Fondo de `/services/[category]/[item]`: **claro, `#FAF6F0`** (igual al listado de
   `/projects`), no petrol oscuro.
2. Mecanismo de lupa: **lupa flotante** que sigue cursor/dedo, no zoom de imagen completa.
3. Posición del botón "foto+ojo": **esquina inferior derecha del hero**, junto al texto de
   descripción.
