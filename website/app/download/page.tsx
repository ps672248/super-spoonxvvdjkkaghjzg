"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AndroidIcon } from "../components/AndroidIcon";

const APK_URL = "https://cwhpybswvsmoiwzkyhlj.supabase.co/storage/v1/object/public/app-releases/aspirant-arcade/aspirant_arcade_1.0.1_mobile.apk";
const VERSION = "1.0.1";

export default function DownloadPage() {
  const [isAndroid, setIsAndroid] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const android = /android/i.test(navigator.userAgent);
    setIsAndroid(android);
    if (android) {
      // Auto-trigger download
      const a = document.createElement("a");
      a.href = APK_URL;
      a.download = `aspirant_arcade_${VERSION}.apk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setStarted(true);
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#0A0E17] text-white flex flex-col items-center justify-center px-4 py-16">

      {/* Nav */}
      <a href="/" className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
        <span>←</span> <span>Home</span>
      </a>

      <div className="max-w-lg w-full text-center">
        <Image src="/logo.png" alt="Aspirant Arcade" width={72} height={72} className="rounded-2xl mx-auto mb-6" />

        {isAndroid && started ? (
          <>
            {/* Android auto-triggered */}
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-5 py-2 mb-6 text-green-400 text-sm font-semibold">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
              Your download has started!
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-3 text-white">
              Aspirant Arcade v{VERSION}
            </h1>
            <p className="text-gray-400 text-sm md:text-base mb-8">
              APK downloading now. Once complete, open the file and tap <strong className="text-white">Install</strong>.
              <br />
              You may need to allow installs from unknown sources in Android Settings.
            </p>
            <a
              href={APK_URL}
              className="inline-flex items-center gap-3 bg-[#FDC003] text-[#0A0E17] font-black text-base px-8 py-4 rounded-2xl hover:brightness-110 transition-all"
            >
              <AndroidIcon size={18} color="#0A0E17" /> Download Again
            </a>
          </>
        ) : (
          <>
            {/* Desktop / non-Android */}
            <h1 className="text-3xl md:text-4xl font-black mb-3 text-white">
              Download Aspirant Arcade
            </h1>
            <p className="text-gray-400 text-sm md:text-base mb-2">
              Free Android app · v{VERSION} · No Play Store needed
            </p>
            <p className="text-gray-500 text-xs mb-8">
              {isAndroid
                ? "Tap the button below to download the APK directly."
                : "Scan the QR code with your Android phone to auto-start the download, or use the button below."}
            </p>

            <a
              href={APK_URL}
              className="inline-flex items-center gap-3 bg-[#FDC003] text-[#0A0E17] font-black text-base px-8 py-4 rounded-2xl hover:brightness-110 transition-all mb-8"
            >
              <AndroidIcon size={18} color="#0A0E17" /> Download APK (Android)
            </a>

            {!isAndroid && (
              <div className="mb-8 flex flex-col items-center gap-3">
                <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Scan with your Android phone</p>
                <div className="bg-white p-3 rounded-2xl inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent("https://aspirant-arcade.xyz/download")}`}
                    alt="QR code — scan to download Aspirant Arcade on Android"
                    width={180}
                    height={180}
                    className="block"
                  />
                </div>
                <p className="text-gray-600 text-[11px] tracking-widest">aspirant-arcade.xyz/download</p>
              </div>
            )}

            <div className="bg-[#0F1520] border border-[#1E2535] rounded-2xl p-6 text-left space-y-4">
              <h2 className="font-bold text-white text-sm uppercase tracking-widest">Install Instructions</h2>
              {[
                "Tap the Download button above on your Android phone.",
                "Once downloaded, open the APK file from your notification bar or Downloads folder.",
                "If prompted, go to Settings → Install unknown apps → Allow for your browser.",
                "Tap Install. Done — app opens immediately.",
              ].map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-[#FDC003] font-black text-sm flex-shrink-0 w-5">{i + 1}.</span>
                  <p className="text-gray-400 text-xs md:text-sm">{step}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-10 pt-6 border-t border-[#1E2535]">
          <p className="text-gray-600 text-xs">
            Also available as a{" "}
            <a href="/demo" className="text-[#FDC003] underline underline-offset-2">web version</a>
            {" "}· No signup needed · Free always
          </p>
        </div>
      </div>
    </main>
  );
}
