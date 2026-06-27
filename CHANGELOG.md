# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/), starting at `0.1.0`.

## [Unreleased]

## [0.1.0] - 2026-06-27

### Added

- Contract and product/warranty tracking with CRUD, list views, and expiry
  badges.
- Reminder notifications via email (SMTP) and push (ntfy) on configurable
  per-item thresholds, plus signed webhook delivery for integrations like
  Home Assistant or an MCP agent.
- Dashboard overview of upcoming expirations.
- Multi-user households with an admin setup flow and Auth.js-based
  authentication.
- Bring-your-own-key AI field extraction (Anthropic, Gemini, or OpenAI) to
  auto-fill contract/product details from an uploaded document; keys are
  encrypted at rest (AES-256-GCM).
- Barcode scanning for product entry.
- Read-only MCP server for querying contracts and products from an LLM.
- Encrypted offsite database backups to S3 and/or SFTP.
- Native iOS wrapper app (Capacitor) with mTLS client-certificate support.
- Self-hosting via Docker / docker-compose, with an nginx + mTLS
  access-lockdown guide.
