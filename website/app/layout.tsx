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
  title: "Aspirant Arcade — Free PSU & Board Exam Prep App | Class 9–12, GATE, PSU",
  description:
    "Free AI-powered exam prep app for PSU GATE aspirants and Class 9–12 students. Practice MCQs, True/False, and Match challenges across HPCL, BHEL, ONGC, NTPC, CBSE Physics, Chemistry, Maths and more. Play free from our shared question bank — no API key needed.",
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
    "CBSE board exam preparation free",
    "class 9 10 MCQ app",
    "class 11 12 practice app",
    "NCERT MCQ practice free",
    "board exam preparation Android",
    "class 12 physics MCQ",
    "class 10 science practice",
    "NCERT chapter wise MCQ",
    "free board exam app India",
    "class 9 10 11 12 preparation free",
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

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Aspirant Arcade",
  "url": SITE_URL,
  "applicationCategory": "EducationApplication",
  "operatingSystem": "Android, Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
  "description": "Free AI-powered exam prep app for PSU GATE aspirants and Class 9–12 students. Gamified MCQ practice, AI mock GD, Technical PI simulator for HPCL, BHEL, ONGC, NTPC and more. Also covers CBSE/NCERT Class 9–12 subjects. No login required.",
  "featureList": [
    "MCQ Blitz — rapid-fire PSU syllabus questions",
    "Survival Mode — timed CBT simulation with 3 lives",
    "AI Mock GD — group discussion with AI candidates",
    "Technical PI Simulator — AI mock panel interview",
    "Syllabus Slasher — gamified topic mastery",
    "Insights Dashboard — accuracy tracking per topic",
    "Smart Bookmarks — save and annotate tough questions",
    "CBSE/NCERT Chapter-wise MCQ Practice",
    "True/False Challenges (Tsunami mode)",
    "Free Question Bank — no API key needed",
    "Class 9–12 Board Exam Preparation"
  ],
  "audience": {
    "@type": "Audience",
    "audienceType": "Engineering students, GATE aspirants, and Class 9–12 students in India"
  },
  "inLanguage": ["en", "hi"],
  "isAccessibleForFree": true,
  "image": OG_IMAGE,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Aspirant Arcade",
  "url": SITE_URL,
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#0A0E17] text-white antialiased font-sans">
        {children}
        <Analytics />
        <SpeedInsights/>
      </body>
    </html>
  );
}
