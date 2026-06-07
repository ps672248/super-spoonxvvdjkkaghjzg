"use client";

import { useState } from "react";
import Image from "next/image";

const EMBED_SRC = "https://aspirant-arcade-fwa8.vercel.app/?embed=1";

/**
 * Phone-frame live demo for the hero. The 3.74MB app bundle is NOT loaded until
 * the visitor taps "Try it" — keeping the hero fast. One free AI quiz per IP/24h
 * is enforced server-side by the /api/gemini proxy.
 */
export default function DemoPhone() {
  const [started, setStarted] = useState(false);

  return (
    <div id="live-demo" className="relative w-full max-w-[300px] mx-auto scroll-mt-24">
      {/* glow */}
      <div className="absolute -inset-6 bg-[#FDC003]/10 rounded-[3rem] blur-3xl pointer-events-none" />
      <div className="relative rounded-[2.5rem] border-[10px] border-[#1E2535] bg-[#0A0E17] shadow-2xl overflow-hidden aspect-[9/18]">
        {/* notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#1E2535] rounded-b-2xl z-20" />

        {started ? (
          <iframe
            src={EMBED_SRC}
            title="Aspirant Arcade — Free Quiz Demo"
            className="absolute inset-0 w-full h-full border-0 bg-[#F7F9FC]"
            allow="clipboard-write"
          />
        ) : (
          <button
            onClick={() => setStarted(true)}
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#000666] to-[#0A0E17] group"
            aria-label="Start the free quiz demo"
          >
            <span className="inline-flex items-center gap-1.5 bg-[#FDC003]/10 border border-[#FDC003]/30 rounded-full px-3 py-1 text-[10px] text-[#FDC003] font-bold uppercase tracking-widest">
              ⚡ Live · 1 Free Quiz
            </span>
            <Image src="/logo.png" alt="Aspirant Arcade" width={64} height={64} className="rounded-2xl" />
            <div className="text-white font-black text-lg">
              Aspirant <span className="text-[#FDC003]">Arcade</span>
            </div>
            <div className="flex items-center gap-2.5 bg-[#FDC003] text-[#0A0E17] font-black text-sm px-6 py-3 rounded-2xl group-hover:brightness-110 transition-all">
              <span>▶</span> Tap to Try
            </div>
            <p className="text-gray-400 text-[11px] px-8 text-center">
               No Configuration · No login
            </p>
          </button>
        )}
      </div>

      {/* full-screen escape */}
      <div className="text-center mt-3">
        <a
          href={EMBED_SRC}
          target="_blank"
          rel="noopener"
          className="text-gray-500 hover:text-[#FDC003] text-xs transition-colors"
        >
          Open in a new tab ↗
        </a>
      </div>
    </div>
  );
}
