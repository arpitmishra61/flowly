# Flowly — System Design

Flowly is a Zapier-style automation platform: users connect a **trigger**
(e.g. an incoming webhook) to one or more **actions** (send email, create a
GitHub issue, …), and the system executes that chain automatically whenever
the trigger fires. An AI assistant helps users draft actions conversationally.

This document describes the current architecture as implemented, its known
weak points, and a concrete path to scale it. See [AGENTS.md](AGENTS.md) for
day-to-day implementation notes; this file is the higher-level view.

---

## 1. High-level architecture

```
                                 ┌─────────────┐
                     OAuth/HTTP  │   Browser    │
                    ┌───────────┤  (Next.js)   │
                    │           └──────┬───────┘
                    │                  │ REST (apiClient/apiFetch, via
                    │                  │ NEXT_PUBLIC_API_URL, Bearer JWT
                    │                  │ minted from the session per-request)
                    ▼                  ▼
            ┌───────────────┐  ┌───────────────┐        external webhook
            │  Google OAuth │  │   apps/api    │◄──────  source (e.g. a
            │ (NextAuth v5) │  │  (Express)    │         SaaS product)
            └───────────────┘  └───────┬───────┘               │
                                        │ Prisma                │ POST
                                        ▼                       ▼
                                 ┌─────────────┐        ┌───────────────┐
                                 │  Postgres   │◄───────┤  apps/hook    │
                                 │   (Neon)    │  write │  (Express)    │
                                 └──────┬──────┘  ZapRun└───────────────┘
                                        │ poll PENDING
                                        ▼
                                 ┌─────────────┐   produce   ┌──────────┐
                                 │apps/sweeper │────────────►│  Kafka   │
                                 │ (poll loop) │  zap-events │ (1 broker)│
                                 └─────────────┘             └────┬─────┘
                                                                   │ consume
                                                                   ▼
                                                            ┌─────────────┐
                                                            │ apps/worker │
                                                            │ (per-stage  │
                                                            │  executor)  │
                                                            └──────┬──────┘
                                                                   │ Gmail SMTP /
                                                                   │ GitHub API
                                                                   ▼
                                                          external side effects
```

### Services (pnpm workspace, Turborepo)

| App | Role | Runtime |
|---|---|---|
| `apps/web` | Next.js 16 App Router frontend — dashboard, visual zap builder, AI chat, settings, auth pages | Node/Edge (Vercel-style) |
| `apps/api` | Express REST API: CRUD for zaps/triggers/actions, AI chat endpoint, user secrets (Google app password, GitHub PAT) | Node, port 5001 |
| `apps/hook` | Thin webhook receiver — one route, `POST /hooks/catch/:userId/:zapId`, writes a `ZapRun(status=PENDING)` row | Node, port 3002 |
| `apps/sweeper` | Infinite poll loop: every 7s, grabs up to 10 `PENDING` `ZapRun`s, flips them to `RUNNING`, and produces one Kafka message per run (`{zapRunId, stage: 0}`) onto `zap-events` | Node, long-running process |
| `apps/worker` | Kafka consumer group `main-worker-2` on `zap-events`. For each message, loads the `ZapRun` + `Zap` + ordered `Action[]`, executes the action for the current `stage`, merges its result back into `ZapRun.metadata`, and either re-produces `{stage+1}` or marks the run `COMPLETE` | Node, long-running process |

### Shared packages

- `packages/db` — Prisma schema + generated client (`@prisma/adapter-pg` driver adapter over `pg`), single Postgres instance (Neon) shared by every service.
- `packages/kafka` — a `getKafka()` singleton wrapping `kafkajs`.
- `packages/ui`, `eslint-config`, `typescript-config` — shared frontend/tooling.

### Data model (Postgres, see `packages/db/prisma/schema.prisma`)

`User (1) → (N) Zap → (1) Trigger`, `Zap (1) → (N) Action` (ordered by
`sortingOrder`), `Zap (1) → (N) ZapRun`. `AvailableTrigger`/`AvailableAction`
are a small catalog table (Webhook trigger, Gmail/GitHub actions today) with
`*Option` child tables for per-type config fields. `User` also holds
plaintext-ish secrets (`googleSecret` — a Gmail app password, `githubToken` —
a PAT) used by the worker to act on the user's behalf.

