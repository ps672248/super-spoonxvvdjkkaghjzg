import Image from "next/image";
import { AndroidIcon } from "./components/AndroidIcon";

const APK_URL = "https://cwhpybswvsmoiwzkyhlj.supabase.co/storage/v1/object/public/app-releases/aspirant-arcade/aspirant_arcade_1.0.0_mobile.apk";

const FEATURES = [
  { icon: "🎮", title: "6 Game Modes", desc: "MCQ, Survival, Match the Following, Slasher, Mario-style & Interview Simulator. Same PSU syllabus — completely different energy." },
  { icon: "🤖", title: "AI-Generated Questions", desc: "Fresh questions every session calibrated to your specific PSU, branch, and syllabus. Never the same stale bank twice." },
  { icon: "🎤", title: "Interview Simulator", desc: "Mock HPCL/BHEL panel powered by Gemini AI. Branch-specific technical PI + GD topic bank with real topics." },
  { icon: "📊", title: "Insights Dashboard", desc: "See exactly which topics you're weak in. Track accuracy over time. Know where to focus before the examiner tells you." },
  { icon: "🔖", title: "Smart Bookmarks", desc: "Bookmark tough questions mid-game. Add notes. Revisit your personal weak-spot bank anytime." },
  { icon: "⚡", title: "Survival Mode", desc: "Timed MCQs, lose lives on wrong answers. Closest thing to real CBT pressure you'll find on your phone." },
];

const PSUS = ["HPCL", "Coal India", "BHEL", "ONGC", "NTPC", "SAIL", "IOCL", "GAIL"];

const STEPS = [
  { step: "01", title: "Download APK", desc: "Free. No Play Store needed. Direct install on Android." },
  { step: "02", title: "Add Gemini Key", desc: "Get a free API key from Google AI Studio in 2 minutes. No billing required." },
  { step: "03", title: "Pick your PSU & Branch", desc: "Select your target PSU, engineering branch and topics." },
  { step: "04", title: "Start Playing", desc: "AI generates fresh questions. You play, learn, and track progress." },
];

