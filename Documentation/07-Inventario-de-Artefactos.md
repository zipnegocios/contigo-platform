# 07 — Inventario de Artefactos
**Contigo Constructions Platform · Entrega v1.0**

> Este documento lista **dónde vive** cada artefacto, cuenta y credencial del proyecto — **sin valores**. Gustavo Amarista completa los valores reales en un anexo privado separado antes del traspaso formal de accesos.

---

## 1. Código fuente

| Artefacto | Ubicación | Notas |
|---|---|---|
| Repositorio principal | `github.com/zipnegocios/contigo-platform` | Rama de producción: `main` |
| Rama activa de desarrollo | `main` | `alpha` fue una rama de trabajo ya obsoleta — confirmar si aún existe y si debe eliminarse |

## 2. Dominios y DNS

| Dominio/Subdominio | Uso |
|---|---|
| `contigoconstructions.com.au` | Dominio principal — sitio público |
| `assets.contigoconstructions.com.au` | CDN de assets (bucket R2 `contigo-assets`) |
| `updates.contigoconstructions.com.au` | Subdominio verificado para envío de correo transaccional (Resend) |
| DNS gestionado en | Cloudflare |

## 3. Hosting / Infraestructura

| Servicio | Uso | Cuenta bajo |
|---|---|---|
| Hostinger VPS | Servidor físico/virtual base | ______ (completar) |
| EasyPanel | Panel de gestión de Docker Swarm / despliegue | ______ (completar) |
| Traefik | Reverse proxy interno (viene con EasyPanel, no requiere cuenta propia) | — |
| Cloudflare | DNS, proxy, CDN, rate limiting | ______ (completar) |

## 4. Base de datos

| Artefacto | Notas |
|---|---|
| Instancia PostgreSQL 17 + pgvector | Nombre de contenedor variable en cada reinicio de Swarm — consultar con `docker ps` |
| Nombre de base de datos | `contigo-db` (producción) |
| Backups | ______ (completar — confirmar si EasyPanel gestiona backups automáticos o si se requiere configurar uno externo) |

## 5. Storage — Cloudflare R2

| Bucket | Visibilidad | Cuenta R2 |
|---|---|---|
| `contigo-assets` | Público (CDN) | Account ID: ver `.env` real, no en este documento |
| `contigo-quotes` | Privado (presigned) | Mismo account que arriba |
| Token API R2 | Object Read & Write sobre ambos buckets | ______ (completar quién lo generó y dónde está almacenado) |

## 6. Email — Resend

| Artefacto | Notas |
|---|---|
| Cuenta Resend | ______ (completar) |
| API Key | Almacenada en variable de entorno `RESEND_API_KEY` del panel EasyPanel |
| Dominio verificado | `updates.contigoconstructions.com.au` |

## 7. IA / Embeddings

| Artefacto | Notas |
|---|---|
| Cuenta OpenAI | ______ (completar) |
| API Key | `OPENAI_API_KEY` — usada actualmente solo en write-path de embeddings |

## 8. Autenticación de la aplicación

| Artefacto | Notas |
|---|---|
| `NEXTAUTH_SECRET` | Generado aleatoriamente, único por entorno (dev ≠ prod) |
| Usuario admin inicial | Creado por `seed-admin-prod.mjs` — confirmar post-hardening que ya no usa contraseña fija |

## 9. Variables de entorno — ubicación de configuración real

Todas las variables listadas en el Doc 04 §2 se configuran **directamente en el panel de EasyPanel** para el entorno de producción. El archivo `.env.example` en el repo es solo plantilla de referencia — **nunca debe contener valores reales**.

## 10. Documentación y planes de trabajo (ya en el repo)

| Documento | Ubicación |
|---|---|
| Auditoría técnica base | `AUDIT_REPORT_2026-06-24.md` |
| Instrucciones para Claude Code | `CLAUDE.md` |
| Manuales de "Request a Quote" | `Documentation/` |
| Planes de trabajo ejecutados (work orders) | `docs/superpowers/plans/` |
| Especificaciones de diseño técnico | `docs/superpowers/specs/` |
| Reportes de cierre de fase | `docs/superpowers/reports/` |
| Sistema de diseño (tokens, componentes, motion) | `docs/design-system/` |

## 11. Activos de marca

| Artefacto | Valor |
|---|---|
| Colores | Gold `#E2C063` / `#B8962E`, petrol blue `#0D3C4C`, neutral dark `#1D1D1B`, ivory `#FAF6F0` |
| Tipografía | Alegreya (display), Alegreya Sans (body), Space Grotesk (datos numéricos) |

## 12. Contactos del proyecto

| Rol | Persona |
|---|---|
| Representante del negocio (cliente) | Anamaria Osorio, Daniel Osorio |
| Desarrollo / consultoría | Gustavo Amarista, Johanaly Ramírez (zipnegocios) |

---

**Instrucción de manejo:** este documento es seguro para compartir externamente tal como está (no contiene secretos). El anexo privado con valores reales de credenciales debe transmitirse por un canal separado y seguro (gestor de contraseñas compartido, no email ni chat).
