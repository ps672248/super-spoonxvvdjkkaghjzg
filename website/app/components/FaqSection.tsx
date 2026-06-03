"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Is it really free? No hidden charges?",
    a: "100% free. No in-app purchases, no subscriptions, no ads. The app uses Google's Gemini API with your own free key. Free as long as Google AI Studio stays free — which it has been since 2023.",
  },
  {
    q: "What is a Gemini API key and why do I need it?",
    a: "A free key from Google AI Studio that lets the app generate fresh AI questions. Takes 2 minutes to set up, no billing needed. Go to aistudio.google.com → Get API Key → Create → copy and paste.",
  },
  {
    q: "Why APK and not Play Store?",
    a: "Play Store approval takes time. The APK installs directly in 30 seconds. Enable 'Install unknown apps' in Android settings, install, done.",
  },
  {
    q: "Which engineering branches are supported?",
    a: "Mechanical, Electrical, Civil, Chemical, Electronics, Computer Science and more. Questions generated specifically for your branch — not generic.",
  },
  {
    q: "Will questions repeat across sessions?",
    a: "No. The app tracks every question you've seen and tells Gemini to avoid them. Every session has fresh questions.",
  },
  {
    q: "Does it work offline?",
    a: "Partially. Bookmarked questions and insights are available offline. AI question generation needs internet to call the Gemini API.",
  },
  {
    q: "Is my API key safe?",
    a: "Yes. Stored locally on your device using encrypted secure storage. Never sent to any server — not ours, not anyone's.",
  },
  {
    q: "Which PSUs are covered?",
    a: "HPCL, Coal India, BHEL, ONGC, NTPC, SAIL, IOCL, GAIL, BPCL and more. Interview Simulator available for PSUs with GD/PI rounds like HPCL and BHEL.",
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-12 md:py-20 px-4 bg-[#0F1520]">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 bg-[#FDC003]/10 border border-[#FDC003]/20 rounded-full px-4 py-1.5 mb-4 text-xs text-[#FDC003] font-semibold uppercase tracking-widest">
            FAQ
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white mb-3">
            Everything you wanted to ask.
          </h2>
          <p className="text-gray-500 text-sm md:text-base">
            Tap any question to expand.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-2">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border-[#FDC003]/40 bg-[#0A0E17]"
                    : "border-[#1E2535] bg-[#0A0E17] hover:border-[#FDC003]/20"
                }`}
              >
                <button
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className={`font-semibold text-sm md:text-base transition-colors ${isOpen ? "text-[#FDC003]" : "text-white"}`}>
                    {faq.q}
                  </span>
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200 ${
                      isOpen
                        ? "border-[#FDC003] bg-[#FDC003]/10 text-[#FDC003] rotate-45"
                        : "border-[#1E2535] text-gray-500"
                    }`}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                      <path d="M5 0v10M0 5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5">
                    <div className="h-px bg-[#1E2535] mb-4" />
                    <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <p className="text-center text-gray-600 text-xs mt-8">
          Still have questions?{" "}
          <a
            href="mailto:psyt671248@gmail.com"
            className="text-[#FDC003] underline underline-offset-2"
          >
            Contact us
          </a>
        </p>
      </div>
    </section>
  );
}
