# VisaLark local agent — for power users running 24x7 on their OWN machine.
#
# Run this on your home network, not a cloud VM. Polling usvisa-info from a
# datacenter IP while you logged in from home can look like account takeover
# and get the visa account restricted (DESIGN.md §1). The agent checks its
# public IP and refuses to start on a detected cloud network by default.
FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/agent ./apps/agent
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter "@visa-lark/shared" --filter "@visa-lark/adapter-usvisa-info" --filter "@visa-lark/notify" build \
 && pnpm --filter "@visa-lark/agent" build

FROM node:22-slim
WORKDIR /app
RUN corepack enable
COPY --from=build /app /app
WORKDIR /app/apps/agent
# Config is mounted at runtime: docker run -v $PWD/visalark.config.json:/app/apps/agent/visalark.config.json
CMD ["node", "dist/index.js"]
