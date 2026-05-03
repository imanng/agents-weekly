import type { Metadata } from "next";
import {
  defaultDescription,
  defaultImage,
  siteName,
  siteUrl,
} from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteName,
    description: defaultDescription,
    url: "/",
    siteName,
    images: [defaultImage],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: siteName,
    description: defaultDescription,
    images: [defaultImage.url],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#f8f7f2] text-[#1d2521]">{children}</body>
    </html>
  );
}
