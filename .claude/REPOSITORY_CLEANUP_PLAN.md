# Plan de Limpieza y Reorganización del Repositorio

**Fecha**: 16 de Junio 2026  
**Objetivo**: Repositorio limpio, solo archivos productivos + contexto LLM en .claude/

---

## 🚨 PROBLEMA CRÍTICO ENCONTRADO

El `.gitignore` está **mal configurado** (líneas 76-77):

```gitignore
# ❌ INCORRECTO - excluye archivos que DEBEN estar incluidos
.claude
CLAUDE.md
```

Esto causa que:
- ✅ `.claude/` (que acabamos de crear para contexto LLM) sea ignorado por git
- ❌ `CLAUDE.md` (instrucciones críticas del proyecto) sea ignorado

**Impacto**: Si hacemos push, no se subirán los archivos de contexto.

---

## 📋 PLAN DE ACCIÓN COMPLETO

### FASE 1: Corregir .gitignore (CRÍTICO)

**Eliminar líneas problemáticas**:
```gitignore
# ❌ ELIMINAR estas líneas (76-77):
.claude
CLAUDE.md

# ❌ TAMBIÉN REVISAR Y ACTUALIZAR:
# Línea 77 excluye README.md (¿por qué?)
# Líneas 79-110 excluyen muchos archivos blueprint/context (legacy)
```

**Debería ser**:
```gitignore
# ✅ CORRECTO - incluir en git
# (NO incluir .claude ni CLAUDE.md)

# Pero SÍ excluir:
.worktrees           (línea 113) ✅ OK
graphify-out         (línea 73) ✅ OK
```

---

### FASE 2: Reorganizar Documentación (30 minutos)

**Mover a `.claude/docs/` (archivos históricos/referencia)**:
```
CHANGELOG.md                  → .claude/docs/CHANGELOG.md
DESIGN_SYSTEM_HANDOFF.md      → .claude/docs/DESIGN_SYSTEM_HANDOFF.md  
SESSION_CLOSURE_SUMMARY.md    → .claude/docs/SESSION_CLOSURE_SUMMARY.md
```

**Mantener en raíz (críticos para proyecto)**:
```
CLAUDE.md                     ✅ MANTENER (instrucciones IA)
README.md                     ✅ MANTENER (documentación pública)
package.json                  ✅ MANTENER (dependencias)
tsconfig.json                 ✅ MANTENER (TypeScript config)
```

---

### FASE 3: Eliminar/Limpiar Carpetas Innecesarias

**ELIMINAR (sin valor)**:
```
❌ graphify-out/             (output temporal de graphify)
❌ .worktrees/               (git worktrees temporales)
❌ dev.log                   (archivo de log temporal)
❌ .env-templates/.gitkeep   (solo contiene .gitkeep, vacío)
```

**REVISAR (posiblemente NO necesarios)**:
```
⚠️  .next/                   (build output - debe estar en .gitignore ✅)
⚠️  dist/                    (build output - debe estar en .gitignore ✅)
⚠️  docs/                    (contiene superpowers plans - consolidar en .claude/)
```

---

### FASE 4: Carpetas a MANTENER (Productivas)

```
✅ scripts/                  (seed, setup, utilities - NECESARIOS)
✅ src/                      (código fuente)
✅ app/                      (Next.js routes)
✅ public/                   (assets estáticos)
✅ .env-templates/           (solo si tiene templates reales, no solo .gitkeep)
```

---

## 📊 RESULTADO DESEADO

### Raíz Limpia (Solo productivo):
```
contigo-platform/
├── CLAUDE.md                      (instrucciones IA)
├── README.md                      (documentación principal)
├── CHANGELOG.md  ➜ podría mover   (opcional)
├── DESIGN_SYSTEM_HANDOFF.md ➜ podría mover (opcional)
├── SESSION_CLOSURE_SUMMARY.md ➜ podría mover (opcional)
│
├── package.json, package-lock.json
├── tsconfig.json, next.config.ts
├── tailwind.config.js, postcss.config.js
│
├── app/                           (Next.js)
├── src/                           (Código)
├── public/                        (Assets)
├── scripts/                       (Utilidades)
│
├── docker-compose.yml, Dockerfile (si necesarios para dev)
├── .env-templates/                (templates - si tienen contenido)
│
└── .claude/                       (Contexto LLM - DEBE ESTAR EN GIT)
    ├── docs/
    ├── archive/
    ├── memory/
    └── auditorías
```

### .gitignore Correcto:
```gitignore
# Build output
.next/
dist/
node_modules/

# Logs & Temps
*.log
dev.log
.worktrees/
graphify-out/

# Environment
.env
.env.local
.env.*.local

# Credentials
credentials.json
secrets.json

# Editor
.vscode/*
.idea/

# NOTA: .claude/ y CLAUDE.md DEBEN estar en git
# (Necesarios para contexto LLM)
```

---

## ✅ EJECUCIÓN

**Orden de ejecución**:
1. Leer/revisar .gitignore actual
2. Actualizar .gitignore (remover líneas 76-77, revisar legacy)
3. Mover CHANGELOG.md, DESIGN_SYSTEM_HANDOFF.md, SESSION_CLOSURE_SUMMARY.md a .claude/docs/
4. Eliminar graphify-out/, .worktrees/, dev.log
5. Verificar .env-templates/ (eliminar si solo tiene .gitkeep)
6. Commit: "refactor: clean repository and fix gitignore"

**Tiempo total**: 20-30 minutos

---

## 🎯 BENEFICIO FINAL

✅ Repositorio limpio (sin build outputs, logs, temporales)  
✅ .claude/ en git (contexto LLM accesible)  
✅ CLAUDE.md en git (instrucciones persistentes)  
✅ Scripts productivos preservados  
✅ Documentación organizada  
✅ .gitignore correcto  

---

**Status**: 🔴 BLOQUEADOR - .gitignore mal configurado  
**Acción recomendada**: Ejecutar FASE 1 PRIMERO (corregir .gitignore) antes del merge
