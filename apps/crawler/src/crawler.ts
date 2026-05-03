import { type CandidateItem, type SourceDefinition } from "@agents-weekly/shared";
import type { GithubRelease, HackerNewsStory, RedditListing } from "./type";
import {
	fetchJson,
	fetchText,
	normalizeCandidate,
	stripHtml,
	stripMarkdown,
	tagValue,
} from "./utils";

export async function crawlSource(source: SourceDefinition): Promise<CandidateItem[]> {
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
			fetchJson<HackerNewsStory>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`),
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
	const payload = await fetchJson<RedditListing>(source.url);

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
	const releases = await fetchJson<GithubRelease[]>(source.url);

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