### Execution model: staged, at-least-once, single-partition-order pipeline

A zap with N actions runs as **N sequential Kafka round-trips**, not one
worker invocation:

1. `hook` (or, in principle, any trigger source) creates a `ZapRun` in
   `PENDING`.
2. `sweeper` polls Postgres for `PENDING` rows and produces `{stage: 0}`.
3. `worker` consumes, executes action `sortingOrder === stage`, merges the
   action's result into `ZapRun.metadata` under a key named after the action
   type (so a later Gmail step can reference `{github.html_url}` from an
   earlier GitHub step), and produces `{stage: stage + 1}` — or, if it was
   the last stage, marks the run `COMPLETE`.
4. Offsets are committed manually (`autoCommit: false`) only after the stage
   finishes, so a worker crash mid-stage causes Kafka to redeliver that
   message (**at-least-once**, action handlers are not idempotent, so a crash
   between "send email" and "commit offset" can double-send).

This is intentionally simple (poll → queue → consume → requeue) and gives
free retry-via-redelivery semantics, at the cost of the issues in §2.

---

## 2. Known weak points (why this doesn't scale yet)

These are current, verified facts about the code, not hypothetical risks:

1. ~~**No API authentication boundary.**~~ **Resolved for `apps/api`.**
   `apps/api` no longer trusts a client-supplied `userId`/`email`. See §3
   item 1 and `AGENTS.md` §"Service-to-service auth" for the mechanism
   (signed short-lived JWT minted server-side from the NextAuth session,
   verified by `requireAuth` middleware, plus per-zap ownership checks on
   detail/update/delete).
2. **`apps/hook` still has no auth boundary.** The webhook receiver
   (`POST /hooks/catch/:userId/:zapId`) accepts a `userId` straight from the
   URL path with no verification — anyone who can guess/enumerate a `userId`
   can insert a `ZapRun` against another user's zap. Not fixed as part of the
   apps/api hardening (the JWT approach used there assumes the caller is
   `apps/web`, which isn't true for `apps/hook` — the caller is an arbitrary
   external system). Needs its own mechanism (e.g. a per-zap signing
   secret/HMAC) once prioritized.
3. **Polling, not push, at two layers.** `sweeper` polls Postgres every 7s
   for `PENDING` rows regardless of load (fixed cadence → up to 7s of added
   latency per trigger, and constant DB load even when idle). The dashboard
   (`app/page.tsx`) also client-polls via `axios` rather than any push
   mechanism.
4. **Single Kafka broker, no replication.** `docker-compose.yml` runs one
   `apache/kafka` container with `KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1`
   — broker loss = topic loss. No idea of partition count vs. consumer count
   for `zap-events` beyond the default (`KAFKA_NUM_PARTITIONS: 3`), and only
   one `worker` process/consumer is ever run, so partitions 1–2 sit idle.
5. **Action handlers are not idempotent.** `sendMail`/`createIssue` have no
   dedupe key. Combined with at-least-once delivery, a worker crash after
   sending mail but before `commitOffsets` **will** re-send that email on
   redelivery.
6. **No dead-letter path.** If an action throws, there's no visible
   try/catch around the Gmail/GitHub branches in `worker.ts` — an unhandled
   rejection kills stage processing for that message with no retry cap, no
   backoff, and no way to see "this zap run is stuck" from the UI.
7. ~~**Hardcoded service URLs.**~~ **Resolved.** `apps/web` now imports a
   single `API_URL` from `lib/api.ts` (reads `NEXT_PUBLIC_API_URL`, falls
   back to `http://localhost:5001` for local dev) everywhere it previously
   hardcoded the literal string — 10 files updated. Multi-environment deploys
   are now a config change (set `NEXT_PUBLIC_API_URL` per environment in
   Vercel), not a code change.
8. **Secrets stored in plaintext columns.** `User.googleSecret` and
   `User.githubToken` are plain `String?` columns with no field-level
   encryption — a DB dump leaks every connected user's Gmail app password and
   GitHub PAT.
9. **Every service is a Node singleton.** `hook`, `sweeper`, `worker` are
   each a single `node` process with no supervisor beyond Docker's own
   restart policy — no horizontal scaling, no leader election, no graceful
   shutdown/draining logic visible in the code.
