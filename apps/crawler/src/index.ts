import {
	type CandidateItem,
	type SourceDefinition,
	getSourceBaseScore,
	hasStrongKeyword,
	scoring,
	sources,
} from "@agents-weekly/shared";

type CrawlerEnv = Env & {
	CANDIDATES_KV: KVNamespace;
};

type RawCandidate = Omit<CandidateItem, "id" | "score"> & {
	score?: number;
};

const latestIndexKey = "candidates:latest";
const maxStoredCandidates = 250;

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		if (url.pathname === "/api/news") {
			const limit = clampLimit(url.searchParams.get("limit"));
			const items = await readLatestCandidates(env as CrawlerEnv, limit);
			return json({ items, generatedAt: new Date().toISOString() });
		}

		if (url.pathname === "/__scheduled") {
			const items = await crawlAndStore(env as CrawlerEnv);
			return json({ stored: items.length, generatedAt: new Date().toISOString() });
		}

		return json(
			{
				name: "agents-weekly-crawler",
				endpoints: ["/api/news", "/__scheduled"],
			},
			200,
		);
	},

	async scheduled(event, env, ctx): Promise<void> {
		ctx.waitUntil(
			crawlAndStore(env as CrawlerEnv).then((items) => {
				console.log(`cron ${event.cron} stored ${items.length} candidates`);
			}),
		);
	},
} satisfies ExportedHandler<CrawlerEnv>;

async function crawlAndStore(env: CrawlerEnv): Promise<CandidateItem[]> {
	const batches = await Promise.allSettled(sources.map((source) => crawlSource(source)));
	const discovered = batches.flatMap((batch) =>
		batch.status === "fulfilled" ? batch.value : [],
	);
	const existing = await readLatestCandidates(env, maxStoredCandidates);
	const merged = dedupeCandidates([...discovered, ...existing])
		.sort(sortCandidates)
		.slice(0, maxStoredCandidates);

	await Promise.all(
		merged.map((item) =>
			env.CANDIDATES_KV.put(`candidate:${item.id}`, JSON.stringify(item), {
				expirationTtl: 60 * 60 * 24 * 45,
			}),
		),
	);
	await env.CANDIDATES_KV.put(
		latestIndexKey,
		JSON.stringify(merged.map((item) => item.id)),
	);

	return merged;
}

async function crawlSource(source: SourceDefinition): Promise<CandidateItem[]> {
	try {
		if (source.kind === "rss") return crawlRss(source);
		if (source.kind === "hackernews") return crawlHackerNews(source);
		if (source.kind === "reddit") return crawlReddit(source);
		if (source.kind === "github") return crawlGithubReleases(source);
		return [];
	} catch (error) {
		console.warn(`source failed: ${source.id}`, error);
		return [];
	}
}

async function crawlRss(source: SourceDefinition): Promise<CandidateItem[]> {
	const text = await fetchText(source.url);
	const entries = [...text.matchAll(/<item\b[\s\S]*?<\/item>/gi)]
		.map((match) => match[0])
		.slice(0, 15);

	return Promise.all(
		entries.map((entry) =>
			normalizeCandidate(source, {
				title: tagValue(entry, "title"),
				url: tagValue(entry, "link") || tagValue(entry, "guid"),
				publishedAt: tagValue(entry, "pubDate") || new Date().toISOString(),
				summary: stripHtml(tagValue(entry, "description")),
			}),
		),
	);
}

