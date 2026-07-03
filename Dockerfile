# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY app ./app
COPY public ./public

# Build Next.js app
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user primero para poder usarlo en las operaciones de copiado
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# 🚨 CORRECCIÓN CLAVE: Copiar los assets asignando la propiedad al usuario no-root
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy scripts and source for runtime operations (también con chown por si acaso)
COPY --chown=nextjs:nodejs scripts ./scripts
COPY --chown=nextjs:nodejs src ./src
COPY --chown=nextjs:nodejs entrypoint.sh ./

# Asegurar que la caché de imágenes tenga la estructura y permisos correctos antes del runtime
RUN mkdir -p /app/.next/cache/images && chown -R nextjs:nodejs /app/.next

# Make entrypoint executable (todavía como root para garantizar permisos del sistema)
RUN chmod +x /app/entrypoint.sh

# Cambiar definitivamente al usuario seguro
USER nextjs

EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

CMD ["/app/entrypoint.sh"]