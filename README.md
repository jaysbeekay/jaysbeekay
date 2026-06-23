# Contracts

A self-hostable web app for tracking personal contracts — rentals, car/home/strata
insurance, subscriptions, loans, and more — with reminders before they expire.

## Features

- Track contracts with provider, dates, cost/billing frequency, renewal type,
  notice period, contact details, and free-form notes
- Attach documents (PDF/images/Word docs) to each contract
- Dashboard with active/expiring/expired counts and estimated monthly spend
- Configurable reminder thresholds per contract (e.g. 30/14/7/1 days before expiry)
- Reminders via email (SMTP) and/or push notifications ([ntfy](https://ntfy.sh))
- Multi-user/household accounts — everyone in the household sees the same contracts
- Admin-invite-only accounts (no public sign-up) since this stores sensitive data
- Mobile-friendly responsive UI, installable as a PWA ("Add to Home Screen")
- SQLite storage — a single file, easy to back up, no separate database service

## Tech stack

Next.js (App Router) + TypeScript, Prisma 7 (SQLite via `@prisma/adapter-libsql`),
NextAuth v5 (credentials + JWT sessions), Tailwind CSS v4, Zod, node-cron.

## Running locally

Requires Node.js 22+.

```bash
npm install
cp .env.example .env
# generate a secret and put it in .env as AUTH_SECRET
openssl rand -base64 32

npx prisma migrate deploy
npm run dev
```

Open <http://localhost:3000> — you'll be sent to `/setup` to create the first
(admin) account. Additional household members can be added from Settings once
you're signed in.

## Self-hosting with Docker

```bash
cp .env.example .env
# edit .env: set AUTH_SECRET (required), and optionally SMTP_*/NTFY_* for reminders
docker compose pull
docker compose up -d
```

This pulls the prebuilt image from
[Docker Hub](https://hub.docker.com/r/jaysbeekay/contracts), runs pending
Prisma migrations automatically on container start, and serves the app on
port 3000. The SQLite database (`data/app.db`) and uploaded documents
(`data/uploads/`) live in `./data` on the host, mounted into the container —
back up that directory to back up everything.

The image is built and pushed to Docker Hub automatically by
[`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml)
on every push to `main` (tagged `latest`) and on `v*` tags. To build from
source instead of pulling, run `docker build -t jaysbeekay/contracts:local .`
and change `image:` in `docker-compose.yml` to that tag.

## Locking down access with nginx + mTLS

Since this app stores sensitive personal/financial data, you can put it
behind nginx with mutual TLS (mTLS): nginx terminates HTTPS and requires
every client to present a certificate signed by your own private CA, so
anyone without an issued certificate is rejected before the request ever
reaches the app — there's no app-level login page to even attack.

An example nginx server block is in
[`deploy/nginx/contracts-mtls.conf.example`](deploy/nginx/contracts-mtls.conf.example).
It expects the app reachable at `127.0.0.1:3000`, so bind the container's
port to localhost only in `docker-compose.yml` rather than publishing it
on all interfaces:

```yaml
    ports:
      - "127.0.0.1:3000:3000"
```

(If nginx runs in a different container/host than Docker, instead put
the app on a shared Docker network and remove the host port mapping
entirely, proxying to the service name instead of `127.0.0.1`.)

**1. Create a private CA** (once) — this signs client certificates, and is
separate from your server's TLS certificate (e.g. from Let's Encrypt):

```bash
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -subj "/CN=Contracts Client CA" -out client-ca.crt
```

Copy `client-ca.crt` to the path referenced by `ssl_client_certificate` in
the nginx config. Keep `ca.key` somewhere safe and offline — it's what
lets you issue new client certificates later.

**2. Issue a client certificate** for each person/device allowed to connect:

```bash
openssl genrsa -out client.key 4096
openssl req -new -key client.key -subj "/CN=your-name" -out client.csr
openssl x509 -req -in client.csr -CA client-ca.crt -CAkey ca.key \
  -CAcreateserial -out client.crt -days 825 -sha256

# Bundle into a .p12 to import into a browser or OS keychain
openssl pkcs12 -export -out client.p12 -inkey client.key -in client.crt \
  -certfile client-ca.crt
```

Import `client.p12` into the browser/device that should have access (it
will prompt for the certificate when visiting the site). Revoking access
for a device is just not reissuing/renewing its certificate, or maintaining
a CRL if you need to revoke before expiry.

**3. Set these env vars** so the app behaves correctly behind a reverse
proxy:

```bash
APP_URL=https://contracts.example.com
AUTH_TRUST_HOST=true   # required so NextAuth trusts the proxied Host header
```

## Querying contracts from an LLM (MCP)

The app can expose a read-only [MCP](https://modelcontextprotocol.io) server
at `/api/mcp` so a local LLM agent — e.g. [Ollama](https://ollama.com) running
a tool-calling model like Hermes — can answer questions about your contracts
in natural language ("what's renewing this month?", "how much am I spending
on insurance?").

It's disabled by default. Set `MCP_TOKEN` in `.env` (any random string, e.g.
from `openssl rand -base64 32`) to enable it — requests must send it as
`Authorization: Bearer <token>`. Leaving it unset makes the endpoint 404,
same as `CRON_SECRET`/`/api/cron`.

The server exposes five tools, all read-only — they never modify data and
never return account credentials or uploaded document file contents (only
document metadata: filename, type, size):

| Tool | Purpose |
| --- | --- |
| `list_contracts` | List contracts, optionally filtered by status and/or category. |
| `get_contract` | Full details for one contract by id, including document metadata. |
| `search_contracts` | Case-insensitive search across title, provider, contract number, and notes. |
| `upcoming_renewals` | Active contracts ending within N days (default 30), soonest first. |
| `spend_summary` | Estimated total and per-category monthly spend across active contracts. |

Point your MCP client at `http://<host>:3000/api/mcp` with the bearer token.
For a tool that speaks MCP-over-HTTP directly, a config block looks like:

```json
{
  "mcpServers": {
    "contracts": {
      "url": "http://<host>:3000/api/mcp",
      "headers": { "Authorization": "Bearer <your MCP_TOKEN>" }
    }
  }
}
```

If your agent only speaks stdio-based MCP servers (common for local
Ollama tool-calling setups), bridge it with
[`mcp-remote`](https://github.com/geelen/mcp-remote) instead:

```json
{
  "mcpServers": {
    "contracts": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://<host>:3000/api/mcp",
        "--header",
        "Authorization: Bearer <your MCP_TOKEN>"
      ]
    }
  }
}
```

Adjust the exact syntax for whatever client/agent you're running — the
endpoint itself is a standard streamable-HTTP MCP server, so anything that
speaks MCP over HTTP (or can be bridged to it) will work.

## Configuration

All configuration is via environment variables — see [`.env.example`](.env.example)
for the full list with defaults. Notable ones:

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | Required. Signs session JWTs. Generate with `openssl rand -base64 32`. |
| `DATABASE_URL` | SQLite file path, e.g. `file:./data/app.db`. |
| `SMTP_HOST` / `SMTP_USER` | Set both to enable email reminders. |
| `NTFY_TOPIC` | Set to enable push reminders via ntfy. |
| `REMINDER_CRON_SCHEDULE` | When the built-in scheduler checks for expiring contracts (cron syntax, default daily at 08:00). |
| `CRON_SECRET` | Optional. If set, enables `POST /api/cron` (with header `x-cron-secret`) so an external scheduler can trigger the check instead of/alongside the built-in one. |
| `AUTH_TRUST_HOST` | Set to `true` when running behind a reverse proxy (e.g. nginx) — see "Locking down access with nginx + mTLS" above. |
| `MCP_TOKEN` | Optional. If set, enables `GET/POST /api/mcp`, a read-only MCP server for querying contracts from an LLM agent — see "Querying contracts from an LLM (MCP)" above. |

If neither email nor ntfy is configured, the scheduler runs but sends nothing
(no errors).

## Notifications

Each contract has its own comma-separated list of reminder thresholds (days
before expiry, default `30,14,7,1`). Once a day (or on whatever schedule you
configure), the app checks all active contracts with an end date and sends a
reminder on each configured channel for the soonest threshold that's been
crossed and not already notified — so adding a contract that's already past
several thresholds only sends one catch-up reminder per channel, not one per
threshold.

## Security notes

- New users can only be created by an existing admin (Settings → Users) —
  there's no public registration, since this app stores sensitive personal
  and financial data.
- Uploaded documents are stored under generated UUID filenames, never the
  user-supplied name, to prevent path traversal.
- Email/ntfy reminder text is sanitized against header injection.

## License

Private/personal project — no license specified.