export default function Home() {
  return (
    <main className="overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0E17]/90 backdrop-blur-md border-b border-[#1E2535]">
        <div className="w-full px-4 md:px-8 h-14 md:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Image src="/logo.png" alt="Aspirant Arcade" width={32} height={32} className="rounded-lg flex-shrink-0" />
            <span className="font-bold text-white text-base md:text-lg truncate">
              Aspirant <span className="text-[#FDC003]">Arcade</span>
            </span>
          </div>
          <a
            href={APK_URL}
            className="flex-shrink-0 bg-[#FDC003] text-[#0A0E17] font-bold text-xs md:text-sm px-4 py-2 rounded-full hover:brightness-110 transition-all"
          >
            Download Free
          </a>
        </div>
      </nav>

      {/* ── TICKER ── */}
      <div className="fixed top-14 md:top-16 left-0 right-0 z-40 bg-[#0F1520] border-b border-[#1E2535] h-7 md:h-8 flex items-center overflow-hidden">
        <div className="flex-shrink-0 flex items-center gap-2 px-2 md:px-3 border-r border-[#1E2535] h-full bg-[#0F1520] z-10">
          <span className="text-[10px] md:text-[12px] font-black tracking-widest uppercase whitespace-nowrap" style={{ color: "#10B981" }}>
            CBT &amp; GT/PI
          </span>
          <span style={{ color: "#10B981", fontSize: "6px" }}>▶</span>
        </div>
        <div className="ticker-wrap h-full flex items-center">
          <div className="ticker-track items-center">
            {(() => {
              const items = ["HPCL","Coal India","BHEL","ONGC","NTPC","SAIL","IOCL","GAIL","BPCL","NFL","NMDC","AAI","MECL","BEL"];
              return [...items,...items,...items,...items].map((name, i) => (
                <span key={i} className="ticker-item">
                  <span className="text-[#FDC003] font-bold text-[10px] md:text-[11px] tracking-widest uppercase">{name}</span>
                  <span style={{ color: "#2A3448", fontSize: "7px", marginLeft: "14px" }}>◆</span>
                </span>
              ));
            })()}
          </div>
          <div className="ticker-fade-right" />
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-28 md:pt-32 pb-12 md:pb-16 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-[#000666]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto w-full">
          {/* Urgency badge — split on mobile */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-1 sm:gap-2 bg-[#FDC003]/10 border border-[#FDC003]/30 rounded-2xl sm:rounded-full px-4 py-2 mb-6 text-xs sm:text-sm text-[#FDC003] font-semibold">
            <span>🔥 HPCL Interviews Out</span>
            <span className="hidden sm:inline">·</span>
            <span>Coal India CBT Around the Corner</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight mb-4 text-white">
            Stop Scrolling.
            <br />
            <span className="bg-gradient-to-r from-[#FDC003] to-[#FF8C00] bg-clip-text text-transparent">
              Start Scoring.
            </span>
          </h1>

          <p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            AI-powered PSU exam prep that feels like a game.
            Your idle scroll time = your rank improvement.
          </p>

          <div className="flex flex-col gap-3 justify-center items-center mb-10">
            <a
              href={APK_URL}
              className="flex items-center gap-3 bg-[#FDC003] text-[#0A0E17] font-black text-base md:text-lg px-8 py-4 rounded-2xl hover:brightness-110 transition-all w-full sm:w-auto justify-center"
            >
              <AndroidIcon size={20} color="#0A0E17" /> Download Free APK
            </a>
            <div className="flex items-center gap-2 text-gray-500 text-xs md:text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block flex-shrink-0" />
              Free · No login needed · Android
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 md:gap-8 text-center">
            {[
              { val: "6", label: "Game Modes" },
              { val: "10+", label: "PSUs Covered" },
              { val: "AI", label: "Questions" },
              { val: "Free", label: "Always" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl md:text-3xl font-black text-[#FDC003]">{s.val}</div>
                <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE REAL TALK ── */}
      <section className="py-10 md:py-16 px-4 bg-[#0F1520]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-black mb-4 md:mb-6 text-white">
            You&apos;re already wasting time.{" "}
            <span className="bg-gradient-to-r from-[#FDC003] to-[#FF8C00] bg-clip-text text-transparent">
              At least waste it on this.
            </span>
          </h2>
          <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-6 md:mb-8">
            You spend 2–3 hours daily on Instagram and YouTube doing nothing.
            Aspirant Arcade doesn&apos;t ask you to <em>study</em>.
            It asks you to <strong className="text-white">beat your last score.</strong>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            {[
              { icon: "📱", before: "30 reels before sleep", after: "1 Survival round before sleep" },
              { icon: "🚌", before: "YouTube on the bus", after: "5 MCQs on the bus" },
              { icon: "😴", before: "Doom scroll at 9 PM", after: "Match the Following at 9 PM" },
            ].map((c) => (
              <div key={c.before} className="bg-[#0A0E17] border border-[#1E2535] rounded-2xl p-4 md:p-5">
                <div className="text-2xl mb-2 md:mb-3">{c.icon}</div>
                <div className="text-xs md:text-sm text-red-400 line-through mb-1">{c.before}</div>
                <div className="text-xs md:text-sm text-green-400 font-semibold">{c.after}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-5xl font-black mb-3 md:mb-4 text-white">
              Everything you need.{" "}
              <span className="bg-gradient-to-r from-[#FDC003] to-[#FF8C00] bg-clip-text text-transparent">
                Nothing you don&apos;t.
              </span>
            </h2>
            <p className="text-gray-400 text-sm md:text-lg">Built specifically for PSU aspirants. Not a generic quiz app.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-[#0F1520] border border-[#1E2535] rounded-2xl p-5 md:p-6 hover:border-[#FDC003]/40 transition-all">
                <div className="text-3xl md:text-4xl mb-3 md:mb-4">{f.icon}</div>
                <h3 className="text-base md:text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-500 text-xs md:text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PSU COVERAGE ── */}
      <section className="py-10 md:py-16 px-4 bg-[#0F1520]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-black mb-2 md:mb-3 text-white">
            Your PSU.{" "}
            <span className="bg-gradient-to-r from-[#FDC003] to-[#FF8C00] bg-clip-text text-transparent">
              Your Syllabus.
            </span>
          </h2>
          <p className="text-gray-400 text-sm md:text-base mb-6 md:mb-10">Questions calibrated to actual exam difficulty — not GATE level, not too easy.</p>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-6 md:mb-10">
            {PSUS.map((p) => (
              <div key={p} className="bg-[#0A0E17] border border-[#1E2535] rounded-full px-4 md:px-6 py-2 md:py-3 font-bold text-white text-xs md:text-sm">
                {p}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-[#0A0E17] border border-red-500/30 rounded-2xl p-4 md:p-6 text-left">
              <div className="text-xl md:text-2xl mb-2">🎤</div>
              <h3 className="font-black text-white text-sm md:text-base mb-1">HPCL Interview Calls Out</h3>
              <p className="text-gray-400 text-xs md:text-sm">AI mock panel. Branch-specific PI. GD topics. Practice before the real panel.</p>
            </div>
            <div className="bg-[#0A0E17] border border-blue-500/30 rounded-2xl p-4 md:p-6 text-left">
              <div className="text-xl md:text-2xl mb-2">⚡</div>
              <h3 className="font-black text-white text-sm md:text-base mb-1">Coal India CBT is Coming Up</h3>
              <p className="text-gray-400 text-xs md:text-sm">Technical MCQs, your branch, your syllabus. Fresh AI questions every session.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-black mb-2 md:mb-3 text-white">
              Up and running in{" "}
              <span className="bg-gradient-to-r from-[#FDC003] to-[#FF8C00] bg-clip-text text-transparent">
                5 minutes.
              </span>
            </h2>
            <p className="text-gray-400 text-sm md:text-base">No Play Store. No payment. No nonsense.</p>
          </div>
          <div className="space-y-3 md:space-y-4">
            {STEPS.map((s) => (
              <div key={s.step} className="flex gap-4 md:gap-5 items-start bg-[#0F1520] border border-[#1E2535] rounded-2xl p-4 md:p-6">
                <div className="text-2xl md:text-4xl font-black text-[#FDC003]/30 leading-none flex-shrink-0 w-8 md:w-12">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base md:text-lg mb-1">{s.title}</h3>
                  <p className="text-gray-500 text-xs md:text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 md:py-24 px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[#000666]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="mb-5 md:mb-6 inline-block">
            <Image src="/logo.png" alt="Aspirant Arcade" width={64} height={64} className="rounded-2xl md:w-20 md:h-20" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            One round before sleep.
            <br />
            <span className="bg-gradient-to-r from-[#FDC003] to-[#FF8C00] bg-clip-text text-transparent">
              That&apos;s all it takes.
            </span>
          </h2>
          <p className="text-gray-400 text-sm md:text-lg mb-6 md:mb-8">
            HPCL interview calls are out. Coal India CBT date is close.
            The aspirant who practices daily wins. Start tonight.
          </p>
          <a
            href={APK_URL}
            className="flex items-center justify-center gap-3 bg-[#FDC003] text-[#0A0E17] font-black text-base md:text-xl px-6 md:px-10 py-4 md:py-5 rounded-2xl hover:brightness-110 transition-all w-full sm:w-auto sm:inline-flex"
          >
            <AndroidIcon size={20} color="#0A0E17" /> Download Free — Android
          </a>
          <p className="text-gray-600 text-xs md:text-sm mt-4">No login required to start practicing</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#1E2535] py-6 md:py-8 px-4">
        <div className="w-full px-4 md:px-8 flex flex-col items-center gap-3 md:flex-row md:justify-between text-xs md:text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Aspirant Arcade" width={20} height={20} className="rounded" />
            <span className="font-bold text-gray-400">
              Aspirant <span className="text-[#FDC003]">Arcade</span>
            </span>
            <span className="ml-1">· Practice. Play. Progress.</span>
          </div>
          <div className="flex gap-4 md:gap-6">
            <span>Free on Android</span>
            <span>AI-Powered</span>
            <span>No Ads</span>
          </div>
        </div>
      </footer>

    </main>
  );
}
