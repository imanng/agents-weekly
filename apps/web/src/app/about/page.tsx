import Link from "next/link";
import type { Metadata } from "next";
import { defaultImage } from "@/lib/seo";

const description =
  "Learn how Agents Weekly curates AI agent releases, engineering writeups, research, and community discoveries.";

export const metadata: Metadata = {
  title: "About",
  description,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About | Agents Weekly",
    description,
    url: "/about",
    images: [defaultImage],
  },
  twitter: {
    title: "About | Agents Weekly",
    description,
    images: [defaultImage.url],
  },
};

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12 md:px-10">
      <Link
        className="text-sm font-semibold text-[#a25c24] underline-offset-4 hover:underline"
        href="/"
      >
        Agents Weekly
      </Link>
      <h1 className="mt-5 text-4xl font-semibold md:text-5xl">About</h1>
      <div className="mt-8 space-y-6 text-lg leading-8 text-[#4e5954]">
        <p>
          Agents Weekly is a curated briefing for people building with AI
          agents. It tracks product releases, engineering writeups, research,
          and community discovery surfaces, then turns that raw material into a
          human-edited weekly issue.
        </p>
        <p>
          The crawler is the site&apos;s source of truth for published issues
          and discovery data. Official blogs and builder essays receive more
          weight than community traction, while Hacker News and Reddit help
          surface links that may deserve a closer editorial look.
        </p>
        <p>
          The public site uses cached crawler responses so pages stay fast while
          the underlying issue and candidate data can refresh on a schedule.
        </p>
      </div>
    </main>
  );
}