10. **`next build`'s pre-existing TypeScript errors are suppressed, not
   fixed.** The build was hard-failing on errors unrelated to auth (see
   `AGENTS.md`), which blocked Vercel deploys entirely. `next.config.js` now
   sets `typescript: { ignoreBuildErrors: true }` so the build succeeds and
   deploys go through — but the underlying type errors (`app/chat/page.tsx`,
   `atoms.ts`, `AutocompleteBox.tsx`, `app-selection-modal.tsx`,
   `GmailAction.tsx`, `Webhook.tsx`) are still there, just non-fatal now.
   This is a deliberate short-term unblock, not a fix — real type safety on
   those files is still owed.
11. **Container resourcing is hand-tuned, not autoscaled.** `docker-compose.yml` pins each service to fixed `cpus`/`mem_limit` (e.g. API capped at 0.2 CPU / 200MB) with no autoscaling group behind it — this is a single-host deployment shape, not a cluster.
12. **`kafka` and `kafka-ui` publish on `0.0.0.0`, not loopback-only.** Both
    bind their host ports (`9092`, `8080`) on all interfaces, including the
    deploy VM's public one. Nothing external is supposed to reach either —
    Caddy only ever routes to `api`/`hook` — so exposure currently depends
    entirely on the cloud firewall (Oracle Cloud Security List/NSG) blocking
    those ports, which Docker's own iptables rules can bypass at the host
    level regardless of `ufw`/`firewalld` state. `kafka-ui` in particular has
    no auth. Recommended, not yet applied: rebind both to
    `"127.0.0.1:<port>:<port>"`.

---

## 3. Improvement scope (near-term, ranked by leverage)

Roughly in the order I'd tackle them — each is scoped independently and
doesn't block the others:

1. ~~**Service-to-service auth (apps/web ↔ apps/api).**~~ Done. `apps/web`
   mints a short-lived signed JWT server-side (from the verified NextAuth
   session, never client input) and sends it as a Bearer token; `apps/api`'s
   `requireAuth` middleware verifies it and derives `userId`/`email` from the
   token only, plus ownership checks on zap detail/update/delete. See
   `AGENTS.md` §"Service-to-service auth" for the full mechanism. **Still
   open: `apps/hook`** — same problem, different shape (caller is an
   external system, not `apps/web`, so this exact JWT approach doesn't
   transfer directly; needs a per-zap signing secret or similar).
2. ~~**Centralize the API base URL.**~~ Done — see §2, weak point 7.
3. **Idempotent action execution.** Give each `(zapRunId, stage)` pair a
   dedupe key (e.g. unique constraint on an `ActionExecution` table keyed by
   `zapRunId + sortingOrder`, checked before calling `sendMail`/
   `createIssue`) so Kafka redelivery can't double-send.
4. **Error handling + dead-letter queue in the worker.** Wrap each action
   branch in try/catch, cap retries (e.g. via a retry count in the Kafka
   message or a `ZapRun.retryCount` column), and route exhausted messages to
   a `zap-events-dlq` topic that's visible somewhere (logs at minimum, a
   "failed runs" UI later).
5. **Fix the `next build` TypeScript errors** (`app/chat/page.tsx`,
   `atoms.ts`, `AutocompleteBox.tsx`, `app-selection-modal.tsx`,
   `GmailAction.tsx`, `Webhook.tsx`) so there's a real production build to
   deploy, not just `next dev`.
6. **Encrypt stored secrets at rest.** `googleSecret`/`githubToken` should be
   encrypted with a KMS-backed key (or at minimum `AES-256` with a key
   outside the DB) before landing in Postgres, decrypted only inside the
   worker process at send-time.
7. **Kafka topic replication + partition-aware consumers.** Bump
   `KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR`/broker count for real durability,
   and run `worker` as a **consumer group** with replica count matching
   partition count so all 3 partitions of `zap-events` actually get consumed
   in parallel.

---

## 4. How to scale

### 4.1 Trigger ingestion (`apps/hook`)

- Stateless by construction (one insert, no local state) — already
  horizontally scalable behind a load balancer. Priority is making sure it's
  actually run as ≥2 replicas in production, not scaling logic changes.
- Add per-user/per-zap rate limiting at this layer (e.g. token bucket keyed
  on `zapId` in Redis) so one noisy webhook source can't flood `ZapRun`
  inserts and starve other users downstream.

