# Deploying Flowly

Flowly is deployed as **two independent pieces**, plus a shared reverse proxy.
None of them share a Docker network — they only ever talk to each other over
already-published host ports (or, for the frontend, plain public HTTPS).

```
apps/web            → Vercel (NOT part of this repo's Docker setup)
apps/api, hook,
  worker, sweeper,
  kafka              → this repo's docker-compose.yml, on a VM
caddy/               → separate standalone compose project, same VM,
                        reverse-proxies to this stack AND to other
                        unrelated stacks (e.g. "investo") on the same box
```

## 1. `apps/web` — Vercel

Not deployed via Docker. Deploy normally through Vercel, pointed at this repo.
Required env vars (see `apps/web/.env.local` for local dev values):

- `AUTH_SECRET`, `AUTH_URL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Google OAuth — add the deployed
  callback URL, `https://<domain>/api/auth/callback/google`, in Google Cloud
  Console)
- `NEXT_PUBLIC_API_URL` — the public URL of the deployed `api` service
  (e.g. `https://flowlybackend.devinsight.in/api`, see §3)
- `DATABASE_URL` — same Neon Postgres URL as the backend (NextAuth's
  `PrismaAdapter` runs inside this app's process)

`apps/web` currently has several hardcoded `http://localhost:5001` API base
URLs in addition to `NEXT_PUBLIC_API_URL` — these need to be updated/removed
before pointing production `web` at a deployed backend (tracked as a known
gap in `AGENTS.md`, not fixed as part of this deploy setup).

## 2. Backend stack — `docker-compose.yml` (this repo)

Everything except `web`: `api`, `hook`, `worker`, `sweeper`, plus `kafka` /
`kafka-ui` as internal infra. Built from a single shared multi-stage image,
[`docker/backend.Dockerfile`](docker/backend.Dockerfile), parametrized by
`--build-arg APP=<api|hook|worker|sweeper>` (turbo prune → pnpm install →
`prisma generate` → run via `tsx`, same as local `pnpm dev`).

**Database**: Neon (managed Postgres) — no Postgres container. Each service
reads `DATABASE_URL` from its own `apps/<service>/.env` via `env_file`.

**Kafka**: self-hosted (`apache/kafka:latest`), used only internally between
`worker` (consumer) and `sweeper` (producer) on topic `zap-events`. `api` and
`hook` don't touch Kafka.

### Bring it up

```bash
cd flowly
docker compose up -d --build
```

### Services

| service   | container name  | internal port | published host port | purpose |
|-----------|------------------|----------------|----------------------|---------|
| `kafka`   | `flowly-kafka`   | 9092 (+29092 internal listener) | 9092 | message broker for worker↔sweeper |
| `kafka-ui`| `flowly-kafka-ui`| 8080           | 8080                 | debug UI for the topic above |
| `api`     | `flowly-api`     | 5001           | **5002**             | Express REST API (`/api/v1/...`) — port remapped to avoid a host collision with another stack's service already on 5001 |
| `hook`    | `flowly-hook`    | 3002           | 3002                 | webhook receiver (`POST /hooks/catch/:userId/:zapId`) |
| `worker`  | `flowly-worker`  | — (no HTTP server) | — | consumes `zap-events`, runs zap actions |
| `sweeper` | `flowly-sweeper` | — (no HTTP server) | — | polls DB for pending runs, produces to `zap-events` |

`worker`/`sweeper` are long-running loops with nothing listening on any
port — nothing to expose, nothing for Caddy to route to.

### Env vars per service

Sourced from `apps/<service>/.env` (gitignored, must exist on the deploy
host before `docker compose up`) plus a few set directly in
`docker-compose.yml` for container-to-container wiring:

- **api**: `DATABASE_URL`, `HUGGINGFACE_API_KEY`, `HOOK_ID`, `USER_ID` (from
  `.env`) + `PORT=5001`, `HOOK_URL=http://hook:3002`, `KAFKA_BROKERS=kafka:29092`
- **hook**: `DATABASE_URL`, `HUGGINGFACE_API_KEY`, `HOOK_ID`, `USER_ID` (from
  `.env`) + `PORT=3002`
- **worker** / **sweeper**: `DATABASE_URL` (from `.env`) +
  `KAFKA_BROKERS=kafka:29092`

All four Node services also get `NODE_OPTIONS=--max-old-space-size=128` to
keep V8's heap under their `mem_limit`.

### Resource limits

Sized minimal (dummy/test-scale workload), not for real production load:

| service    | cpus | mem_limit | mem_reservation |
|------------|------|-----------|------------------|
| kafka      | 0.50 | 700m      | 300m             |
| kafka-ui   | 0.20 | 400m      | 150m             |
| api        | 0.20 | 200m      | 100m             |
| hook       | 0.20 | 200m      | 100m             |
| worker     | 0.20 | 200m      | 100m             |
| sweeper    | 0.20 | 200m      | 100m             |
| **total**  | **1.50 vCPU** | **~1.9 GB** | **~850 MB** |

`kafka`/`kafka-ui` need explicit `KAFKA_HEAP_OPTS`/`JAVA_OPTS` alongside
`mem_limit` — their JVM default heaps are larger than these limits and would
get OOM-killed on boot otherwise.

### ⚠ Exposure note

`kafka` (9092) and `kafka-ui` (8080) currently publish on `0.0.0.0`, i.e. all
interfaces including the VM's public one — not just localhost. Nothing
external needs to reach either (Caddy only ever routes to `api`/`hook`), so
whether they're actually safe depends entirely on the VM's cloud firewall
(Oracle Cloud Security List/NSG) blocking those ports — Docker's own
port-publishing can bypass host-level firewalls like `ufw`, so that's not a
safe fallback on its own. `kafka-ui` in particular has no auth. Recommended
hardening (not yet applied): bind both to loopback only —
`"127.0.0.1:9092:9092"` / `"127.0.0.1:8080:8080"` — reachable via SSH tunnel
for debugging, never from the public internet.

## 3. Reverse proxy — `caddy/` (separate compose project)

Deliberately **not** part of `docker-compose.yml` above, and deliberately
**not** on the same Docker network as this backend stack (or any other
stack on the box, e.g. an unrelated `investo` backend that may also be
running on the same VM). It reaches every upstream via `127.0.0.1:<port>` —
the same host-published ports listed in the table above — using
`network_mode: host`. This keeps every stack on the VM independently
deployable: redeploying `flowly`'s backend, or an unrelated stack, never
touches or needs to know about Caddy, and vice versa.

```bash
cd flowly/caddy
docker compose up -d
```

Routes (see [`caddy/Caddyfile`](caddy/Caddyfile)):

- `flowlybackend.devinsight.in/api/*` → `127.0.0.1:5002` (`api`)
- `flowlybackend.devinsight.in/hooks/*` → `127.0.0.1:3002` (`hook`)

DNS for `flowlybackend.devinsight.in` must point at the VM's public IP
before Caddy can issue a TLS cert for it.

If another reverse-proxy stack is already running on the VM and also tries
to bind `80`/`443` (e.g. a `caddy` service embedded in another project's own
compose file), only run **one** of them — two processes can't both bind
those ports on the host.

## Order of operations on a fresh VM

1. `docker compose up -d --build` in `flowly/` (backend stack).
2. Confirm `api` and `hook` respond on `127.0.0.1:5002` / `127.0.0.1:3002`.
3. `docker compose up -d` in `flowly/caddy/` (reverse proxy) — only after
   step 1's ports are actually up, since Caddy proxies to them by host port.
4. Point DNS at the VM, deploy `apps/web` to Vercel with `NEXT_PUBLIC_API_URL`
   set to the public Caddy URL.
