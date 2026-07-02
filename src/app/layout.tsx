import type { Metadata } from "next";
import localFont from "next/font/local";
import { DM_Serif_Display, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google';
import { ThemeProvider } from "next-themes";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-body',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-instrument',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "LessonCaptain — Interactive Classroom Games",
  description: "Run interactive classroom activities with live leaderboards and AI-generated content",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  ...(process.env.SITE_NOINDEX === "1"
    ? { robots: { index: false, follow: false, nocache: true } }
    : {}),
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lessoncaptain.com";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "LessonCaptain",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/classroom-games?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body
        className={`${dmSerifDisplay.variable} ${sourceSerif.variable} ${ibmPlexMono.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false} storageKey="lc-theme" disableTransitionOnChange={true}>
          <PostHogProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
