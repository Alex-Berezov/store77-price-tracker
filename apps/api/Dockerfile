# ============================================================================
# Multi-stage Dockerfile for NestJS API with Playwright (Chromium)
# Optimized for production with minimal image size
# ============================================================================

# ----------------------------------------------------------------------------
# Stage 1: Dependencies
# Install all dependencies including dev dependencies for building
# ----------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Install build dependencies for native modules and jq for JSON manipulation
RUN apk add --no-cache libc6-compat python3 make g++ jq

# Copy package files for dependency installation (including Prisma schema)
COPY package.json yarn.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/
COPY packages/shared/package.json ./packages/shared/

# Remove packageManager field to use global yarn (v1) and install dependencies
RUN jq 'del(.packageManager)' package.json > temp.json && mv temp.json package.json && \
    yarn install --frozen-lockfile --network-timeout 300000

# ----------------------------------------------------------------------------
# Stage 2: Builder
# Build the TypeScript application and generate Prisma client
# ----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install jq for JSON manipulation
RUN apk add --no-cache jq

# Copy package files
COPY package.json yarn.lock ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Remove packageManager field to use global yarn
RUN jq 'del(.packageManager)' package.json > temp.json && mv temp.json package.json

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Remove packageManager field again (COPY . . overwrites the modified package.json)
RUN jq 'del(.packageManager)' package.json > temp.json && mv temp.json package.json

# Generate Prisma Client (dummy DATABASE_URL - not used for generate, only for client generation)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN yarn workspace api prisma generate

# Build the application
RUN yarn workspace api build

# ----------------------------------------------------------------------------
# Stage 3: Production Runner
# Minimal image with only production dependencies and Playwright
# ----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Install runtime dependencies for Playwright Chromium
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Set Playwright to use system Chromium
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./package.json

# Copy production node_modules
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy Prisma schema and generated client
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Create directory for Playwright browser data
RUN mkdir -p /home/nestjs/.cache && chown -R nestjs:nodejs /home/nestjs

# Switch to non-root user
USER nestjs

# Expose API port
EXPOSE 8080

# Health check - verify API is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${API_PORT:-8080}/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]
