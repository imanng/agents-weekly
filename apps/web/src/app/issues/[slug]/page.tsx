import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllIssues,
  getIssueBySlug,
  getOrderedIssueSections,
  getSectionTitle,
} from "@/lib/issues";
import {
  absoluteUrl,
  canonicalPath,
  defaultDescription,
  defaultImage,
  siteName,
} from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

export async function generateStaticParams() {
  const issues = await getAllIssues();
  return issues.map((issue) => ({ slug: issue.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const issue = await getIssueBySlug(slug);
  const path = canonicalPath(`/issues/${slug}`);

  if (!issue) {
    return {
      title: siteName,
      description: defaultDescription,
      alternates: {
        canonical: path,
      },
    };
  }

  return {
    title: issue.title,
    description: issue.summary,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: `${issue.title} | ${siteName}`,
      description: issue.summary,
      url: path,
      siteName,
      images: [defaultImage],
      type: "article",
      publishedTime: issue.publishedAt,
    },
    twitter: {
      title: `${issue.title} | ${siteName}`,
      description: issue.summary,
      images: [defaultImage.url],
    },
  };
}

export default async function IssuePage({ params }: Props) {
  const { slug } = await params;
  const issue = await getIssueBySlug(slug);

  if (!issue) {
    notFound();
  }

  const issueUrl = absoluteUrl(`/issues/${issue.slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: issue.title,
    description: issue.summary,
    datePublished: issue.publishedAt,
    dateModified: issue.publishedAt,
    url: issueUrl,
    mainEntityOfPage: issueUrl,
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(defaultImage.url),
      },
    },
    image: [absoluteUrl(defaultImage.url)],
  };

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12 md:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="border-b border-[#d9d4c8] pb-8">
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-[#a25c24]">
          <Link className="underline-offset-4 hover:underline" href="/">
            Agents Weekly
          </Link>
          <Link className="underline-offset-4 hover:underline" href="/archive">
            Archive
          </Link>
        </div>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-[#67736e]">
          Issue #{issue.issueNumber} / {formatDate(issue.publishedAt)}
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
          {issue.title}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#5f6a64]">
          {issue.summary}
        </p>
      </header>

      <div className="py-8">
        {getOrderedIssueSections(issue.sections).map(([section, items]) => {
          if (items.length === 0) return null;

          return (
            <section
              className="border-b border-[#ded8ca] py-8 last:border-b-0"
              key={section}
            >
              <h2 className="text-2xl font-semibold">
                {getSectionTitle(section)}
              </h2>
              <div className="mt-5 space-y-5">
                {items.map((item) => (
                  <article className="rounded-lg bg-white p-5" key={item.url}>
                    <a
                      className="text-xl font-semibold text-[#173f35] underline-offset-4 hover:underline"
                      href={item.url}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {item.title}
                    </a>
                    <p className="mt-2 text-sm font-semibold text-[#67736e]">
                      {item.source}
                    </p>
                    <p className="mt-3 leading-7 text-[#4e5954] line-clamp-5">
                      {item.commentary}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
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
