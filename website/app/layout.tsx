import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const SITE_URL = "https://aspirant-arcade.xyz";
const OG_IMAGE = "https://cwhpybswvsmoiwzkyhlj.supabase.co/storage/v1/object/public/app-releases/aspirant-arcade/aspirant-arcade-banner.png";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Aspirant Arcade — Free PSU Exam Preparation App for GATE Engineers",
  description:
    "Free PSU exam preparation app for GATE engineers. Available on Android and web. Practice MCQs for BHEL, ONGC, NTPC, IOCL, HPCL, PGCIL with gamified modes — MCQ Blitz, Survival, Syllabus Slasher. AI mock GD and Technical PI interview simulator. No signup required.",
  keywords: [
    "PSU exam preparation free",
    "GATE PSU preparation app",
    "BHEL ET preparation app",
    "ONGC GT mock test free",
    "NTPC interview preparation",
    "IOCL GET preparation",
    "HPCL interview simulator",
    "PSU interview simulator free",
    "AI mock GD PSU preparation",
    "PSU technical PI practice",
    "free PSU MCQ practice",
    "PSU exam app no signup",
    "GATE PSU jobs 2026",
    "PSU group discussion practice",
    "PGCIL HAL BEL preparation",
    "PSU exam app Android free",
    "best PSU preparation app 2026",
  ],
  authors: [{ name: "Aspirant Arcade" }],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Aspirant Arcade — Stop Scrolling. Start Scoring.",
    description:
      "AI-powered PSU prep that feels like a game. BHEL, ONGC, NTPC, HPCL ready. Free on Android and web.",
    siteName: "Aspirant Arcade",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Aspirant Arcade — PSU Exam Prep App" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aspirant Arcade — Stop Scrolling. Start Scoring.",
    description: "AI-powered PSU prep that feels like a game. Free on Android.",
    images: [OG_IMAGE],
  },
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-large.ico", sizes: "48x48" },
    ],
    apple: "/favicon-large.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#0A0E17] text-white antialiased font-sans">
        {children}
        <Analytics />
        <SpeedInsights/>
      </body>
    </html>
  );
}
