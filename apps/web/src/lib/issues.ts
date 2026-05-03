import type {
  CandidateItem,
  Issue,
  IssueItem,
  IssueSection,
} from "@agents-weekly/shared";
import { crawlerApiUrl, crawlerNewsUrl } from "@/lib/env";

const revalidateSeconds = 60 * 60;

type IssuesResponse = {
  items?: Issue[];
};

type IssueResponse = {
  item?: Issue;
};

type CandidatesResponse = {
  items?: CandidateItem[];
};

const titleBySection: Record<IssueSection, string> = {
  "top-story": "Top story",
  "engineering-blogs": "Engineering blogs",
  "worth-your-time": "Worth your time",
  research: "Research",
  "tools-launches": "Tools launches",
};

const orderedSections = Object.keys(titleBySection) as IssueSection[];

export function getSectionTitle(section: IssueSection): string {
  return titleBySection[section];
}

export function getOrderedIssueSections(
  sections: Issue["sections"],
): Array<[IssueSection, IssueItem[]]> {
  return orderedSections.map((section) => [section, sections[section] ?? []]);
}

export async function getAllIssues(): Promise<Issue[]> {
  const response = await fetchJson<IssuesResponse>(`${crawlerApiUrl}/issues`);
  return response.items ?? [];
}

export async function getLatestIssue(): Promise<Issue | undefined> {
  return (await getAllIssues())[0];
}

export async function getIssueBySlug(slug: string): Promise<Issue | undefined> {
  const response = await fetchJson<IssueResponse>(
    `${crawlerApiUrl}/issues/${encodeURIComponent(slug)}`,
    { allowNotFound: true },
  );

  return response.item;
}

export async function getCandidateItems(limit = 6): Promise<CandidateItem[]> {
  const url = new URL(crawlerNewsUrl);
  url.searchParams.set("limit", String(limit));

  const response = await fetchJson<CandidatesResponse>(url.toString());
  return response.items ?? [];
}

async function fetchJson<T>(
  url: string,
  options: { allowNotFound?: boolean } = {},
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
    },
    next: {
      revalidate: revalidateSeconds,
    },
  });

  if (options.allowNotFound && response.status === 404) {
    return {} as T;
  }

  if (!response.ok) {
    throw new Error(`Crawler request failed ${response.status}: ${url}`);
  }

  return response.json() as Promise<T>;
}
