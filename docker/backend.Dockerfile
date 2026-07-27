# Shared Dockerfile for the non-web backend services (api, hook, worker, sweeper).
# Build with --build-arg APP=<api|hook|worker|sweeper>
# These apps have no compiled build step — they run TypeScript directly via tsx,
# same as `pnpm dev` does locally.

FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# ---- prune the monorepo down to just what $APP needs ----
FROM base AS pruner
ARG APP
COPY . .
RUN pnpm dlx turbo prune ${APP} --docker

# ---- install pruned deps + copy pruned source ----
FROM base AS installer
ARG APP
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @repo/db exec prisma generate

# ---- runtime image ----
FROM base AS runner
ARG APP
ENV NODE_ENV=production
RUN addgroup -S flowly && adduser -S flowly -G flowly
COPY --from=installer /app .
USER flowly
WORKDIR /app/apps/${APP}
CMD ["pnpm", "start"]
