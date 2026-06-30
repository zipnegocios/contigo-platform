# Carrusel de servicios — Contigo Constructions

**Documento técnico de implementación**
**Cliente:** Contigo Constructions (Adelaide, Australia)
**Elaborado por:** Gustavo Amarista — zipnegocios
**Componente:** `ServicesCarousel`
**Stack base del proyecto:** Next.js 14 (App Router) · Drizzle ORM · PostgreSQL + pgvector · Cloudflare R2 · NextAuth.js

---

## 1. Resumen ejecutivo

Este documento adapta el mecanismo del pen *Timed Cards Opening* (carrusel de héroe + cola con GSAP) a un componente de **cards de servicios** para la landing de Contigo Constructions. La referencia original muestra destinos turísticos; aquí el mismo motor de rotación muestra servicios de construcción/renovación (cocinas, baños, extensiones, paisajismo, etc.), con imagen de portada, título y descripción corta por servicio.

Se mantiene la esencia visual — una carta "héroe" a pantalla completa con su panel de texto, y una fila de cards pequeñas rotando detrás — pero se resuelven tres deudas que el pen original deja explícitas en su propio README: **no es responsive**, **no tiene control manual real** (las flechas existen en el HTML pero no hacen nada) y **el contenido está hardcodeado en JS**. En esta versión el contenido viene de base de datos vía Drizzle, las flechas quedan cableadas, y el layout colapsa a un carrusel deslizable en mobile.

---

## 2. Contexto del proyecto

Contigo Constructions es una empresa de construcción y renovación de lujo. La sección de servicios es contenido de marketing que el cliente final probablemente querrá editar sin tocar código (agregar un servicio nuevo, cambiar una foto, reordenar). Por eso este componente no debe ser una lista estática en el JSX: debe leer de la tabla `services` ya prevista en el esquema Drizzle del proyecto, con las imágenes servidas desde Cloudflare R2.

---

## 3. Objetivo del componente

Mostrar entre 4 y 8 servicios en un carrusel de apertura tipo "timed cards": un servicio en foco a pantalla completa con su descripción, y el resto como cards pequeñas en cola, avanzando automáticamente cada pocos segundos o por clic del usuario en las flechas o en una card de la cola.

---

## 4. Decisión de stack de animación

| Opción | A favor | En contra |
|---|---|---|
| GSAP + `@gsap/react` | Es la librería del pen original; control de timeline muy fino; `useGSAP()` resuelve limpieza de animaciones en cleanup de React | Dependencia adicional (~70kb), licencia comercial de algunos plugins (no aplica aquí, solo core) |
| Framer Motion | Ya idiomático en React, `AnimatePresence` simplifica el entra/sale | El timing tipo "telón + stagger + reciclaje" del original es más natural en GSAP imperativo que en el modelo declarativo de Framer |

**Recomendación:** mantener GSAP, pero vía el hook `useGSAP` (paquete `@gsap/react`) en lugar de `gsap.to` suelto como en el pen. Esto ata cada animación al ciclo de vida del componente y evita memory leaks al desmontar — algo que el pen original no necesita resolver porque es una página única, pero que sí importa en una SPA con navegación entre rutas de Next.js.

---

## 5. Modelo de datos (Drizzle)

```ts
// db/schema/services.ts
import { pgTable, serial, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  title: varchar("title", { length: 60 }).notNull(),       // ej: "Cocinas"
  subtitle: varchar("subtitle", { length: 60 }),            // ej: "A medida"
  description: text("description").notNull(),
  imageKey: varchar("image_key", { length: 255 }).notNull(), // key en el bucket R2
  sortOrder: integer("sort_order").notNull().default(0),
  isFeatured: integer("is_featured").notNull().default(1),   // 1 = aparece en el carrusel
  createdAt: timestamp("created_at").defaultNow(),
});
```

La carta del pen original separa `title` y `title2` (dos líneas de un mismo título grande, ej. "SAINT" / "ANTONIEN"). Para servicios eso no aplica naturalmente — se reemplaza por `title` + `subtitle`, que cubre el mismo rol visual (línea grande + línea de apoyo) sin forzar un dato artificial.

`imageKey` guarda solo la ruta dentro del bucket; la URL pública se construye en el server (`${R2_PUBLIC_BASE}/${imageKey}`), nunca se hardcodea la URL completa en la tabla — así un cambio de dominio del bucket no exige migración de datos.

---

