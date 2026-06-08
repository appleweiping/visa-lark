# VisaLark control-plane — multi-stage build.
# Build context MUST be the repo root (so pnpm workspace deps resolve):
#   docker build -f apps/control-plane/Dockerfile -t visalark-control-plane .
# docker-compose.yml already sets the correct context.
#
# This image holds ZERO visa credentials and never talks to usvisa-info.

# ---------- builder ----------
FROM node:22-slim AS builder
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
# better-sqlite3 is a native addon → needs a C++ toolchain + python at build time.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

# Copy workspace manifests first for better layer caching.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json                 packages/shared/package.json
COPY packages/notify/package.json                 packages/notify/package.json
COPY packages/adapter-usvisa-info/package.json    packages/adapter-usvisa-info/package.json
COPY apps/control-plane/package.json              apps/control-plane/package.json
RUN pnpm install --frozen-lockfile

# Copy sources and build shared deps + the app.
COPY packages ./packages
COPY apps/control-plane ./apps/control-plane
RUN pnpm --filter @visa-lark/shared build \
  && pnpm --filter @visa-lark/notify build \
  && pnpm --filter @visa-lark/control-plane build

# Prune to production deps for the app (keeps the runtime image lean).
RUN pnpm --filter @visa-lark/control-plane --prod deploy /app

# ---------- runtime ----------
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
# `pnpm deploy` produced a self-contained node_modules (incl. compiled better-sqlite3)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
# Persisted SQLite data lives here (mount a volume).
RUN mkdir -p /app/data
ENV PORT=8787
ENV DB_PATH=/app/data/visalark.db
EXPOSE 8787
# Healthcheck hits the public health route (no token needed).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
