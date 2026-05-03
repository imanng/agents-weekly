import Link from "next/link";
import Image from "next/image";
import { getLatestIssue, getSectionTitle } from "@/lib/issues";

const signupUrl = "https://www.beehiiv.com/";

export default function Home() {
  const issue = getLatestIssue();

  return (
    <main>
      <section className="border-b border-[#d9d4c8] bg-[#173f35] text-[#f8f7f2]">
        <div className="mx-auto grid min-h-[78vh] max-w-6xl content-end gap-12 px-6 pb-12 pt-10 md:grid-cols-[1.1fr_0.9fr] md:px-10">
          <div className="flex flex-col justify-end gap-7">
            <div className="flex items-center gap-4">
              <Image
                alt=""
                className="h-14 w-14"
                height={112}
                priority
                src="/brand/agents-weekly-logo-mark.png"
                width={112}
              />
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f5c95f]">
                AI agents, edited weekly
              </p>
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] md:text-7xl">
              Agents Weekly
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[#e4e1d6]">
              A selective briefing for builders tracking agent tools, engineering
              writeups, research, and the infrastructure behind practical AI
              systems.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#f5c95f] px-5 text-sm font-semibold text-[#173f35] transition hover:bg-[#ffd86e]"
                href={signupUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                Subscribe
              </a>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-md border border-[#f8f7f2]/35 px-5 text-sm font-semibold text-[#f8f7f2] transition hover:border-[#f8f7f2]"
                href="/archive"
              >
                Browse archive
              </Link>
            </div>
          </div>

          {issue ? (
            <Link
              href={`/issues/${issue.slug}`}
              className="self-end rounded-lg border border-[#f8f7f2]/20 bg-[#f8f7f2] p-6 text-[#1d2521] shadow-2xl shadow-black/20 transition hover:-translate-y-1"
            >
              <p className="text-sm font-semibold text-[#67736e]">
                Latest issue
              </p>
              <h2 className="mt-3 text-2xl font-semibold">{issue.title}</h2>
              <p className="mt-4 leading-7 text-[#59645f]">{issue.summary}</p>
              <p className="mt-6 text-sm font-semibold text-[#a25c24]">
                Read issue #{issue.issueNumber}
              </p>
            </Link>
          ) : null}
        </div>
      </section>

      {issue ? (
        <section className="mx-auto max-w-6xl px-6 py-14 md:px-10">
          <div className="mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#a25c24]">
                Inside this week
              </p>
              <h2 className="mt-2 text-3xl font-semibold">{issue.title}</h2>
            </div>
            <Link
              className="text-sm font-semibold text-[#173f35] underline-offset-4 hover:underline"
              href={`/issues/${issue.slug}`}
            >
              Open full issue
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(issue.sections).map(([section, items]) => (
              <section
                className="rounded-lg border border-[#ded8ca] bg-white p-5"
                key={section}
              >
                <h3 className="text-lg font-semibold">
                  {getSectionTitle(section as keyof typeof issue.sections)}
                </h3>
                <div className="mt-4 space-y-4">
                  {items.slice(0, 2).map((item) => (
                    <article key={item.url}>
                      <a
                        className="font-semibold text-[#173f35] hover:underline"
                        href={item.url}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {item.title}
                      </a>
                      <p className="mt-1 text-sm leading-6 text-[#5f6a64]">
                        {item.commentary}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
