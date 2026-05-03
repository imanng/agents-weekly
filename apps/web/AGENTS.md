# Agents Weekly Web Notes

This app is the public Agents Weekly website. It renders the homepage, archive, about page, issue pages, SEO metadata, JSON-LD, sitemap, and robots routes. Runtime issue and candidate data comes from the crawler API.

## Current Architecture

- Framework: Next.js App Router.
- Next version: `16.2.4`.
- React version: `19.2.4`.
- Styling: Tailwind CSS v4 with global theme values in `src/app/globals.css`.
- Deployment: OpenNext for Cloudflare Workers, configured by `open-next.config.ts` and `wrangler.jsonc`.
- Production URL: `https://agents-weekly.anng.dev`.
- Crawler API URL: `CRAWLER_API_URL`, defaulting to `https://agents-weekly-api.anng.dev`.

The old SRS mentions static export and Cloudflare Pages. The live source of truth is the current package scripts and Wrangler/OpenNext config: this app deploys to Cloudflare Workers through OpenNext.

## Important Files

- `src/app/page.tsx`: homepage, latest issue preview, candidate pool preview.
- `src/app/archive/page.tsx`: issue archive.
- `src/app/issues/[slug]/page.tsx`: individual issue page, metadata, JSON-LD.
- `src/app/about/page.tsx`: editorial/about page.
- `src/app/layout.tsx`: root metadata and shell.
- `src/app/sitemap.ts` and `src/app/robots.ts`: SEO routes.
- `src/lib/issues.ts`: crawler API client and issue section presentation helpers.
- `src/lib/env.ts`: crawler API environment handling.
- `src/lib/seo.ts`: canonical URL, site metadata, default social image.
- `public/brand/`: logo assets.
- `wrangler.jsonc`: Cloudflare Worker deployment config and production environment variables.

## Commands

Run from the repo root unless you are already inside `apps/web`.

```bash
pnpm dev:web
pnpm build:web
pnpm lint
pnpm deploy:web
pnpm --filter @agents-weekly/web dev
pnpm --filter @agents-weekly/web build
pnpm --filter @agents-weekly/web lint
pnpm --filter @agents-weekly/web run preview
```

Use `pnpm build:web` before deploy-sensitive changes. Use `pnpm lint` for web-only static checks.

## Data Contract

- Shared types live in `packages/shared/src/index.ts`.
- `getAllIssues()`, `getLatestIssue()`, `getIssueBySlug()`, and `getCandidateItems()` fetch from the crawler API in `src/lib/issues.ts`.
- Crawler responses are cached with Next fetch revalidation for 1 hour.
- Issue section display order and titles are defined in `src/lib/issues.ts`.
- If the crawler returns a missing issue, `src/app/issues/[slug]/page.tsx` should keep using `notFound()`.

Before changing `Issue`, `IssueItem`, `CandidateItem`, source categories, or issue sections, update both the shared package and any affected web rendering code.

## Next.js Notes

This repo uses a newer Next.js version than many agents have memorized. Before changing App Router APIs, metadata behavior, caching/revalidation, route handlers, image behavior, or build/deploy configuration, inspect the installed docs in `node_modules/next/dist/docs/` or current official Next.js docs.

Keep these local conventions:

- Route files use async server components.
- Dynamic route params are typed as promises, for example `params: Promise<{ slug: string }>`.
- Pages export `revalidate = 3600` when backed by crawler data.
- Metadata uses canonical paths plus Open Graph/Twitter data.
- JSON-LD is rendered with `dangerouslySetInnerHTML` from server components.

## Design Notes

- Visual identity is restrained editorial: warm off-white background, deep green, amber accents, simple cards, compact scanning layouts.
- Existing palette appears in `globals.css` and page classes: `#f8f7f2`, `#1d2521`, `#173f35`, `#f5c95f`, `#a25c24`, `#67736e`, `#ded8ca`.
- Keep issue pages readable and newsletter-like. Avoid turning the site into a marketing landing page.
- Use existing logo assets from `public/brand/` instead of inventing new marks.
- External links should open in a new tab with `rel="noreferrer noopener"`.

## Environment

Local defaults are documented in `.env.example`:

```bash
CRAWLER_API_URL=https://agents-weekly-api.anng.dev
NEXT_PUBLIC_SITE_URL=https://agents-weekly.anng.dev
```

Do not commit secrets. Public site URL and crawler URL are safe as plain environment values.

## Verification

For web-only changes, run:

```bash
pnpm lint
pnpm build:web
```

For shared type or data-shape changes, also run:

```bash
pnpm typecheck
```

After significant UI changes, start the app with `pnpm dev:web` and inspect the affected pages at `http://localhost:3000`, especially `/`, `/archive`, `/about`, and one `/issues/{slug}` page when crawler data is available.
