import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import iconFoxEyes from "@/assets/vv-icon-foxeyes.webp";
import iconFace from "@/assets/vv-icon-face.webp";
import iconCrown from "@/assets/vv-icon-crown.webp";
import iconChat from "@/assets/vv-icon-chat.webp";

type Benefit = {
  title: string;
  subtitle: string;
  tag: string;
  icon: string;
};

const BENEFITS: Benefit[] = [
  {
    tag: "هدیه عضویت شما",
    title: "یک دوز کامل بوتاکس",
    subtitle: "FOX EYE / CAT EYE",
    icon: iconFoxEyes,
  },
  {
    tag: "ارزیابی تخصصی صورت",
    title: "آنالیز چهره",
    subtitle: "ارزیابی تخصصی صورت با طراحی روتین مراقبتی",
    icon: iconFace,
  },
  {
    tag: "عضویت طلایی",
    title: "دسترسی VIP",
    subtitle: "ورود به کلاب خصوصی لمون با خدمات و تخفیف‌های اختصاصی",
    icon: iconCrown,
  },
  {
    tag: "کنسیرژ پزشکی",
    title: "ارتباط مستقیم با پزشک",
    subtitle: "خط ارتباطی شخصی و مشاوره بدون واسطه با تیم پزشکی",
    icon: iconChat,
  },
];

