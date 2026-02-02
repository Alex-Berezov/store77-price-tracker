# ============================================================================
# Multi-stage Dockerfile for Next.js Frontend
# Optimized for production with standalone output (~90MB image)
# ============================================================================

# ----------------------------------------------------------------------------
# Stage 1: Dependencies
# Install all dependencies including dev dependencies for building
# ----------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Install libc6-compat for Alpine and jq for JSON manipulation
RUN apk add --no-cache libc6-compat jq

# Copy package files for dependency installation
COPY package.json yarn.lock ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Remove packageManager field to use global yarn (v1) and install dependencies
RUN jq 'del(.packageManager)' package.json > temp.json && mv temp.json package.json && \
    yarn install --frozen-lockfile --network-timeout 300000

# ----------------------------------------------------------------------------
# Stage 2: Builder
# Build the Next.js application with standalone output
# ----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install jq for JSON manipulation
RUN apk add --no-cache jq

# Copy package files
COPY package.json yarn.lock ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Remove packageManager field to use global yarn
RUN jq 'del(.packageManager)' package.json > temp.json && mv temp.json package.json

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Remove packageManager field again (COPY . . overwrites the modified package.json)
RUN jq 'del(.packageManager)' package.json > temp.json && mv temp.json package.json

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build-time API URL (will be overridden at runtime via environment variables)
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build the Next.js application (produces standalone output)
RUN yarn workspace web build

# ----------------------------------------------------------------------------
# Stage 3: Production Runner
# Minimal image with only Next.js standalone bundle
# ----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Install curl for health checks and dumb-init for proper signal handling
RUN apk add --no-cache curl dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create .next directory and set ownership
RUN mkdir -p /app/apps/web/.next && chown -R nextjs:nodejs /app

# Copy standalone build output (includes server.js and minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Copy static files (CSS, JS, images generated at build time)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Copy public folder (favicon, images, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Switch to non-root user
USER nextjs

# Expose Next.js port
EXPOSE 3000

# Health check - verify Next.js is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start Next.js server
CMD ["node", "apps/web/server.js"]
