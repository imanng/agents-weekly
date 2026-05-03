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

export const bundledIssues: Issue[] = [
  {
    slug: "welcome-to-agents-weekly",
    issueNumber: 18,
    title: "Agents Weekly #18: The practical agent stack",
    publishedAt: "2026-05-02",
    summary:
      "A first editorial pass across agent infrastructure, coding tools, builder notes, and research threads worth watching.",
    sections: {
      "top-story": [
        {
          title: "Cloudflare Workers as agent infrastructure",
          url: "https://blog.cloudflare.com/",
          source: "Cloudflare Blog",
          commentary:
            "Edge runtimes, queues, and durable storage keep showing up in practical agent systems.",
          category: "top-story",
        },
      ],
      "tools-launches": [
        {
          title: "OpenAI Agents SDK releases",
          url: "https://github.com/openai/openai-agents-python/releases",
          source: "GitHub Releases",
          commentary:
            "Release feeds are a clean way to track agent framework changes without watching social feeds all day.",
          category: "tools-launches",
        },
        {
          title: "Claude Code and local agent workflows",
          url: "https://www.anthropic.com/",
          source: "Anthropic",
          commentary:
            "Coding agents are becoming the clearest wedge for durable agent adoption.",
          category: "tools-launches",
        },
      ],
      "engineering-blogs": [
        {
          title: "Between the Prompts",
          url: "https://betweentheprompts.com/",
          source: "Between the Prompts",
          commentary:
            "Builder essays help separate working agent patterns from launch-week noise.",
          category: "engineering-blogs",
        },
      ],
      research: [
        {
          title: "Tool use, evals, and memory",
          url: "https://arxiv.org/",
          source: "Research watch",
          commentary:
            "The crawler tracks agent-adjacent keywords so research links can enter the candidate pool for review.",
          category: "research",
        },
      ],
      "worth-your-time": [
        {
          title: "Hacker News technical discovery",
          url: "https://news.ycombinator.com/",
          source: "Hacker News",
          commentary:
            "Community traction is useful as a signal, but final inclusion stays editorial.",
          category: "worth-your-time",
        },
      ],
    },
  },
];

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
