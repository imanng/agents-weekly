# Software Requirements Specification: Agents Weekly

## Overview
Agents Weekly is a curated newsletter and website focused on AI agents, tools, engineering blogs, and research. The product will use a static Next.js frontend deployed on Cloudflare Pages and a separate Cloudflare Worker crawler that runs on a schedule, gathers candidate links from approved sources, and stores normalized metadata in Workers KV for editorial review.[cite:85][cite:69][cite:101]

The goal is to keep the public website simple, fast, and inexpensive while using lightweight automation for discovery. Static Next.js export is supported on Cloudflare Pages through the `out` directory, and Cloudflare Workers support scheduled jobs through Cron Triggers with KV bindings for cached storage.[cite:85][cite:69][cite:101]

## Goals
The system should support a weekly editorial workflow for publishing curated issues containing news, tools, blog posts, and research links related to AI agents. The newsletter should feel selective and editorial rather than fully automated, so the crawler is used for discovery while humans choose the final issue content.[cite:69][cite:112]

Primary goals:
- Publish a fast public website with homepage, archive, issue pages, and an about page.[cite:85]
- Keep hosting and infrastructure low-cost by using Cloudflare Pages, Cloudflare Workers, and Workers KV.[cite:85][cite:69][cite:101]
- Track official blogs, personal builder blogs, Hacker News, Reddit, and release sources for candidate links.[cite:29][cite:32][cite:113][cite:120]
- Support manual curation from a normalized candidate pool rather than auto-publishing directly from community feeds.[cite:112][cite:116]

## Scope
### In scope
- Static website built with Next.js App Router and exported for Cloudflare Pages.[cite:85]
- Issue archive and individual issue pages stored as local markdown or JSON content in the repository.[cite:85]
- Worker-based crawler with scheduled execution using Cron Triggers.[cite:69]
- Source ingestion from RSS, public JSON endpoints, selected static HTML pages, Hacker News, and Reddit where publicly available.[cite:69][cite:113][cite:120]
- Normalization, deduplication, scoring, and caching of candidate links in Workers KV.[cite:101]

### Out of scope for v1
- Full dynamic SSR frontend on Cloudflare Workers.[cite:85]
- Fully automated issue generation and publication without human review.
- Heavy browser automation or headless scraping.
- Subscriber billing, advanced personalization, or recommendation engines.

## Users
### Primary user
The primary internal user is the editor or small editorial team responsible for reviewing discovered links and selecting items for publication.

### External users
External users are readers who visit the public site to browse current and past issues and subscribe through an external email platform such as beehiiv. Beehiiv’s pricing page describes a free Launch plan with up to 2,500 subscribers, unlimited sends, and a website/custom domain option, which makes it suitable for early-stage newsletter delivery.[cite:60]

## Product architecture
The system will be split into two applications:

| Component | Responsibility | Platform |
|---|---|---|
| `apps/web` | Public website, archive, issue pages | Next.js static export on Cloudflare Pages [cite:85] |
| `apps/crawler` | Scheduled source ingestion, normalization, KV storage, lightweight JSON API | Cloudflare Workers + Cron Triggers + Workers KV [cite:69][cite:101] |

The frontend should remain static for performance and simplicity, while the crawler performs scheduled discovery independently. This separation reduces operational risk and avoids tying page rendering to live scraping or real-time external fetches.[cite:85][cite:69]

## Functional requirements
### Website
1. The system shall provide a homepage showing the latest issue, value proposition, and signup CTA.
2. The system shall provide an archive page listing past issues.
3. The system shall provide individual issue pages for each published newsletter.
4. The system shall provide an about page describing the newsletter focus and source methodology.
5. The website shall be generated statically using Next.js export and deployed to Cloudflare Pages using the `out` directory.[cite:85]
6. The site shall support a custom domain through Cloudflare Pages configuration.[cite:62]

### Issue content
1. The system shall store issue content in repository-managed files such as markdown or JSON.
2. Each issue shall support sections such as Top story, Tools & launches, Engineering blogs, Research, and Worth your time.
3. Each issue item shall include at least title, destination URL, source name, short commentary, and category.

### Crawler
1. The crawler shall execute on a schedule using Cloudflare Cron Triggers.[cite:69]
2. The crawler shall fetch candidate items from source feeds and public endpoints.
3. The crawler shall support RSS ingestion as the preferred source type.
4. The crawler shall support public JSON ingestion for selected community sources such as Hacker News and Reddit where legally and technically accessible.[cite:113][cite:120]
5. The crawler may parse selected static HTML pages when no feed is available and the source is stable.
6. The crawler shall normalize all discovered items into a shared schema.
7. The crawler shall deduplicate items primarily by canonical URL.
8. The crawler shall assign scores based on source quality, freshness, and discovery signals.
9. The crawler shall store recent normalized items in Workers KV using configured bindings.[cite:101]
10. The crawler shall expose a lightweight endpoint such as `/api/news` for internal review or debugging.

### Discovery sources
The initial tracked source set should include the following classes:
- Official product and engineering blogs such as Cloudflare and Google Cloud.[cite:29][cite:32]
- Builder and essay blogs such as Between the Prompts and similar personal AI engineering sites.[cite:112][cite:108]
- Hacker News public story/item endpoints for technical discovery.[cite:113][cite:116]
- Reddit public JSON or RSS endpoints for subreddit monitoring and domain discovery.[cite:120][cite:114]
- Tool and release sources such as GitHub releases and changelogs.

