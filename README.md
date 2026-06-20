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
docker compose up -d --build
```

This builds the app, runs pending Prisma migrations automatically on
container start, and serves it on port 3000. The SQLite database
(`data/app.db`) and uploaded documents (`data/uploads/`) live in `./data` on
the host, mounted into the container — back up that directory to back up
everything.

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
