import Link from "next/link";

export const metadata = {
  title: "About | Agents Weekly",
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
          The crawler is used for discovery, not autopublishing. Official blogs
          and builder essays receive more weight than community traction, while
          Hacker News and Reddit help surface links that may deserve a closer
          editorial look.
        </p>
        <p>
          The public site is static by design: fast to load, inexpensive to
          host, and simple enough to keep the editorial workflow focused on the
          issue itself.
        </p>
      </div>
    </main>
  );
}