## 6. Arquitectura de componentes

```
app/(marketing)/page.tsx
  └─ <ServicesSection />                 ← Server Component
        └─ query Drizzle: services WHERE isFeatured = 1 ORDER BY sortOrder
        └─ <ServicesCarousel data={services} />   ← Client Component ("use client")
```

La separación es deliberada: el **fetch de datos es server-side** (sin esto, no hay SEO real — un buscador no ejecuta el `step()` de GSAP para ver el contenido). El **carrusel en sí es client-side** porque depende de `window`, refs de DOM y animación imperativa. El Server Component le pasa el arreglo de servicios ya resuelto como prop; el Client Component nunca llama a la base de datos directamente.

```
components/services/
  ├─ services-carousel.tsx       (motor de animación, client)
  ├─ service-details-panel.tsx   (los dos paneles even/odd)
  ├─ service-pagination.tsx      (flechas + barra de progreso + número)
  └─ services-carousel.module.css
```

---

## 7. Adaptación del motor de rotación

El núcleo del pen es un arreglo `order` que rota con `order.push(order.shift())`. En React esto se traduce a **estado**, no a una variable global mutable:

```ts
// services-carousel.tsx (extracto)
"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState, useCallback } from "react";

type Service = {
  id: number;
  title: string;
  subtitle: string | null;
  description: string;
  imageUrl: string;
};

export function ServicesCarousel({ data }: { data: Service[] }) {
  const [order, setOrder] = useState<number[]>(data.map((_, i) => i));
  const [detailsEven, setDetailsEven] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);

  const step = useCallback((direction: "next" | "prev" = "next") => {
    if (isAnimating.current) return;     // evita doble-clic durante una transición
    isAnimating.current = true;

    setOrder((prev) =>
      direction === "next"
        ? [...prev.slice(1), prev[0]]          // equivalente a push(shift())
        : [prev[prev.length - 1], ...prev.slice(0, -1)] // retroceder
    );
    setDetailsEven((v) => !v);
    // ... aquí van las llamadas gsap.to() equivalentes al step() original,
    // dentro de un useGSAP(() => { ... }, [order]) con onComplete: () => { isAnimating.current = false }
  }, []);

  // resto del componente: useGSAP(init) en el primer render,
  // setInterval propio para el "timed" automático (ver sección 11, accesibilidad)
}
```

Tres diferencias deliberadas respecto al original:

1. **`isAnimating` como ref, no como variable de módulo.** El pen usa una variable `clicks` a nivel de archivo porque solo hay una instancia posible en la página. Un componente React puede montarse más de una vez (o desmontarse a mitad de animación al navegar), así que ese guard vive en un `useRef` ligado a la instancia.
2. **`step()` acepta dirección.** El pen no implementa retroceso (`unshift(pop())`); aquí se agrega desde el inicio porque las flechas van a estar realmente cableadas (sección 9).
3. **No se leen ni escriben estilos vía `gsap.set` sobre selectores de string** (`"#card0"`) como en el pen — eso rompe con múltiples instancias y con el Strict Mode de React. Cada elemento tiene un `ref` propio (`useRef<HTMLDivElement>[]` o un `Map`), y GSAP anima sobre la referencia, no sobre el ID global.

Los dos paneles `details-even` / `details-odd` del pen se conservan tal cual: es la técnica correcta para que el texto saliente y el entrante se animen a la vez sin parpadeo, y no depende de jQuery ni de selectores globales — se traduce 1:1 a dos refs en React.

---

## 8. Carga de imágenes

El pen precarga imágenes con `new Image()` antes de animar. En Next.js esto se reemplaza por `next/image` con `priority` en la imagen del héroe inicial, y `loading="lazy"` en el resto:

```tsx
<Image
  src={service.imageUrl}
  alt={service.title}
  fill
  sizes="100vw"
  priority={index === 0}
  className={styles.cardImage}
/>
```

Esto resuelve el precargado del pen de forma nativa (Next.js ya gestiona el `<link rel="preload">` para la imagen marcada `priority`) y además sirve la imagen en el formato y tamaño óptimos vía el optimizador de imágenes de Next.js, apuntando al dominio de Cloudflare R2 configurado en `next.config.js` → `images.remotePatterns`.

---

## 9. Responsive y control manual

El README del pen original lo dice explícitamente: *"Need some more work to get it responsive."* No se puede heredar esa limitación en un sitio de marketing real. Estrategia:

- **Desktop (≥1024px):** layout idéntico al pen — héroe a pantalla completa, cola de cards a la derecha, panel de texto a la izquierda.
- **Tablet/mobile (<1024px):** se abandona el layout de "héroe + cola flotante" y el carrusel colapsa a un **slider horizontal simple con scroll-snap** (una card grande visible, swipe para la siguiente). Es un componente visualmente distinto pero conceptualmente el mismo `order` — solo cambia cómo se pinta.
- **Flechas funcionales:** a diferencia del pen (donde `.arrow-left` / `.arrow-right` existen en el HTML pero no tienen listener), aquí cada flecha llama a `step("next")` / `step("prev")`, y las cards pequeñas de la cola son clicables: al hacer clic en una card no-activa, se calcula cuántos `step()` hacen falta para traerla al frente.

---

## 10. Accesibilidad

- **`prefers-reduced-motion`:** si el usuario lo tiene activado, el avance automático (`loop()` del original) se desactiva por completo y el carrusel solo avanza por interacción manual; las transiciones de entrada/salida se reducen a un cross-fade simple sin desplazamiento.
- **Pausa al interactuar:** el ciclo automático se detiene con `onMouseEnter`/`onFocus` sobre el contenedor y se reanuda al salir — el pen original no tiene esto, y un carrusel que sigue avanzando mientras el usuario lee la descripción es una fuente clásica de frustración.
- **`aria-live="polite"`** en el panel de detalles activo, para que un lector de pantalla anuncie el cambio de servicio.
- Flechas con `aria-label="Servicio anterior"` / `"Siguiente servicio"`, nunca solo el ícono SVG sin texto accesible.

---

## 11. El "timed" automático

```ts
useEffect(() => {
  if (prefersReducedMotion || isPaused) return;
  const interval = setInterval(() => step("next"), 4500);
  return () => clearInterval(interval);
}, [isPaused, prefersReducedMotion, step]);
```

Se reemplaza la barra `.indicator` animada con GSAP del pen (un `<div>` que cruza la pantalla en 2s y se dispara en 0.8s) por la misma idea, pero sincronizada con este `setInterval` en vez de ser ella misma el reloj — en el pen, la barra *es* el temporizador (el `loop()` espera a que termine la animación de la barra). Separarlos evita que un frame perdido en la animación de la barra desincronice el avance real del carrusel.

---

## 12. SEO

Como esta sección vive en la landing pública, el HTML que recibe un crawler debe contener el texto de **todos** los servicios, no solo el que esté activo en el momento del render. El Server Component renderiza un `<ul>` semántico con los 4–8 servicios (título, descripción, imagen con `alt`) oculto visualmente tras hidratación (`sr-only` hasta que el carrusel toma el control), de forma que el contenido exista en el HTML inicial independientemente de qué carta esté en foco cuando se ejecuta el JS.

---

## 13. Plan de implementación sugerido

| Sprint | Entregable |
|---|---|
| 1 | Esquema `services` en Drizzle + migración + seed con los servicios reales de Contigo Constructions |
| 2 | `ServicesCarousel` desktop: motor de rotación con refs, sin responsive todavía (paridad con el pen) |
| 3 | Versión mobile (scroll-snap), flechas funcionales, pausa por interacción |
| 4 | Accesibilidad (`prefers-reduced-motion`, `aria-live`), fallback SEO, QA cross-browser |

---

## 14. Riesgos y consideraciones abiertas

- Si el cliente termina con más de 8 servicios, la cola de cards pequeñas se vuelve demasiado angosta en desktop; conviene fijar un máximo y mover el resto a una página `/servicios` aparte con grid estático.
- GSAP Core es gratuito, pero si en algún punto se quiere usar `ScrollTrigger` u otro plugin de pago de GSAP en el mismo proyecto, hay que revisar la licencia de Club GreenSock — no aplica al alcance de este componente, pero vale dejarlo anotado.
- El layout depende de medir `window.innerWidth`/`innerHeight` en el cliente (igual que el pen); en Next.js esto debe ir dentro de `useGSAP`/`useEffect`, nunca en el cuerpo del componente, para no romper el render en el servidor.

---

*Documento preparado por zipnegocios para Contigo Constructions. Referencia de origen: pen "Timed Cards Opening" (CodePen, dilums), inspirado en el shot de Dribbble de Giulio Cuscito — usado aquí únicamente como referencia de mecanismo de animación, no como activo final.*
