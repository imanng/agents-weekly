import {
	type CandidateItem,
	type Issue,
	type IssueItem,
	type IssueSection,
	type SourceDefinition,
	getSourceBaseScore,
	hasStrongKeyword,
	issueSections,
	scoring,
} from "@agents-weekly/shared";
import { allowedCorsOrigins, baseIssueNumber, baseIssueWeekStart } from "./constants";

type RawCandidate = Omit<CandidateItem, "id" | "score"> & {
	score?: number;
};

export function buildWeeklyIssue(items: CandidateItem[], generatedAt: Date): Issue {
	const week = getIsoWeek(generatedAt);
	const issueNumber = getIssueNumber(week.weekStart);
	const sections = emptyIssueSections();

	for (const item of items) {
		const section = sectionForCandidate(item);
		if (sections[section].length >= sectionLimit(section)) continue;

		sections[section].push({
			title: item.title,
			url: item.url,
			source: item.source,
			commentary: commentaryForCandidate(item),
			category: section,
		});
	}

	return {
		slug: `agents-weekly-${week.year}-w${String(week.week).padStart(2, "0")}`,
		issueNumber,
		title: `Agents Weekly #${issueNumber}: ${formatIssueWeek(week.weekStart)}`,
		publishedAt: formatDateOnly(week.weekStart),
		summary:
			"A crawler-generated weekly digest of agent infrastructure, tools, engineering writeups, research, and community signals.",
		sections,
	};
}

export async function normalizeCandidate(
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

export function dedupeCandidates(items: CandidateItem[]): CandidateItem[] {
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

export function sortCandidates(a: CandidateItem, b: CandidateItem): number {
	const scoreDelta = (b.score ?? 0) - (a.score ?? 0);
	if (scoreDelta !== 0) return scoreDelta;
	return b.publishedAt.localeCompare(a.publishedAt);
}

export async function fetchJson<T>(url: string): Promise<T> {
	const response = await fetch(url, {
		headers: {
			"accept": "application/json",
			"user-agent": "AgentsWeeklyCrawler/0.1 (+https://agents-weekly.anng.dev)",
		},
	});
	if (!response.ok) throw new Error(`fetch failed ${response.status}: ${url}`);
	return response.json<T>();
}

export async function fetchText(url: string): Promise<string> {
	const response = await fetch(url, {
		headers: {
			"accept": "application/rss+xml, application/xml, text/xml, text/plain",
			"user-agent": "AgentsWeeklyCrawler/0.1 (+https://agents-weekly.anng.dev)",
		},
	});
	if (!response.ok) throw new Error(`fetch failed ${response.status}: ${url}`);
	return response.text();
}

export function json(request: Request, payload: unknown, status = 200): Response {
	return new Response(JSON.stringify(payload, null, 2), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store",
			...corsHeaders(request),
		},
	});
}

export function corsPreflight(request: Request): Response {
	return new Response(null, {
		status: 204,
		headers: {
			...corsHeaders(request),
			"access-control-allow-methods": "GET, OPTIONS",
			"access-control-allow-headers": "content-type",
			"access-control-max-age": "86400",
		},
	});
}

export function isCorsRoute(pathname: string): boolean {
	return pathname === "/news" || pathname === "/issues" || pathname.startsWith("/issues/");
}

export function tagValue(input: string, tag: string): string | undefined {
	const match = input.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
	return match ? decodeEntities(stripCdata(match[1]).trim()) : undefined;
}

export function stripHtml(input: string | undefined): string | undefined {
	if (!input) return undefined;
	return decodeEntities(input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

export function stripMarkdown(input: string): string {
	return input.replace(/[`#*_>\-[\]()]/g, " ").replace(/\s+/g, " ").trim();
}

export function clampLimit(value: string | null): number {
	const parsed = Number(value || 50);
	if (!Number.isFinite(parsed)) return 50;
	return Math.max(1, Math.min(100, Math.floor(parsed)));
}

function emptyIssueSections(): Record<IssueSection, IssueItem[]> {
	const sections = {} as Record<IssueSection, IssueItem[]>;
	for (const section of issueSections) {
		sections[section] = [];
	}
	return sections;
}

function sectionForCandidate(item: CandidateItem): IssueSection {
	if (item.category === "tools") return "tools-launches";
	if (item.category === "blogs") return "engineering-blogs";
	if (item.category === "research") return "research";
	if (item.category === "community") return "worth-your-time";
	return "top-story";
}

function sectionLimit(section: IssueSection): number {
	return section === "top-story" ? 3 : 4;
}

function commentaryForCandidate(item: CandidateItem): string {
	if (item.summary) return item.summary;
	const tags = item.tags?.length ? ` Tagged ${item.tags.join(", ")}.` : "";
	return `Picked up from ${item.source} with a crawler score of ${item.score ?? 0}.${tags}`;
}

function corsHeaders(request: Request): HeadersInit {
	const origin = request.headers.get("origin");
	const headers: Record<string, string> = {
		vary: "Origin",
	};

	if (origin && allowedCorsOrigins.has(origin)) {
		headers["access-control-allow-origin"] = origin;
	}

	return headers;
}

function stripCdata(input: string): string {
	return input.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
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

function getIssueNumber(weekStart: Date): number {
	const diffMs = weekStart.getTime() - baseIssueWeekStart;
	const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
	return baseIssueNumber + diffWeeks;
}

function getIsoWeek(input: Date): { year: number; week: number; weekStart: Date } {
	const date = new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
	const day = date.getUTCDay() || 7;
	date.setUTCDate(date.getUTCDate() + 4 - day);

	const year = date.getUTCFullYear();
	const yearStart = new Date(Date.UTC(year, 0, 1));
	const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
	const weekStart = new Date(date);
	weekStart.setUTCDate(date.getUTCDate() - 3);
	weekStart.setUTCHours(0, 0, 0, 0);

	return { year, week, weekStart };
}

function formatIssueWeek(weekStart: Date): string {
	const weekEnd = new Date(weekStart);
	weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
	const formatter = new Intl.DateTimeFormat("en", {
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});

	return `${formatter.format(weekStart)}-${formatter.format(weekEnd)}`;
}

function formatDateOnly(date: Date): string {
	return date.toISOString().slice(0, 10);
}

async function hashUrl(url: string): Promise<string> {
	const data = new TextEncoder().encode(url);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("")
		.slice(0, 24);
}
