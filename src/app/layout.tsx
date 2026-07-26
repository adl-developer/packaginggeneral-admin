import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Absolute base for link-preview image URLs. Override per environment.
const adminUrl =
  process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.packaginggeneral.com";

/**
 * The browser-tab and bookmark icons come from Next's file conventions —
 * `favicon.ico`, `icon.png` and `apple-icon.png` sit alongside this file and are
 * the exact same bytes as the storefront's, so both apps show one PG mark.
 * Don't add an `icons` key here; the files are picked up automatically.
 */
export const metadata: Metadata = {
  metadataBase: new URL(adminUrl),
  title: {
    default: "Admin Dashboard | Packaging General",
    template: "%s | Packaging General Admin",
  },
  description: "Internal operations portal for Packaging General.",
  applicationName: "Packaging General Admin",
  // Internal tool — must never be indexed.
  robots: { index: false, follow: false, nocache: true },
  // So a link pasted into chat/messages shows the PG logo, as the storefront does.
  openGraph: {
    type: "website",
    siteName: "Packaging General Admin",
    title: "Admin Dashboard | Packaging General",
    description: "Internal operations portal for Packaging General.",
    url: adminUrl,
    images: [
      { url: "/logo.png", width: 154, height: 188, alt: "Packaging General" },
    ],
  },
  twitter: {
    card: "summary",
    title: "Admin Dashboard | Packaging General",
    description: "Internal operations portal for Packaging General.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-background text-brand">{children}</body>
    </html>
  );
}
