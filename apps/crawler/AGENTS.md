# Agents Weekly Crawler Notes

This app is the Cloudflare Worker crawler and JSON API for Agents Weekly. It fetches discovery sources, normalizes candidate links, stores candidates and generated issues in Workers KV, and serves data to `apps/web`.

## Current Architecture

- Runtime: Cloudflare Workers with Wrangler.
- Entry point: `src/index.ts`.
- Shared data contracts and source definitions live in `packages/shared/src/index.ts`.
- KV binding: `CANDIDATES_KV`.
- Production API: `https://agents-weekly-api.anng.dev`.
- Cron schedule in `wrangler.jsonc`: every 6 hours.
- Public endpoints:
  - `GET /news?limit=50` returns recent candidate items.
  - `GET /issues` returns generated weekly issues.
  - `GET /issues/:slug` returns one generated issue.
  - `GET /__scheduled` manually triggers a crawl in development or debugging.

## Important Files

- `src/index.ts`: Worker request routing, scheduled handler, source crawlers, KV reads/writes.
- `src/utils.ts`: normalization, scoring helpers, issue generation, CORS, fetch helpers, date/slug utilities.
- `src/constants.ts`: KV index keys, retention limits, issue numbering baseline, allowed CORS origins.
- `wrangler.jsonc`: Worker name, route, cron trigger, compatibility date, KV binding.
- `worker-configuration.d.ts`: generated Cloudflare binding types.

## Commands

Run from the repo root unless you are already inside `apps/crawler`.

```bash
pnpm dev:crawler
pnpm deploy:crawler
pnpm --filter @agents-weekly/crawler typecheck
pnpm --filter @agents-weekly/crawler run cf-typegen
```

Use `cf-typegen` after changing bindings, environment variables, compatibility flags, or other Wrangler config that affects Worker types.

## Data Flow

1. `scheduled()` or `/__scheduled` calls `crawlAndStore()`.
2. Each source from `@agents-weekly/shared` is crawled by kind: RSS, Hacker News, Reddit, or GitHub releases.
3. Raw items pass through `normalizeCandidate()`, which canonicalizes URLs, hashes IDs, assigns categories, and scores items.
4. New and existing candidates are deduped by canonical URL, sorted by score and recency, then stored as `candidate:{id}` records.
5. The latest candidate ID list is stored under `candidates:latest`.
6. `buildWeeklyIssue()` creates a generated issue from the candidate pool.
7. Issues are stored as `issue:{slug}` and indexed by `issues:latest`.

## Editing Rules

- Keep the shared schema in `packages/shared` synchronized with web consumers before changing candidate or issue shapes.
- Prefer adding or tuning sources in `packages/shared/src/index.ts`; crawler-specific parsing belongs in this app.
- Treat Hacker News and Reddit as discovery signals, not authoritative editorial sources.
- Be conservative with crawl volume. This project intentionally uses a small source list and periodic cron.
- Keep responses JSON-only from the Worker API and maintain CORS support for `apps/web` origins.
- Do not store secrets in `wrangler.jsonc`; use Wrangler secrets for sensitive values.
- Do not remove `nodejs_compat` without checking current Cloudflare and dependency requirements.

## Cloudflare Documentation

Cloudflare Workers APIs and limits change. Before changing Workers, KV, cron triggers, Wrangler config, compatibility flags, routes, or bindings, check current Cloudflare docs:

- Workers: `https://developers.cloudflare.com/workers/`
- Workers limits: `https://developers.cloudflare.com/workers/platform/limits/`
- KV: `https://developers.cloudflare.com/kv/`
- Cron Triggers: `https://developers.cloudflare.com/workers/configuration/cron-triggers/`
- Wrangler config: `https://developers.cloudflare.com/workers/wrangler/configuration/`

If a Cloudflare limit, API, or behavior matters to the change, verify it from the current docs rather than relying on model memory.

## Verification

For crawler-only changes, run:

```bash
pnpm --filter @agents-weekly/crawler typecheck
```

For shared schema/source changes, run from the repo root:

```bash
pnpm typecheck
```

When changing runtime behavior, also start the Worker locally:

```bash
pnpm dev:crawler
```

Then hit `/__scheduled`, `/news`, `/issues`, and any affected endpoint.