function SwipeCard({
  benefit,
  index,
  total,
  onDismiss,
}: {
  benefit: Benefit;
  index: number; // 0 = top
  total: number;
  onDismiss: (dir: 1 | -1) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-14, 0, 14]);
  const reflect = useTransform(x, [-220, 0, 220], [-40, 50, 140]);
  const reflectBg = useTransform(
    reflect,
    (v) =>
      `linear-gradient(110deg, transparent ${Math.max(0, v - 25)}%, rgba(255,255,255,0.55) ${v}%, transparent ${v + 25}%)`,
  );
  const isTop = index === 0;
  const iconSrc = benefit.icon;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const power = info.offset.x + info.velocity.x * 0.25;
    if (Math.abs(power) > 140) {
      onDismiss(power > 0 ? 1 : -1);
    }
  };

  // Stack offsets — back cards peek behind
  const depth = index;
  const scale = 1 - depth * 0.05;
  const yOffset = depth * 14;
  const opacity = depth > 2 ? 0 : 1 - depth * 0.18;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{ zIndex: total - index }}
      initial={{ opacity: 0, scale: 0.85, y: 60, filter: "blur(8px)" }}
      animate={{
        opacity,
        scale,
        y: yOffset,
        filter: "blur(0px)",
        transition: {
          delay: isTop ? 0 : depth * 0.08,
          duration: 0.9,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.4 } }}
    >
      <motion.div
        drag={isTop ? "x" : false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.6}
        onDragEnd={handleDragEnd}
        whileTap={isTop ? { cursor: "grabbing" } : undefined}
        animate={
          isTop
            ? { y: [0, -6, 0], transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" } }
            : undefined
        }
        style={{
          x: isTop ? x : 0,
          rotate: isTop ? rotate : 0,
          background:
            "linear-gradient(140deg, oklch(0.985 0.008 85) 0%, oklch(0.96 0.018 82) 60%, oklch(0.92 0.035 82) 100%)",
          border: "1px solid oklch(0.78 0.085 78 / 0.45)",
          boxShadow:
            "0 30px 80px -20px rgba(60,40,20,0.35), 0 10px 30px -10px rgba(60,40,20,0.2), inset 0 1px 0 rgba(255,248,230,0.7)",
        }}
        className={`relative w-[86vw] max-w-[360px] aspect-[3/4] rounded-[28px] overflow-hidden ${
          isTop ? "cursor-grab" : "pointer-events-none"
        }`}
      >
        {/* dynamic glass reflection */}
        {isTop && (
          <motion.div
            className="pointer-events-none absolute inset-0 mix-blend-screen"
            style={{ background: reflectBg }}
          />
        )}
        {/* gold key light top-right */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.95 0.10 90 / 0.55), transparent 65%)",
            filter: "blur(20px)",
          }}
        />
        {/* ambient ivory bottom-left */}
        <div
          className="pointer-events-none absolute -bottom-20 -left-16 w-60 h-60 rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.98 0.02 85 / 0.55), transparent 70%)",
            filter: "blur(28px)",
          }}
        />

        <div className="relative h-full w-full flex flex-col items-center justify-between p-7 text-center">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full glass-input text-[11px] tracking-wide text-[var(--gold-deep)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
            {benefit.tag}
          </div>

          <div className="flex flex-col items-center gap-5">
            <div
              className="relative w-32 h-32 flex items-center justify-center"
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(232,212,168,0.55) 0%, rgba(201,169,106,0.18) 50%, transparent 72%)",
                  filter: "blur(10px)",
                }}
              />
              <img
                src={iconSrc}
                alt={benefit.title}
                className="relative w-full h-full object-contain"
                style={{
                  filter:
                    "drop-shadow(0 12px 24px rgba(168,136,74,0.35)) drop-shadow(0 4px 8px rgba(168,136,74,0.25))",
                }}
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">{benefit.title}</h3>
              <p className="text-sm leading-7 text-muted-foreground px-2">
                {benefit.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1.5">
              {Array.from({ length: total }).map((_, i) => (
                <span
                  key={i}
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: i === 0 ? 22 : 8,
                    background:
                      i === 0
                        ? "var(--gradient-gold)"
                        : "oklch(0.80 0.06 86 / 0.4)",
                  }}
                />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground tracking-wider">
              برای پذیرش، کارت را بکشید →  ←
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FlyingCard({ benefit, dir }: { benefit: Benefit; dir: 1 | -1 }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      initial={{ x: 0, rotate: 0, opacity: 1 }}
      animate={{
        x: dir * (typeof window !== "undefined" ? window.innerWidth : 800),
        y: -120,
        rotate: dir * 28,
        opacity: 0,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
      }}
      style={{ zIndex: 60 }}
    >
      <div className="relative w-[86vw] max-w-[360px] aspect-[3/4] rounded-[28px] glass glass-glow overflow-hidden">
        {/* gold trail */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(${dir > 0 ? "270deg" : "90deg"}, oklch(0.92 0.12 88 / 0.45), transparent 70%)`,
            mixBlendMode: "screen",
          }}
        />
        <div className="relative h-full w-full flex items-center justify-center">
          <img
            src={benefit.icon}
            alt={benefit.title}
            className="w-32 h-32 object-contain"
            style={{
              filter:
                "drop-shadow(0 12px 24px rgba(168,136,74,0.35)) drop-shadow(0 4px 8px rgba(168,136,74,0.25))",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function VipIntroOverlay() {
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(false);
  const [stack, setStack] = useState<Benefit[]>(BENEFITS);
  const [flying, setFlying] = useState<{ benefit: Benefit; dir: 1 | -1; key: number } | null>(
    null,
  );
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(true);
      setShown(true);
    }, 1000);
    return () => clearTimeout(t);
  }, []);

  // lock body scroll while overlay is up
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  const handleDismiss = (dir: 1 | -1) => {
    setStack((s) => {
      if (s.length === 0) return s;
      const [top, ...rest] = s;
      setFlying({ benefit: top, dir, key: Date.now() });
      setTimeout(() => setFlying(null), 700);
      if (rest.length === 0) {
        setClosing(true);
        setTimeout(() => setVisible(false), 1100);
      }
      return rest;
    });
  };

  if (!shown) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="vip-overlay"
          className="fixed inset-0 z-[100] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
        >
          {/* deep blurred backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 50% 45%, oklch(0.30 0.03 60 / 0.55), oklch(0.18 0.02 55 / 0.85))",
              backdropFilter: "blur(28px) saturate(140%)",
              WebkitBackdropFilter: "blur(28px) saturate(140%)",
            }}
          />
          {/* champagne key light top-right */}
          <motion.div
            className="absolute -top-32 -right-32 w-[60vw] h-[60vw] rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, oklch(0.95 0.10 90 / 0.45), transparent 65%)",
              filter: "blur(40px)",
              mixBlendMode: "screen",
            }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* ambient ivory fog bottom-left */}
          <div
            className="absolute -bottom-40 -left-32 w-[70vw] h-[70vw] rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, oklch(0.92 0.05 85 / 0.30), transparent 70%)",
              filter: "blur(50px)",
              mixBlendMode: "screen",
            }}
          />
          {/* edge vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 110% 90% at 50% 50%, transparent 50%, oklch(0.10 0.02 55 / 0.55) 100%)",
            }}
          />
          {/* opening light sweep */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(110deg, transparent 30%, oklch(0.96 0.10 90 / 0.35) 50%, transparent 70%)",
              mixBlendMode: "screen",
            }}
            initial={{ x: "-120%", opacity: 0 }}
            animate={{ x: "120%", opacity: [0, 1, 0] }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />

          {/* closing burst */}
          {closing && (
            <motion.div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <div
                className="w-40 h-40 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, oklch(0.98 0.10 90 / 0.85), transparent 70%)",
                  filter: "blur(30px)",
                  transform: "scale(1)",
                  animation: "vip-burst 1s cubic-bezier(0.22,1,0.36,1) forwards",
                }}
              />
            </motion.div>
          )}

          {/* header */}
          <motion.div
            className="absolute top-0 inset-x-0 pt-[max(env(safe-area-inset-top),20px)] px-6 text-center"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-[11px] tracking-[0.4em] text-[var(--gold)] mb-2">
              VIP · LEMON CLINIC
            </div>
            <h2 className="text-xl font-semibold text-ivory" style={{ color: "oklch(0.96 0.02 85)" }}>
              مراسم پذیرش شما
            </h2>
            <p className="text-xs mt-1" style={{ color: "oklch(0.85 0.03 80 / 0.85)" }}>
              برای ورود، کارت ها را ورق بزنید
            </p>
          </motion.div>

          {/* card stack */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full max-h-[640px] flex items-center justify-center">
              <AnimatePresence>
                {stack
                  .slice(0, 4)
                  .map((b, i) => (
                    <SwipeCard
                      key={b.title}
                      benefit={b}
                      index={i}
                      total={BENEFITS.length}
                      onDismiss={handleDismiss}
                    />
                  ))
                  .reverse()}
              </AnimatePresence>
              {flying && (
                <FlyingCard key={flying.key} benefit={flying.benefit} dir={flying.dir} />
              )}
            </div>
          </div>

          {/* footer counter */}
          <motion.div
            className="absolute bottom-0 inset-x-0 pb-[max(env(safe-area-inset-bottom),24px)] px-6 text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-[11px] tracking-[0.3em]" style={{ color: "oklch(0.85 0.03 80 / 0.7)" }}>
              {BENEFITS.length - stack.length} / {BENEFITS.length} پذیرفته شد
            </div>
          </motion.div>

          <style>{`
            @keyframes vip-burst {
              0% { transform: scale(0.4); opacity: 0; }
              40% { opacity: 1; }
              100% { transform: scale(8); opacity: 0; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}