### Scoring
The crawler should support a scoring model similar to the following:
- Official company blog: +5
- Respected builder blog: +4
- Hacker News traction: +3
- Reddit traction: +2
- Strong keyword match such as `agent`, `Claude Code`, `MCP`, `evals`, `RAG`, `tool use`: +2
- New domain not previously seen: +1

This scoring is intended to prioritize high-signal content while still using community channels as discovery surfaces rather than final publication sources.[cite:112][cite:116][cite:120]

## Data model
A normalized candidate item should use the following structure:

```json
{
  "id": "hash-or-uuid",
  "title": "If Claude Writes the Code...",
  "url": "https://betweentheprompts.com/if-claude-writes-the-code/",
  "source": "Between the Prompts",
  "discoveredVia": ["hackernews", "reddit"],
  "category": "blogs",
  "publishedAt": "2026-05-01T00:00:00Z",
  "summary": "Short extracted or editorial summary.",
  "score": 9
}
```

Required fields:
- `id`
- `title`
- `url`
- `source`
- `category`
- `publishedAt`

Recommended optional fields:
- `summary`
- `discoveredVia`
- `score`
- `author`
- `tags`

## Non-functional requirements
### Performance
The public website shall load as a static site served by Cloudflare Pages. Static export is preferred for speed and operational simplicity on Cloudflare Pages.[cite:85]

### Cost
The initial system should remain close to zero infrastructure cost other than the domain name by using Cloudflare Pages, Cloudflare Workers, and Workers KV within free-tier limits where possible.[cite:85][cite:69][cite:101]

### Reliability
The crawler should fetch a limited set of trusted sources several times per day instead of scraping continuously, reducing rate-limit and stability risks. Cron Triggers are intended for periodic jobs rather than high-frequency polling.[cite:69]

### Maintainability
The repo should be organized as a monorepo with separate web and crawler applications and optional shared packages for types and source definitions.

### Editorial quality
The system shall support human curation as a mandatory final step before publishing any issue. Community sources such as Hacker News and Reddit shall be treated as discovery channels, not direct final sources of truth.[cite:116][cite:120]

## Security and compliance
The crawler shall only use public, legally accessible feeds, endpoints, and pages. It shall avoid authenticated scraping, aggressive crawling, and attempts to bypass site protections. Public community endpoints should be used conservatively and only for discovery metadata.[cite:120][cite:114]

External links on the public website should open in a new tab with appropriate rel attributes because Cloudflare-hosted sites often run inside constrained contexts during development and preview flows.[cite:62]

## Deployment requirements
### Frontend deployment
- Framework: Next.js static export.
- Deployment target: Cloudflare Pages.[cite:85]
- Output directory: `out`.[cite:85]
- Recommended configuration: `output: "export"` and unoptimized images for static export workflows.[cite:85][cite:90]

### Crawler deployment
- Runtime: Cloudflare Workers.
- Scheduler: Cron Triggers configured in Wrangler.[cite:69]
- Storage: Workers KV using Wrangler bindings.[cite:101]
- Optional endpoint: `/api/news` for internal review.

## Suggested repository structure
```text
agents-weekly/
  apps/
    web/
      app/
      content/
        issues/
      public/
      next.config.mjs
      package.json
    crawler/
      src/index.ts
      wrangler.toml
      package.json
  packages/
    shared/
      types.ts
      sources.ts
```

## Milestones
### Milestone 1: Brand and website
- Finalize name, domain, and visual identity.
- Build homepage, archive, issue template, and about page.
- Configure static export and deploy to Cloudflare Pages.[cite:85]

### Milestone 2: Basic crawler
- Create Worker project.
- Add KV namespace and binding in Wrangler.[cite:101]
- Add Cron Trigger schedule.[cite:69]
- Ingest RSS from official blogs.
- Save normalized results in KV.

### Milestone 3: Community discovery
- Add Hacker News ingestion using public story/item endpoints.[cite:113][cite:116]
- Add Reddit ingestion using public JSON/RSS endpoints for selected subreddits.[cite:120][cite:114]
- Add source scoring and better deduplication.

### Milestone 4: Editorial tooling
- Add a simple review view or JSON export.
- Add domain-level filters and source allowlist.
- Add category assignment and manual shortlist support.

## Risks
| Risk | Impact | Mitigation |
|---|---|---|
| Over-reliance on community feeds | Low-quality issue selection | Use human review before publishing; score official and builder blogs higher [cite:112][cite:116] |
| Source markup changes | HTML parser breakage | Prefer RSS and public JSON; limit HTML scraping to stable pages [cite:69][cite:120] |
| Excessive scope in v1 | Delayed launch | Start with static site + RSS crawler only [cite:85][cite:69] |
| Crawling instability or rate limits | Missing content | Run crawler only a few times per day and keep source list small initially [cite:69] |

## Acceptance criteria
The v1 system is complete when all of the following are true:
- A static Next.js site is deployed successfully on Cloudflare Pages.[cite:85]
- The site contains homepage, archive, about, and at least one issue page.
- A Cloudflare Worker runs on cron and successfully fetches source content.[cite:69]
- The Worker stores normalized items in Workers KV through a configured binding.[cite:101]
- The editor can review stored items and manually create a curated issue.
- The published issue contains links from a mix of official blogs, builder blogs, and discovery channels.

## Recommended v1 source list
A practical initial source list should include:
- Cloudflare Blog.[cite:29]
- Google Cloud AI resources.[cite:32]
- Between the Prompts and similar builder blogs.[cite:112]
- Hacker News public endpoints.[cite:113][cite:116]
- Reddit AI-related subreddits through public JSON/RSS access.[cite:120][cite:114]

This set is broad enough to produce a differentiated weekly issue without overcomplicating the first release.
