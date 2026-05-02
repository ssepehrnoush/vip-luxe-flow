import { useEffect, useState } from "react";

const STORAGE_KEY = "lemon-high-contrast";

export default function HighContrastToggle() {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) === "1";
    setEnabled(saved);
    if (saved) document.documentElement.classList.add("hc");
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("hc", enabled);
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  }, [enabled, mounted]);

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={() => setEnabled((v) => !v)}
      aria-pressed={enabled}
      aria-label={enabled ? "غیرفعال‌سازی حالت کنتراست بالا" : "فعال‌سازی حالت کنتراست بالا"}
      title={enabled ? "حالت کنتراست بالا فعال است" : "حالت کنتراست بالا"}
      className="fixed bottom-5 left-5 z-[120] h-12 w-12 rounded-full glass glass-glow flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      style={{
        boxShadow: enabled
          ? "0 0 0 2px var(--gold), 0 0 24px rgba(201,169,106,0.55), 0 10px 28px -10px rgba(0,0,0,0.6)"
          : "0 10px 28px -10px rgba(0,0,0,0.6)",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        aria-hidden="true"
        style={{
          filter: enabled
            ? "drop-shadow(0 0 6px rgba(232,212,168,0.9))"
            : "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
        }}
      >
        <defs>
          <clipPath id="hc-half">
            <rect x="12" y="0" width="12" height="24" />
          </clipPath>
        </defs>
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.6"
        />
        <circle cx="12" cy="12" r="9" fill="var(--gold)" clipPath="url(#hc-half)" />
      </svg>
    </button>
  );
}