async function crawlHackerNews(source: SourceDefinition): Promise<CandidateItem[]> {
	const ids = (await fetchJson<number[]>(source.url)).slice(0, 30);
	const stories = await Promise.all(
		ids.map((id) =>
			fetchJson<{
				title?: string;
				url?: string;
				time?: number;
				score?: number;
				by?: string;
			}>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`),
		),
	);

	return Promise.all(
		stories
			.filter((story) => story.title && story.url)
			.map((story) =>
				normalizeCandidate(source, {
					title: story.title,
					url: story.url,
					publishedAt: story.time
						? new Date(story.time * 1000).toISOString()
						: new Date().toISOString(),
					author: story.by,
					discoveredVia: ["hackernews"],
					scoreBoost: story.score && story.score > 100 ? 1 : 0,
				}),
			),
	);
}

async function crawlReddit(source: SourceDefinition): Promise<CandidateItem[]> {
	const payload = await fetchJson<{
		data?: {
			children?: Array<{
				data?: {
					title?: string;
					url?: string;
					created_utc?: number;
					author?: string;
					selftext?: string;
					score?: number;
				};
			}>;
		};
	}>(source.url);

	return Promise.all(
		(payload.data?.children ?? [])
			.map((child) => child.data)
			.filter((post) => post?.title && post.url)
			.map((post) =>
				normalizeCandidate(source, {
					title: post?.title,
					url: post?.url,
					publishedAt: post?.created_utc
						? new Date(post.created_utc * 1000).toISOString()
						: new Date().toISOString(),
					summary: post?.selftext?.slice(0, 220),
					author: post?.author,
					discoveredVia: ["reddit"],
					scoreBoost: post?.score && post.score > 50 ? 1 : 0,
				}),
			),
	);
}

async function crawlGithubReleases(source: SourceDefinition): Promise<CandidateItem[]> {
	const releases = await fetchJson<
		Array<{
			name?: string;
			tag_name?: string;
			html_url?: string;
			published_at?: string;
			body?: string;
			author?: { login?: string };
		}>
	>(source.url);

	return Promise.all(
		releases
			.filter((release) => release.html_url)
			.map((release) =>
				normalizeCandidate(source, {
					title: release.name || release.tag_name || "Release",
					url: release.html_url,
					publishedAt: release.published_at || new Date().toISOString(),
					summary: stripMarkdown(release.body || "").slice(0, 220),
					author: release.author?.login,
					discoveredVia: ["github"],
				}),
			),
	);
}

async function normalizeCandidate(
	source: SourceDefinition,
	input: {
		title?: string;
		url?: string;
		publishedAt?: string;
		summary?: string;
		author?: string;
		discoveredVia?: string[];
		scoreBoost?: number;
	},
): Promise<CandidateItem> {
	const url = canonicalUrl(input.url || source.url);
	const title = decodeEntities(input.title || url);
	const summary = input.summary ? decodeEntities(input.summary) : undefined;
	const textForScore = `${title} ${summary ?? ""} ${source.tags.join(" ")}`;
	const score =
		getSourceBaseScore(source) +
		(hasStrongKeyword(textForScore) ? scoring.strongKeyword : 0) +
		(input.scoreBoost ?? 0);

	return {
		id: await hashUrl(url),
		title,
		url,
		source: source.name,
		discoveredVia: input.discoveredVia ?? [source.kind],
		category: source.category,
		publishedAt: normalizeDate(input.publishedAt),
		summary,
		score,
		author: input.author,
		tags: source.tags,
	};
}

function dedupeCandidates(items: CandidateItem[]): CandidateItem[] {
	const byUrl = new Map<string, CandidateItem>();

	for (const item of items) {
		const key = canonicalUrl(item.url);
		const existing = byUrl.get(key);
		if (!existing) {
			byUrl.set(key, item);
			continue;
		}

		byUrl.set(key, {
			...existing,
			score: Math.max(existing.score ?? 0, item.score ?? 0),
			discoveredVia: [...new Set([...(existing.discoveredVia ?? []), ...(item.discoveredVia ?? [])])],
			publishedAt:
				item.publishedAt.localeCompare(existing.publishedAt) > 0
					? item.publishedAt
					: existing.publishedAt,
		});
	}

	return [...byUrl.values()];
}

async function readLatestCandidates(
	env: CrawlerEnv,
	limit: number,
): Promise<CandidateItem[]> {
	const ids = await env.CANDIDATES_KV.get<string[]>(latestIndexKey, "json");
	if (!ids) return [];

	const items = await Promise.all(
		ids.slice(0, limit).map((id) => env.CANDIDATES_KV.get<CandidateItem>(`candidate:${id}`, "json")),
	);

	return items.filter((item): item is CandidateItem => Boolean(item));
}

function sortCandidates(a: CandidateItem, b: CandidateItem): number {
	const scoreDelta = (b.score ?? 0) - (a.score ?? 0);
	if (scoreDelta !== 0) return scoreDelta;
	return b.publishedAt.localeCompare(a.publishedAt);
}

async function fetchJson<T>(url: string): Promise<T> {
	const response = await fetch(url, {
		headers: {
			"accept": "application/json",
			"user-agent": "AgentsWeeklyCrawler/0.1 (+https://agents-weekly.example)",
		},
	});
	if (!response.ok) throw new Error(`fetch failed ${response.status}: ${url}`);
	return response.json<T>();
}

async function fetchText(url: string): Promise<string> {
	const response = await fetch(url, {
		headers: {
			"accept": "application/rss+xml, application/xml, text/xml, text/plain",
			"user-agent": "AgentsWeeklyCrawler/0.1 (+https://agents-weekly.example)",
		},
	});
	if (!response.ok) throw new Error(`fetch failed ${response.status}: ${url}`);
	return response.text();
}

function json(payload: unknown, status = 200): Response {
	return new Response(JSON.stringify(payload, null, 2), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store",
		},
	});
}

function tagValue(input: string, tag: string): string | undefined {
	const match = input.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
	return match ? decodeEntities(stripCdata(match[1]).trim()) : undefined;
}

function stripCdata(input: string): string {
	return input.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function stripHtml(input: string | undefined): string | undefined {
	if (!input) return undefined;
	return decodeEntities(input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function stripMarkdown(input: string): string {
	return input.replace(/[`#*_>\-[\]()]/g, " ").replace(/\s+/g, " ").trim();
}

function decodeEntities(input: string): string {
	return input
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.trim();
}

function normalizeDate(input: string | undefined): string {
	if (!input) return new Date().toISOString();
	const date = new Date(input);
	return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function canonicalUrl(input: string): string {
	const url = new URL(input);
	url.hash = "";
	for (const param of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
		url.searchParams.delete(param);
	}
	return url.toString();
}

async function hashUrl(url: string): Promise<string> {
	const data = new TextEncoder().encode(url);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("")
		.slice(0, 24);
}

function clampLimit(value: string | null): number {
	const parsed = Number(value || 50);
	if (!Number.isFinite(parsed)) return 50;
	return Math.max(1, Math.min(100, Math.floor(parsed)));
}
