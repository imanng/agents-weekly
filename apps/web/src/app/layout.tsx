import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agents Weekly",
  description:
    "A curated weekly briefing on AI agents, tools, engineering blogs, and research.",
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
