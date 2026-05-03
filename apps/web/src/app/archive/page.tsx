import Link from "next/link";
import { getAllIssues } from "@/lib/issues";

export const metadata = {
  title: "Archive | Agents Weekly",
};

export const revalidate = 3600;

export default async function ArchivePage() {
  const issues = await getAllIssues();

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12 md:px-10">
      <header className="mb-10">
        <Link
          className="text-sm font-semibold text-[#a25c24] underline-offset-4 hover:underline"
          href="/"
        >
          Agents Weekly
        </Link>
        <h1 className="mt-5 text-4xl font-semibold md:text-5xl">Archive</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[#5f6a64]">
          Published editions of the weekly agent briefing, kept intentionally
          compact for scanning and revisiting.
        </p>
      </header>

      <div className="space-y-4">
        {issues.map((issue) => (
          <Link
            className="block rounded-lg border border-[#ded8ca] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#c9b98b]"
            href={`/issues/${issue.slug}`}
            key={issue.slug}
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
              <h2 className="text-2xl font-semibold">{issue.title}</h2>
              <p className="text-sm font-semibold text-[#67736e]">
                {formatDate(issue.publishedAt)}
              </p>
            </div>
            <p className="mt-3 leading-7 text-[#5f6a64]">{issue.summary}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
