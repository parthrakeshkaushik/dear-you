import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { PlatformThemeProvider, platformThemeInitScript } from "@/lib/theme/platform-theme";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
      ? process.env.NEXT_PUBLIC_APP_URL
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://dear-you-wine.vercel.app'
  ),
  title: {
    default: "Dear You",
    template: "%s | Dear You",
  },
  description: "One platform. Unlimited gifts. Every gift tells a different story.",
  applicationName: "Dear You",
  authors: [{ name: "Dear You Team" }],
  generator: "Next.js",
  keywords: [
    "digital gifts",
    "keepsake",
    "memory wall",
    "personalized gift",
    "virtual gift",
    "interactive letter",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dearyou.me",
    siteName: "Dear You",
    title: "Dear You",
    description: "One platform. Unlimited gifts. Every gift tells a different story.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dear You — One platform. Unlimited gifts. Every gift tells a different story.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dear You",
    description: "One platform. Unlimited gifts. Every gift tells a different story.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FAF8F5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: platformThemeInitScript }} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col selection:bg-purple-200 selection:text-purple-900 bg-platform-bg text-platform-text">
        <PlatformThemeProvider defaultTheme="light">
          {children}
        </PlatformThemeProvider>
      </body>
    </html>
  );
}
