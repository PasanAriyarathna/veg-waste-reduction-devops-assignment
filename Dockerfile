# ==========================================================
# Dockerfile – Vegetable Wastage Reduction System
# ==========================================================
# Multi-stage build: builder compiles native addons (sqlite3),
# production stage copies only what's needed at runtime.
# Uses npm install (not npm ci) because package-lock.json is
# gitignored and may be absent after a fresh clone.
# ==========================================================

# ---- Stage 1: Builder ----
# Alpine-based for small image size (~5 MB base).
FROM node:18-alpine AS builder

# Build tools needed by node-gyp to compile sqlite3 native addon.
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package.json first for better Docker layer caching.
COPY package.json ./

# Install production dependencies only.
RUN npm install --omit=dev

# Copy application source.
COPY . .

# ---- Stage 2: Production ----
# Fresh Alpine image – no build tools, smaller attack surface.
FROM node:18-alpine AS production

LABEL maintainer="Vegetable Wastage Reduction Team"
LABEL description="Vegetable Wastage Reduction System for Sri Lanka"
LABEL version="1.0.0"

# dumb-init: proper PID 1 signal handling (graceful shutdown).
RUN apk add --no-cache dumb-init

# Non-root user for security.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy pre-built node_modules (with compiled sqlite3) from builder.
COPY --from=builder /app/node_modules ./node_modules

# Copy only the runtime source files.
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend ./frontend
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/doa-api-integration.js ./doa-api-integration.js
COPY --from=builder /app/DOA_API_INTEGRATION.js ./DOA_API_INTEGRATION.js

# Copy entrypoint script and fix Windows CRLF line endings.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

# Create volume mount-point for SQLite persistence; set ownership.
RUN mkdir -p /app/data && chown -R appuser:appgroup /app /app/data

USER appuser
EXPOSE 3000
ENV NODE_ENV=production

# Health check: verify server responds every 30s.
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/districts || exit 1

# dumb-init wraps the entrypoint for proper signal handling.
ENTRYPOINT ["dumb-init", "--", "docker-entrypoint.sh"]
CMD ["node", "backend/server.js"]
