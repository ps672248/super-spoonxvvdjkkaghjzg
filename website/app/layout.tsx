import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const SITE_URL = "https://aspirant-arcade.vercel.app";
const OG_IMAGE = "https://cwhpybswvsmoiwzkyhlj.supabase.co/storage/v1/object/public/app-releases/aspirant-arcade/aspirant-arcade-banner.png";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Aspirant Arcade — AI-Powered PSU Exam Prep App",
  description:
    "Gamified PSU exam prep for HPCL, Coal India, BHEL, ONGC & more. AI-generated MCQs, Interview Simulator, Survival mode, Insights dashboard. Free on Android.",
  keywords: [
    "PSU exam app",
    "HPCL GT preparation",
    "Coal India MT CBT app",
    "BHEL ET preparation",
    "ONGC GT mock test",
    "PSU interview simulator",
    "AI MCQ generator PSU",
    "GATE PSU preparation Android",
    "PSU CBT practice app",
    "HPCL interview preparation",
  ],
  authors: [{ name: "Aspirant Arcade" }],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Aspirant Arcade — Stop Scrolling. Start Scoring.",
    description:
      "AI-powered PSU prep that feels like a game. HPCL interview + Coal India CBT ready. Free on Android.",
    siteName: "Aspirant Arcade",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Aspirant Arcade — PSU Exam Prep App" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aspirant Arcade — Stop Scrolling. Start Scoring.",
    description: "AI-powered PSU prep that feels like a game. Free on Android.",
    images: [OG_IMAGE],
  },
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
      </body>
    </html>
  );
}
