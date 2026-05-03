import { type CandidateItem, type Issue, sources } from "@agents-weekly/shared";
import {
	latestIndexKey,
	latestIssuesIndexKey,
	maxStoredCandidates,
	maxStoredIssues,
} from "./constants";
import { crawlSource } from "./crawler";
import {
	buildWeeklyIssue,
	clampLimit,
	corsPreflight,
	dedupeCandidates,
	isCorsRoute,
	json,
	sortCandidates,
} from "./utils";

type CrawlerEnv = Env & {
	CANDIDATES_KV: KVNamespace;
};

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		if (request.method === "OPTIONS" && isCorsRoute(url.pathname)) {
			return corsPreflight(request);
		}

		if (url.pathname === "/news") {
			const limit = clampLimit(url.searchParams.get("limit"));
			const items = await readLatestCandidates(env as CrawlerEnv, limit);
			return json(request, { items, generatedAt: new Date().toISOString() });
		}

		if (url.pathname === "/issues") {
			return json(request, {
				items: await readIssues(env as CrawlerEnv),
				generatedAt: new Date().toISOString(),
			});
		}

		const issueMatch = url.pathname.match(/^\/issues\/([^/]+)$/);
		if (issueMatch) {
			const slug = decodeURIComponent(issueMatch[1]);
			const issue = await readIssueBySlug(env as CrawlerEnv, slug);
			if (!issue) {
				return json(request, { error: "Issue not found" }, 404);
			}

			return json(request, {
				item: issue,
				generatedAt: new Date().toISOString(),
			});
		}

		if (url.pathname === "/__scheduled") {
			const items = await crawlAndStore(env as CrawlerEnv);
			return json(request, { stored: items.length, generatedAt: new Date().toISOString() });
		}

		return json(
			request,
			{
				name: "agents-weekly-crawler",
				endpoints: ["/news", "/issues", "/issues/:slug", "/__scheduled"],
			},
			200,
		);
	},

	async scheduled(event, env, ctx): Promise<void> {
		ctx.waitUntil(
			crawlAndStore(env as CrawlerEnv, new Date(event.scheduledTime)).then((items) => {
				console.log(`cron ${event.cron} stored ${items.length} candidates`);
			}),
		);
	},
} satisfies ExportedHandler<CrawlerEnv>;

async function crawlAndStore(
	env: CrawlerEnv,
	generatedAt = new Date(),
): Promise<CandidateItem[]> {
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
	if (merged.length > 0) {
		await storeWeeklyIssue(env, buildWeeklyIssue(merged, generatedAt));
	}

	return merged;
}

async function storeWeeklyIssue(env: CrawlerEnv, issue: Issue): Promise<void> {
	const existingSlugs = (await env.CANDIDATES_KV.get<string[]>(latestIssuesIndexKey, "json")) ?? [];
	const slugs = [issue.slug, ...existingSlugs.filter((slug) => slug !== issue.slug)].slice(
		0,
		maxStoredIssues,
	);

	await env.CANDIDATES_KV.put(`issue:${issue.slug}`, JSON.stringify(issue));
	await env.CANDIDATES_KV.put(latestIssuesIndexKey, JSON.stringify(slugs));
}

async function readIssues(env: CrawlerEnv): Promise<Issue[]> {
	const generatedSlugs = (await env.CANDIDATES_KV.get<string[]>(latestIssuesIndexKey, "json")) ?? [];
	const generatedIssues = await Promise.all(
		generatedSlugs.map((slug) => env.CANDIDATES_KV.get<Issue>(`issue:${slug}`, "json")),
	);
	const issues = generatedIssues.filter((issue): issue is Issue => Boolean(issue));
	const bySlug = new Map<string, Issue>();

	for (const issue of issues) {
		if (!bySlug.has(issue.slug)) {
			bySlug.set(issue.slug, issue);
		}
	}

	return [...bySlug.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

async function readIssueBySlug(env: CrawlerEnv, slug: string): Promise<Issue | undefined> {
	return (await env.CANDIDATES_KV.get<Issue>(`issue:${slug}`, "json")) ?? undefined;
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
