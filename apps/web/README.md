# Agents Weekly Web

This is the public Next.js app for Agents Weekly.

It renders the homepage, archive, about page, issue pages, SEO metadata, JSON-LD, `/robots.txt`, and `/sitemap.xml`. Runtime issue and candidate data comes from the crawler API configured by `CRAWLER_API_URL`.

## Local Development

From the repository root:

```bash
pnpm dev:web
```

Open `http://localhost:3000`.

Environment variables:

```bash
CRAWLER_API_URL=https://agents-weekly-api.anng.dev
NEXT_PUBLIC_SITE_URL=https://agents-weekly.anng.dev
```

## Commands

```bash
pnpm --filter @agents-weekly/web dev
pnpm --filter @agents-weekly/web build
pnpm --filter @agents-weekly/web lint
pnpm --filter @agents-weekly/web run deploy
```

## Deployment

The app deploys to Cloudflare Workers through OpenNext. Configuration lives in `wrangler.jsonc`.

Production URL:

```text
https://agents-weekly.anng.dev
```
