import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const APK_URL = "https://aspirantarcade.in/download"; // update with real APK link
const SITE_URL = "https://aspirantarcade.in";
const OG_IMAGE = `${SITE_URL}/og-banner.jpg`;

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#0A0E17] text-white antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
