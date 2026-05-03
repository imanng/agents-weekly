export type HackerNewsStory = {
	title?: string;
	url?: string;
	time?: number;
	score?: number;
	by?: string;
};

export type RedditListing = {
	data?: {
		children?: Array<{
			data?: RedditPost;
		}>;
	};
};

export type RedditPost = {
	title?: string;
	url?: string;
	created_utc?: number;
	author?: string;
	selftext?: string;
	score?: number;
};

export type GithubRelease = {
	name?: string;
	tag_name?: string;
	html_url?: string;
	published_at?: string;
	body?: string;
	author?: { login?: string };
};