### 4.2 Trigger → queue handoff (`apps/sweeper`)

- Replace the fixed 7s poll with either:
  - a Postgres `LISTEN/NOTIFY` on `ZapRun` insert (near-zero latency, no
    wasted polling when idle), or
  - have `apps/hook` **produce directly to Kafka** on webhook receipt and
    drop the sweeper/poll step entirely for the common case, keeping a
    lightweight sweeper only as a safety-net reconciler for rows that
    somehow never got produced (crash between insert and produce).
- Either change removes the sweeper as a scaling bottleneck — right now it's
  a single process doing `take: 10` every 7s, which caps trigger-to-first-
  action latency and throughput regardless of how many workers exist
  downstream.

### 4.3 Queue (Kafka)

- Move from 1 broker to a 3-broker cluster (matches the existing
  `KAFKA_NUM_PARTITIONS: 3` on `zap-events`) with
  `KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3` and
  `min.insync.replicas` ≥ 2, so broker loss doesn't lose in-flight zap runs.
- Partition key `zap-events` by `zapRunId` (or `zapId`) explicitly, not
  round-robin, so **all stages of one run land on the same partition** —
  this preserves per-run ordering (needed today for `stage` sequencing)
  while letting different runs parallelize across partitions/consumers.
- Consider splitting `zap-events` into per-action-type topics
  (`zap-events.gmail`, `zap-events.github`, …) once there are more action
  types than there are worker replicas, so a slow/rate-limited action type
  (e.g. GitHub API 403s) can't head-of-line-block unrelated Gmail stages
  sharing a partition.

### 4.4 Worker fleet

- Run `apps/worker` as a real **consumer group** with replica count equal to
  (or a multiple of) partition count — the code already uses group id
  `main-worker-2` and manual offset commits, so this mostly means deploying
  N replicas rather than 1 and letting Kafka's group rebalancing spread
  partitions across them.
- Split action execution out of the hot consumer loop for slow/external
  calls: `eachMessage` currently blocks on `sendMail`/`createIssue` network
  calls serially per partition. For higher throughput, move to
  `eachBatch` with bounded concurrency per batch, or push the actual
  side-effect call into a short-lived job (e.g. a promise pool) so one slow
  GitHub API response doesn't stall the whole partition.
- Externalize per-provider rate limits (Gmail sending limits, GitHub API
  rate limits) into a token-bucket layer (Redis) shared across all worker
  replicas, so scaling worker count doesn't just mean scaling how fast you
  get rate-limited/banned by the provider.

### 4.5 Database (Postgres/Neon)

- `ZapRun` is the hottest table (every stage transition reads+writes it).
  Add an index on `(status)` for the sweeper's poll query (or drop that
  query entirely per §4.2) and on `(zapId, createdAt)` for the dashboard's
  "list runs" queries.
- Move to Postgres read replicas for the dashboard/list endpoints
  (`GET /api/v1/zap/:pageNo` and friends) once read volume grows, keeping
  writes (worker stage updates, hook inserts) on the primary.
- `ZapRunOutbox` already exists in the schema but the visible code
  (`hook.ts`, `sweeper.ts`, `worker.ts`) never writes to it — either finish
  wiring the transactional-outbox pattern (write `ZapRun` + `ZapRunOutbox`
  in one transaction, have a relay process publish from the outbox to Kafka)
  to get exactly-once produce semantics, or remove the unused table.
- Partition `ZapRun` by `createdAt` (monthly) once run volume is large enough
  that historical runs dominate table size — keeps the hot "recent runs"
  working set small for both the sweeper and dashboard queries.

### 4.6 API (`apps/api`) and web (`apps/web`)

- `apps/api` is stateless Express — scale horizontally behind a load
  balancer; service-to-service auth (§3 item 1) is now in place, so this is
  no longer blocked, no code changes needed for that specifically.
- `apps/web` is a standard Next.js app — deploy to a platform with built-in
  edge/CDN caching (Vercel or equivalent) for static assets and the
  landing/sign-in page; the dashboard/builder are already client-rendered
  behind auth so they don't benefit from SSR caching but do benefit from
  API response caching (e.g. short-TTL cache on `GET /api/v1/zap/:pageNo`).
- Introduce a real API gateway/BFF layer only once there are multiple
  frontend clients (e.g. a future mobile app) — not needed yet with a single
  Next.js consumer.

