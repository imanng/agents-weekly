export const issueSections = [
  "top-story",
  "tools-launches",
  "engineering-blogs",
  "research",
  "worth-your-time",
] as const;

export const candidateCategories = [
  "news",
  "tools",
  "blogs",
  "research",
  "community",
] as const;

export type IssueSection = (typeof issueSections)[number];
export type CandidateCategory = (typeof candidateCategories)[number];
export type SourceKind = "rss" | "hackernews" | "reddit" | "github";
export type SourceQuality = "official" | "builder" | "community" | "release";

export type IssueItem = {
  title: string;
  url: string;
  source: string;
  commentary: string;
  category: IssueSection;
};

export type Issue = {
  slug: string;
  issueNumber: number;
  title: string;
  publishedAt: string;
  summary: string;
  sections: Record<IssueSection, IssueItem[]>;
};

export type CandidateItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  discoveredVia?: string[];
  category: CandidateCategory;
  publishedAt: string;
  summary?: string;
  score?: number;
  author?: string;
  tags?: string[];
};

export type SourceDefinition = {
  id: string;
  name: string;
  kind: SourceKind;
  quality: SourceQuality;
  url: string;
  category: CandidateCategory;
  tags: string[];
};

export const bundledIssues: Issue[] = [];

export function getBundledIssues(): Issue[] {
  return [...bundledIssues].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getBundledIssueBySlug(slug: string): Issue | undefined {
  return bundledIssues.find((issue) => issue.slug === slug);
}

export const scoring = {
  officialBlog: 5,
  builderBlog: 4,
  hackerNewsTraction: 3,
  redditTraction: 2,
  strongKeyword: 2,
  newDomain: 1,
} as const;

export const strongKeywords = [
  "agent",
  "agents",
  "claude code",
  "mcp",
  "model context protocol",
  "evals",
  "rag",
  "tool use",
  "computer use",
  "workflow automation",
] as const;

export const sources: SourceDefinition[] = [
  {
    id: "cloudflare-blog-ai",
    name: "Cloudflare Blog",
    kind: "rss",
    quality: "official",
    url: "https://blog.cloudflare.com/rss/",
    category: "news",
    tags: ["cloudflare", "infrastructure", "ai"],
  },
  {
    id: "google-cloud-blog-ai",
    name: "Google Cloud Blog",
    kind: "rss",
    quality: "official",
    url: "https://cloudblog.withgoogle.com/rss/",
    category: "news",
    tags: ["google-cloud", "ai"],
  },
  {
    id: "between-the-prompts",
    name: "Between the Prompts",
    kind: "rss",
    quality: "builder",
    url: "https://betweentheprompts.com/rss/",
    category: "blogs",
    tags: ["builder", "agents"],
  },
  {
    id: "hacker-news",
    name: "Hacker News",
    kind: "hackernews",
    quality: "community",
    url: "https://hacker-news.firebaseio.com/v0/topstories.json",
    category: "community",
    tags: ["hn", "technical"],
  },
  {
    id: "reddit-ai-agents",
    name: "Reddit AI Agents",
    kind: "reddit",
    quality: "community",
    url: "https://www.reddit.com/r/AI_Agents/new.json?limit=25",
    category: "community",
    tags: ["reddit", "agents"],
  },
  {
    id: "openai-agents-python",
    name: "OpenAI Agents SDK Releases",
    kind: "github",
    quality: "release",
    url: "https://api.github.com/repos/openai/openai-agents-python/releases?per_page=10",
    category: "tools",
    tags: ["github", "releases", "agents-sdk"],
  },
];

export function getSourceBaseScore(source: SourceDefinition): number {
  if (source.quality === "official") return scoring.officialBlog;
  if (source.quality === "builder") return scoring.builderBlog;
  if (source.kind === "hackernews") return scoring.hackerNewsTraction;
  if (source.kind === "reddit") return scoring.redditTraction;
  return 2;
}

export function hasStrongKeyword(input: string): boolean {
  const normalized = input.toLowerCase();
  return strongKeywords.some((keyword) => normalized.includes(keyword));
}
