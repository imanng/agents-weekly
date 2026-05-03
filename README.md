# Agents Weekly

Agents Weekly is a curated weekly briefing for people building with AI agents. It tracks product releases, engineering writeups, research, tools, and community discovery surfaces, then turns that raw material into a compact editorial issue.

The project is a small pnpm monorepo with a public Next.js site and a Cloudflare Worker crawler/API.

## Apps

| Package | Purpose |
| --- | --- |
| `apps/web` | Public website with homepage, archive, issue pages, about page, SEO metadata, sitemap, and robots routes. |
| `apps/crawler` | Cloudflare Worker that fetches source feeds, scores candidate links, stores recent candidates/issues in KV, and exposes JSON endpoints. |
| `packages/shared` | Shared issue, candidate, source, scoring, and category types/constants. |

Production URLs:

- Web: `https://agents-weekly.anng.dev`
- Crawler API: `https://agents-weekly-api.anng.dev`

## Tech Stack

- Next.js App Router for the public site
- OpenNext for deploying Next.js to Cloudflare Workers
- Cloudflare Workers, Cron Triggers, and Workers KV for crawling/storage
- pnpm workspaces
- TypeScript

## Getting Started

Install dependencies from the repository root:

```bash
pnpm install
```

Create the web environment file:

```bash
cp apps/web/.env.example apps/web/.env
```

The default values point at the deployed crawler API and production site URL:

```bash
CRAWLER_API_URL=https://agents-weekly-api.anng.dev
NEXT_PUBLIC_SITE_URL=https://agents-weekly.anng.dev
```

Run the web app locally:

```bash
pnpm dev:web
```

Open `http://localhost:3000`.

Run the crawler locally with scheduled-event testing enabled:

```bash
pnpm dev:crawler
```

## Common Commands

```bash
pnpm dev:web        # Start the Next.js web app
pnpm build:web      # Build the web app
pnpm deploy:web     # Build and deploy the web app through OpenNext/Cloudflare
pnpm dev:crawler    # Start the crawler Worker locally
pnpm deploy:crawler # Deploy the crawler Worker
pnpm lint           # Lint the web app
pnpm typecheck      # Typecheck shared + crawler packages
```

## How It Works

The crawler runs on a Cloudflare Cron Trigger every six hours. It reads trusted sources such as official blogs, builder blogs, Hacker News, Reddit, and GitHub releases, normalizes discovered links, scores them, and stores recent candidates in Workers KV.

The web app fetches published issues and candidate data from the crawler API. It caches crawler responses with Next revalidation so pages stay fast while the source data can refresh independently.

Published issues are rendered at `/issues/[slug]`, the archive lives at `/archive`, and the public SEO surface includes canonical URLs, Open Graph/Twitter metadata, JSON-LD, `/robots.txt`, and `/sitemap.xml`.

## Deployment

The web app deploys as a Cloudflare Worker through OpenNext:

```bash
pnpm deploy:web
```

The crawler deploys with Wrangler:

```bash
pnpm deploy:crawler
```

Cloudflare bindings and custom domains are configured in:

- `apps/web/wrangler.jsonc`
- `apps/crawler/wrangler.jsonc`

## Editorial Model

Agents Weekly is intentionally not a fully automated publisher. The crawler is a discovery assistant: it keeps a fresh candidate pool, but final issue selection and commentary remain human-edited.

Community sources are treated as discovery signals, not final authority. Official and high-signal builder sources receive higher scoring weight.