### 4.7 Observability (currently near-zero)

- Every service logs via bare `console.log` with no structured fields, no
  request IDs, no correlation between a `ZapRun.id` and the Kafka messages
  that processed it. Before scaling out replicas, add:
  - structured logging (JSON) with `zapRunId`/`stage` on every worker log
    line, so logs from N worker replicas can be correlated per run,
  - a metrics pipeline (queue depth on `zap-events`, stage latency, action
    success/failure rate per type) — none of this exists today,
  - alerting on `ZapRun` rows stuck in `RUNNING` past some SLA (currently
    invisible — a crashed worker mid-stage leaves the row `RUNNING` forever
    with nothing surfacing it).

### 4.8 Suggested sequencing

Security/correctness fixes before throughput scaling — running a
broken-idempotency pipeline faster just multiplies duplicate side effects
faster. Rough order:

1. ~~Service-to-service auth, apps/web ↔ apps/api (§3 item 1)~~ Done.
   `apps/hook` auth (§2 weak point 2) is the same class of issue, still open.
2. Idempotent actions + DLQ (§3 items 3–4) — makes retries/redelivery safe
3. Observability basics (§4.7) — needed to safely operate what comes next
4. Kafka replication + partition-aware multi-replica workers (§3 item 7, §4.3, §4.4)
5. Sweeper → push-based trigger handoff (§4.2)
6. DB indexing/read replicas/partitioning (§4.5) as volume actually demands it

---

## 5. Deployment architecture (as currently set up)

Full operational detail (env vars, exact commands, port table) lives in
[DEPLOY.md](DEPLOY.md); this is the shape of it.

Three independently-deployable pieces, none sharing a Docker network:

```
apps/web  ──────────────────────────────────────────────────►  Vercel
                                                                    │
apps/api, hook, worker,        docker-compose.yml (this repo)      │
  sweeper, kafka, kafka-ui  ──► on a VM, ports published to host    │
                                   127.0.0.1 / 0.0.0.0:{5002,3002,   │
                                   9092,8080}                        │
                                        ▲                            │
                                        │ reverse_proxy 127.0.0.1:*  │
                                caddy/  (separate standalone         │
                                compose project, network_mode: host) │
                                        ▲                            │
                                        └──────────── HTTPS ─────────┘
```

- **`apps/web` → Vercel.** Not containerized. Needs `NEXT_PUBLIC_API_URL`
  pointed at the deployed API's public URL, plus `AUTH_URL`/OAuth callback
  registered in Google Cloud Console for the production domain — both must
  reference the same canonical domain (see DEPLOY.md's `www` vs. apex note).
- **Backend stack → `docker-compose.yml`.** One shared multi-stage
  `docker/backend.Dockerfile` (turbo prune → pnpm install → `prisma
  generate` → run via `tsx`) parametrized by `--build-arg APP=<service>`,
  builds `api`/`hook`/`worker`/`sweeper`. Neon Postgres, no DB container.
  Resource limits (`cpus`/`mem_limit`/`mem_reservation`) are hand-set minimal
  per service — sized for a dummy/test-scale workload, not real production
  load (see weak point 11 above).
- **Reverse proxy → `caddy/`, deliberately separate.** Runs as its own
  compose project with `network_mode: host`, reaching the backend stack via
  `127.0.0.1:<published-port>` rather than joining its Docker network or
  resolving container names. This means the backend stack, the proxy, and
  even *other, unrelated* backend stacks on the same VM (e.g. a second
  project's own compose file) can all be redeployed independently without
  any of them needing to know the others exist — the only coupling is "this
  port is published on localhost."
- **CI → `.github/workflows/deploy-backend.yml`.** Push to `main` with
  `paths-ignore: apps/web/**` (frontend deploys separately via Vercel's own
  git integration) SSHes into the VM and runs
  `git reset --hard origin/main && docker compose up -d --build`. The four
  backend `.env` files are gitignored and must exist on the VM already —
  this workflow updates code, not secrets.
- **Prisma client generation** happens in three independent places that all
  need to stay working: `docker/backend.Dockerfile` (explicit `prisma
  generate` step), `packages/db/package.json`'s `postinstall` script (covers
  both Vercel's build and local `pnpm install`), and — now redundantly but
  harmlessly — both at once inside the Docker build.
