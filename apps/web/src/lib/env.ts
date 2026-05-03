export const crawlerApiUrl = trimTrailingSlash(
  process.env.CRAWLER_API_URL || "https://agents-weekly-api.anng.dev",
);

if (!crawlerApiUrl) {
  throw new Error("CRAWLER_API_URL is not set");
}

export const crawlerNewsUrl = `${crawlerApiUrl}/news`;

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
