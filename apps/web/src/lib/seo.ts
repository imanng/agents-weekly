export const siteName = "Agents Weekly";

export const defaultDescription =
  "A curated weekly briefing on AI agents, tools, engineering blogs, and research.";

export const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL || "https://agents-weekly.anng.dev",
);

export const defaultImagePath = "/brand/agents-weekly-logo-mark-512.png";

export const defaultImage = {
  url: defaultImagePath,
  width: 512,
  height: 512,
  alt: `${siteName} logo mark`,
};

export function absoluteUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, siteUrl).toString();
}

export function canonicalPath(path = "/"): string {
  if (path === "/") return "/";
  return `/${path.replace(/^\/+|\/+$/g, "")}`;
}

function normalizeSiteUrl(value: string): string {
  return value.replace(/\/+$/, "");
}
