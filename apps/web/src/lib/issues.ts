import fs from "node:fs";
import path from "node:path";
import type { Issue, IssueItem, IssueSection } from "@agents-weekly/shared";

const contentDir = path.join(process.cwd(), "content", "issues");

const sectionByTitle: Record<string, IssueSection> = {
  "top story": "top-story",
  "tools & launches": "tools-launches",
  "tools and launches": "tools-launches",
  "engineering blogs": "engineering-blogs",
  research: "research",
  "worth your time": "worth-your-time",
};

const titleBySection: Record<IssueSection, string> = {
  "top-story": "Top story",
  "tools-launches": "Tools & launches",
  "engineering-blogs": "Engineering blogs",
  research: "Research",
  "worth-your-time": "Worth your time",
};

export function getSectionTitle(section: IssueSection): string {
  return titleBySection[section];
}

export function getAllIssues(): Issue[] {
  if (!fs.existsSync(contentDir)) {
    return [];
  }

  return fs
    .readdirSync(contentDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => parseIssue(fs.readFileSync(path.join(contentDir, file), "utf8")))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getLatestIssue(): Issue | undefined {
  return getAllIssues()[0];
}

export function getIssueBySlug(slug: string): Issue | undefined {
  return getAllIssues().find((issue) => issue.slug === slug);
}

function parseIssue(markdown: string): Issue {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error("Issue markdown must start with frontmatter.");
  }

  const frontmatter = parseFrontmatter(match[1]);
  const sections = emptySections();
  let activeSection: IssueSection | undefined;

  for (const line of match[2].split("\n")) {
    if (line.startsWith("## ")) {
      activeSection = sectionByTitle[line.slice(3).trim().toLowerCase()];
      continue;
    }

    if (!activeSection || !line.startsWith("- [")) {
      continue;
    }

    const item = parseIssueItem(line, activeSection);
    if (item) {
      sections[activeSection].push(item);
    }
  }

  const publishedAt = requireString(frontmatter.publishedAt, "publishedAt");
  const issueNumber = getWeekNumber(publishedAt);

  return {
    slug: requireString(frontmatter.slug, "slug"),
    issueNumber,
    title: formatIssueTitle(requireString(frontmatter.title, "title"), issueNumber),
    publishedAt,
    summary: requireString(frontmatter.summary, "summary"),
    sections,
  };
}

function parseFrontmatter(input: string): Record<string, string> {
  return Object.fromEntries(
    input
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(":");
        if (separator === -1) return [line, ""];
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );
}

function parseIssueItem(line: string, category: IssueSection): IssueItem | undefined {
  const match = line.match(/^- \[(.+)]\((https?:\/\/[^)]+)\) \| (.+) \| (.+)$/);
  if (!match) return undefined;

  return {
    title: match[1].trim(),
    url: match[2].trim(),
    source: match[3].trim(),
    commentary: match[4].trim(),
    category,
  };
}

function emptySections(): Record<IssueSection, IssueItem[]> {
  return {
    "top-story": [],
    "tools-launches": [],
    "engineering-blogs": [],
    research: [],
    "worth-your-time": [],
  };
}

function requireString(value: string | undefined, field: string): string {
  if (!value) {
    throw new Error(`Issue frontmatter is missing ${field}.`);
  }
  return value;
}

function getWeekNumber(value: string): number {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid issue publishedAt date: ${value}.`);
  }

  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatIssueTitle(title: string, issueNumber: number): string {
  const cleanTitle = title
    .replace(/^Agents Weekly\s*#\d+\s*:?\s*/i, "")
    .replace(/^Agents Weekly\s*:?\s*/i, "")
    .trim();

  return cleanTitle
    ? `Agents Weekly #${issueNumber}: ${cleanTitle}`
    : `Agents Weekly #${issueNumber}`;
}
