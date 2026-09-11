import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocalOps AI | Business operations workspace",
  description: "Explore company knowledge, analyze business data, and approve useful actions. A local-first AI project by Muhammad Bilal.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
