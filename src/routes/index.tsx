import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Syringe, ScanFace, Crown, MessageCircleHeart,
  Phone, MapPin, UploadCloud, Check, ArrowLeft, Sparkles, X,
  AlertTriangle, Loader2, ImageIcon, Sun, Maximize2, Hash, CalendarClock, Info, MousePointerClick, User
} from "lucide-react";
import logo from "@/assets/lemon-logo-neon.webp";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "کلاب VIP کلینیک لمون | پذیرش اختصاصی" },
      { name: "description", content: "عضویت ویژه در کلاب VIP کلینیک زیبایی لمون — هدیه بوتاکس، آنالیز تخصصی صورت و دسترسی مستقیم به پزشک." },
    ],
  }),
  component: VipLanding,
});

const benefits = [
  {
    icon: Syringe,
    title: "هدیه بوتاکس مصپورت",
    desc: "تکنیک چشم گربه‌ای، توسط پزشک متخصص",
    intro: "اعضای **VIP لمون**، **برای همیشه** بوتاکس کل صورت را **رایگان** دریافت می‌کنند.",
    details: [
      "**پیشانی، خط اخم، پنجه کلاغی**",
      "تزریق توسط **پزشک متخصص**",
      "نتیجه **طبیعی**، بدون فریز شدن",
    ],
  },
  {
    icon: ScanFace,
    title: "آنالیز تخصصی چهره",
    desc: "ارزیابی کامل پوستی و ارائه روتین مراقبتی",
    intro: "بررسی کامل پوست **توسط پزشک** و ارائه **روتین کاملاً شخصی‌سازی‌شده**.",
    details: [
      "**تشخیص دقیق نوع پوست**",
      "بررسی **مشکلات پوستی**",
      "تجویز **هوم‌کر اختصاصی**",
    ],
  },
  {
    icon: Crown,
    title: "عضویت VIP",
    desc: "دسترسی به آفرها و رویدادهای اختصاصی",
    intro: "دسترسی به خدمات و مزایای **اختصاصی** فقط برای **اعضای کلاب**.",
    details: [
      "**آفرهای ویژه**",
      "**اولویت رزرو**",
      "**ایونت‌های اختصاصی**",
    ],
  },
  {
    icon: MessageCircleHeart,
    title: "ارتباط با پزشک",
    desc: "مشاوره خصوصی و پیگیری شخصی",
    intro: "ارتباط **مستقیم با پزشک** برای مشاوره و پیگیری نتایج.",
    details: [
      "**مشاوره شخصی**",
      "**پیگیری درمان**",
      "**پاسخ‌گویی سریع**",
    ],
  },
];

const steps = ["نام", "مزایا", "تماس", "آدرس", "تصویر", "تایید"];

function VipLanding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [justChecked, setJustChecked] = useState<number | null>(null);
  const [openBenefit, setOpenBenefit] = useState<number | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [refCode, setRefCode] = useState("VIP-XXXX-XXXX");
  const [quality, setQuality] = useState<{
    width: number; height: number; brightness: number;
    sharpness: number; sizeKB: number;
    checks: { label: string; ok: boolean; icon: "res" | "light" | "sharp" | "size"; hint?: string }[];
    score: number;
    passed: boolean;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  // Auth + existing submission state
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [phoneLogin, setPhoneLogin] = useState("");

  // Check session on mount, and if user already submitted -> jump to step 4
  useEffect(() => {
    let mounted = true;

    const checkAdminAndRedirect = async (uid: string): Promise<boolean> => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      const isAdmin = (roles ?? []).some((r) => r.role === "admin");
      if (isAdmin) {
        navigate({ to: "/admin" });
        return true;
      }
      return false;
    };

    const loadForUser = async (uid: string) => {
      const { data } = await supabase
        .from("vip_submissions")
        .select("ref_code, full_name, phone, address, selected_benefits, status")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!mounted) return;
      if (data) {
        setRefCode(data.ref_code);
        if (data.full_name) setFullName(data.full_name);
        setPhone(data.phone);
        setAddress(data.address);
        setSelected(data.selected_benefits ?? []);
        setExistingStatus(data.status);
        setStep(5);
      }
    };

    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id ?? null;
      if (!mounted) return;
      setUserId(uid);
      if (uid) {
        const redirected = await checkAdminAndRedirect(uid);
        if (redirected) return;
        await loadForUser(uid);
      }
      setAuthChecking(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const uid = session?.user.id ?? null;
      setUserId(uid);
      if (uid) {
        const redirected = await checkAdminAndRedirect(uid);
        if (redirected) return;
        await loadForUser(uid);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Phone-only "login" — no OTP, no password verification.
  // We map a phone number to a synthetic email account in Supabase.
  // First attempt: sign in with the deterministic credentials.
  // If the account doesn't exist, sign up with the same credentials.
  const handlePhoneLogin = async () => {
    const normalized = phoneLogin.replace(/\D/g, "");
    if (normalized.length < 10 || normalized.length > 15) {
      toast.error("شماره تلفن معتبر وارد کنید");
      return;
    }
    setSigningIn(true);
    const email = `${normalized}@phone.lemon.local`;
    // Deterministic password derived from phone — user never types it.
    const password = `lemon-vip-${normalized}-pass-2026`;

    let { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Account probably doesn't exist yet — create it.
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { phone: normalized } },
      });
      if (signUpError) {
        toast.error("ورود ناموفق بود: " + signUpError.message);
        setSigningIn(false);
        return;
      }
      // Some projects require an explicit sign-in after signup.
      const { error: postSignInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (postSignInError) {
        toast.error("ورود ناموفق بود: " + postSignInError.message);
        setSigningIn(false);
        return;
      }
    }
    // onAuthStateChange will pick this up and redirect / load data.
    setSigningIn(false);
  };

  // Google sign-in via Lovable Cloud managed OAuth.
  const handleGoogleLogin = async () => {
    setSigningIn(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.redirected) return; // browser navigates away
      if (result.error) {
        toast.error("ورود با گوگل ناموفق بود");
        setSigningIn(false);
        return;
      }
      // session set — onAuthStateChange will handle the rest
    } catch {
      toast.error("ورود با گوگل ناموفق بود");
      setSigningIn(false);
    }
  };

  // Cinematic parallax — background layers shift on scroll
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 800], [0, -120]);
  const blobY = useTransform(scrollY, [0, 800], [0, -60]);
  const dustY = useTransform(scrollY, [0, 800], [0, -200]);

  // Client-only dust particles (avoids SSR hydration mismatch from Math.random)
  const [dustParticles, setDustParticles] = useState<
    Array<{ key: number; left: number; size: number; delay: number; duration: number; opacity: number }>
  >([]);

  useEffect(() => {
    // Generate refCode and dust particles on the client only
    setRefCode(
      "VIP-" +
        Math.random().toString(36).slice(2, 6).toUpperCase() +
        "-" +
        Math.random().toString(36).slice(2, 6).toUpperCase(),
    );
    setDustParticles(
      Array.from({ length: 12 }, (_, i) => ({
        key: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 14,
        duration: 12 + Math.random() * 10,
        opacity: 0.4 + Math.random() * 0.5,
      })),
    );
  }, []);

  // Auto-check benefits one-by-one within ~2s (every 500ms)
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    benefits.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setSelected((s) => (s.includes(i) ? s : [...s, i]));
          setJustChecked(i);
          timers.push(setTimeout(() => {
            setJustChecked((cur) => (cur === i ? null : cur));
          }, 700));
        }, 400 + i * 500)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  const toggle = (i: number) =>
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  const analyzeImage = (url: string, f: File) =>
    new Promise<NonNullable<typeof quality>>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const w = (canvas.width = Math.min(img.naturalWidth, 320));
        const h = (canvas.height = Math.round((img.naturalHeight / img.naturalWidth) * w));
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        // Brightness (perceived luma 0..255)
        let sum = 0;
        const lumas = new Float32Array((data.length / 4) | 0);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
          const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          lumas[j] = l;
          sum += l;
        }
        const brightness = sum / lumas.length;
        // Sharpness via Laplacian variance (simplified)
        let sVar = 0; let sMean = 0; let n = 0;
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const i = y * w + x;
            const lap =
              -4 * lumas[i] + lumas[i - 1] + lumas[i + 1] + lumas[i - w] + lumas[i + w];
            sMean += lap; n++;
          }
        }
        sMean /= n;
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const i = y * w + x;
            const lap =
              -4 * lumas[i] + lumas[i - 1] + lumas[i + 1] + lumas[i - w] + lumas[i + w];
            sVar += (lap - sMean) ** 2;
          }
        }
        const sharpness = sVar / n;

        const W = img.naturalWidth, H = img.naturalHeight;
        const sizeKB = f.size / 1024;
        const resOk = Math.min(W, H) >= 600;
        const lightOk = brightness >= 70 && brightness <= 210;
        const sharpOk = sharpness >= 80;
        const sizeOk = sizeKB >= 60 && sizeKB <= 8 * 1024;

        const checks = [
          { label: `وضوح ${W}×${H}`, ok: resOk, icon: "res" as const,
            hint: resOk ? "وضوح مناسب" : "حداقل ۶۰۰ پیکسل لازم است" },
          { label: brightness < 70 ? "نور کم" : brightness > 210 ? "نور زیاد" : "نور مناسب",
            ok: lightOk, icon: "light" as const,
            hint: lightOk ? "روشنایی متعادل" : "در نور یکنواخت طبیعی عکس بگیرید" },
          { label: sharpOk ? "تصویر واضح" : "کمی تار",
            ok: sharpOk, icon: "sharp" as const,
            hint: sharpOk ? "فوکوس مناسب" : "دوربین را ثابت نگه دارید" },
          { label: `${sizeKB < 1024 ? sizeKB.toFixed(0) + " KB" : (sizeKB / 1024).toFixed(1) + " MB"}`,
            ok: sizeOk, icon: "size" as const,
            hint: sizeOk ? "حجم مناسب" : "حجم تصویر مناسب نیست" },
        ];
        const passedCount = checks.filter((c) => c.ok).length;
        const score = Math.round((passedCount / checks.length) * 100);
        resolve({
          width: W, height: H, brightness, sharpness, sizeKB,
          checks, score, passed: passedCount >= 3 && resOk,
        });
      };
      img.onerror = () => reject(new Error("load fail"));
      img.src = url;
    });

  const onFile = async (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreview(url);
    setQuality(null);
    setAnalyzing(true);
    try {
      const q = await analyzeImage(url, f);
      setQuality(q);
    } catch {
      setQuality(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setQuality(null);
    setAnalyzing(false);
  };

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submitToBackend = async () => {
    if (submitting) return;
    if (!userId) {
      toast.error("لطفاً ابتدا با گوگل وارد شوید");
      return;
    }
    setSubmitting(true);
    try {
      let photoPath: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `submissions/${refCode}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("vip-photos")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        photoPath = path;
      }
      const { error: insErr } = await supabase.from("vip_submissions").insert({
        user_id: userId,
        ref_code: refCode,
        full_name: fullName.trim(),
        phone,
        address,
        selected_benefits: selected,
        photo_path: photoPath,
        photo_quality: quality
          ? {
              width: quality.width,
              height: quality.height,
              brightness: Math.round(quality.brightness),
              sharpness: Math.round(quality.sharpness),
              sizeKB: Math.round(quality.sizeKB),
              score: quality.score,
              passed: quality.passed,
            }
          : null,
      });
      if (insErr) throw insErr;
      setExistingStatus("new");
      setStep(5);
    } catch (e) {
      console.error("submit failed", e);
      toast.error("ارسال درخواست ناموفق بود. لطفاً دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  const nameParts = fullName.trim().split(/\s+/).filter((p) => p.length >= 2);
  const nameOk = nameParts.length >= 2;
  const canNext =
    (step === 0 && nameOk) ||
    (step === 1 && selected.length > 0) ||
    (step === 2 && /^09\d{9}$/.test(phone)) ||
    (step === 3 && address.trim().length > 8) ||
    (step === 4 && !!file && !analyzing && !!quality?.passed);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* === Cinematic environment (back plane) === */}
      <motion.div className="cinema-scene" style={{ y: bgY }}>
        <div className="light-beam b1" />
        <div className="light-beam b2" />
        <div className="light-beam b3" />
        <div className="light-streak" />
      </motion.div>

      {/* Ambient luxury blobs (mid plane, slower parallax) */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ y: blobY }}>
        <div className="ambient-blob bg-[oklch(0.90_0.10_88)] w-[560px] h-[560px] -top-48 -right-48" />
        <div className="ambient-blob bg-[oklch(0.91_0.07_55)] w-[640px] h-[640px] bottom-[-180px] -left-56" />
        <div className="ambient-blob bg-[oklch(0.88_0.06_75)] w-[420px] h-[420px] top-1/2 right-1/3 opacity-25" />
      </motion.div>

      {/* Floating luxury dust particles (front plane) */}
      <motion.div className="cinema-scene" style={{ y: dustY, zIndex: 1 }}>
        {dustParticles.map((p) => (
          <span
            key={p.key}
            className="dust"
            style={{
              left: `${p.left}%`,
              bottom: `-10vh`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              opacity: p.opacity,
            }}
          />
        ))}
      </motion.div>

      {/* One-shot camera reflection sweep on first paint */}
      <div className="camera-sweep" />

      <div className="relative z-10 mx-auto max-w-3xl px-5 pt-8 pb-20 sm:pt-14 cinema-fade">
        {/* Header */}
        <header dir="ltr" className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="logo-frame">
              <img
                src={logo}
                alt="کلینیک لمون"
                className="h-14 w-auto neon-logo logo-frame-img"
              />
            </div>
            <p className="text-sm font-semibold tracking-[0.25em] text-foreground">
              LEMON AESTHETIC CLINIC
            </p>
          </div>
          <div className="glass rounded-full px-4 py-1.5 flex items-center gap-2 text-xs" dir="rtl">
            <Sparkles className="w-3.5 h-3.5 text-[var(--gold-deep)]" />
            <span className="font-medium">پذیرش VIP</span>
          </div>
        </header>

        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-medium text-[var(--gold-deep)] tracking-wide">
              {steps[Math.min(step, steps.length - 1)]}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {Math.round((Math.min(step, steps.length - 1) / (steps.length - 1)) * 100)}%
            </span>
          </div>
          <div className="relative h-1.5 rounded-full bg-[oklch(0.88_0.04_85/0.45)] overflow-hidden glass-glow">
            <motion.div
              className="absolute inset-y-0 right-0 rounded-full"
              style={{ background: "var(--gradient-gold)", boxShadow: "0 0 18px oklch(0.82 0.12 88 / 0.5)" }}
              initial={false}
              animate={{ width: `${(Math.min(step, steps.length - 1) / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!authChecking && !userId && step < 4 && (
            <motion.section
              key="signin-gate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-xl mx-auto text-center py-6"
            >
              <div className="text-center mb-8">
                <p className="text-xs sm:text-sm tracking-[0.4em] text-[var(--gold-deep)] mb-4">
                  EXCLUSIVE INVITATION
                </p>
                <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-4">
                  عضویت در <span className="gold-text">کلاب VIP</span>
                  <br />
                  کلینیک لمون
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                  برای شروع، شماره تلفن خود را وارد کنید تا اطلاعات شما ذخیره شود و در مراجعات بعدی نیازی به تکرار مراحل نباشد.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!signingIn) handlePhoneLogin();
                }}
                className="max-w-sm mx-auto flex flex-col gap-3"
              >
                <div className="relative">
                  <Phone className="absolute top-1/2 -translate-y-1/2 right-4 w-5 h-5 text-[var(--gold-deep)]" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    dir="ltr"
                    placeholder="09xxxxxxxxx"
                    value={phoneLogin}
                    onChange={(e) => setPhoneLogin(e.target.value)}
                    className="glass-input w-full rounded-2xl py-4 pr-12 pl-4 text-center text-lg font-bold tracking-wider"
                    maxLength={15}
                  />
                </div>
                <button
                  type="submit"
                  disabled={signingIn || phoneLogin.replace(/\D/g, "").length < 10}
                  className="btn-gold rounded-2xl py-4 px-6 inline-flex items-center justify-center gap-3 font-bold hover:scale-[1.02] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                >
                  {signingIn ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  ورود به کلاب VIP
                </button>
              </form>

              {/* Divider */}
              <div className="max-w-sm mx-auto flex items-center gap-3 my-5">
                <span className="flex-1 h-px bg-gradient-to-l from-transparent via-[var(--gold)]/40 to-transparent" />
                <span className="text-[11px] text-muted-foreground tracking-wider">یا</span>
                <span className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent" />
              </div>

              {/* Google sign-in */}
              <div className="max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={signingIn}
                  className="glass glass-glow rounded-2xl py-3.5 px-6 w-full inline-flex items-center justify-center gap-3 font-semibold hover:scale-[1.02] transition disabled:opacity-40 disabled:cursor-not-allowed border border-[var(--gold)]/30"
                  aria-label="ورود با حساب گوگل"
                >
                  {signingIn ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden>
                      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                      <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.3c-2 1.4-4.6 2.3-7.5 2.3-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.5 5.3C41.4 36 44 30.5 44 24c0-1.3-.1-2.4-.4-3.5z"/>
                    </svg>
                  )}
                  ورود با گوگل
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground mt-6">
                شماره یا حساب گوگل شما فقط برای حفظ پیشرفت استفاده می‌شود
              </p>
            </motion.section>
          )}

          {authChecking && (
            <motion.div
              key="auth-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Loader2 className="w-8 h-8 animate-spin text-[var(--gold-deep)] mx-auto" />
            </motion.div>
          )}

          {!authChecking && userId && step === 0 && (
            <StepShell key="name" title="نام و نام خانوادگی شما" subtitle="برای ثبت پرونده اختصاصی در کلاب VIP">
              <FloatingInput
                icon={<User className="w-5 h-5" />}
                label="نام و نام خانوادگی"
                value={fullName}
                onChange={setFullName}
                placeholder="مثلاً سارا محمدی"
              />
              <Nav onBack={back} onNext={next} canNext={canNext} backDisabled />
            </StepShell>
          )}

          {!authChecking && userId && step === 1 && (
            <motion.section
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-10">
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="text-xs sm:text-sm tracking-[0.4em] text-[var(--gold-deep)] mb-4"
                >
                  EXCLUSIVE INVITATION
                </motion.p>
                <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-5">
                  عضویت در <span className="gold-text">کلاب VIP</span>
                  <br />
                  کلینیک لمون
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  تجربه‌ای اختصاصی از زیبایی، تحت نظر پزشک
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 mb-4 text-xs text-[var(--gold-deep)]">
                <MousePointerClick className="w-3.5 h-3.5 animate-pulse" />
                <span className="tracking-wide">برای دیدن جزئیات، روی هر کارت بزنید</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {benefits.map((b, i) => {
                  const Icon = b.icon;
                  const isSel = selected.includes(i);
                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i + 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{
                        scale: 1.03,
                        y: -5,
                        transition: { type: "spring", stiffness: 320, damping: 22 },
                      }}
                      whileTap={{
                        scale: 0.96,
                        y: 0,
                        transition: { type: "spring", stiffness: 600, damping: 18 },
                      }}
                      onClick={() => setOpenBenefit(i)}
                      aria-label={`جزئیات ${b.title}`}
                      className={`benefit-card glass glass-glow card-halo breathe rounded-2xl p-5 text-right relative overflow-hidden group transition-shadow duration-500 cursor-pointer hover:shadow-[0_24px_60px_-18px_oklch(0.55_0.12_75/0.55),0_0_50px_-10px_oklch(0.82_0.14_88/0.45)] ${
                        isSel ? "ring-2 ring-[var(--gold)] shadow-[0_0_40px_oklch(0.82_0.14_88/0.4)]" : ""
                      }`}
                    >
                      {/* luxury hover glow sweep */}
                      <span
                        aria-hidden
                        className="benefit-card__sweep pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100"
                      />
                      {/* gold halo ring on hover */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          boxShadow:
                            "inset 0 0 0 1px oklch(0.82 0.14 88 / 0.55), inset 0 0 30px oklch(0.92 0.10 88 / 0.18)",
                        }}
                      />
                      {isSel && (
                        <span className="shine-sweep absolute inset-0 rounded-2xl pointer-events-none" />
                      )}
                      <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-l from-transparent via-[var(--gold)] to-transparent opacity-80" />

                      {/* Info badge — affordance that the card is tappable */}
                      <span
                        className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide pointer-events-none"
                        style={{
                          background: "var(--gradient-gold)",
                          color: "white",
                          boxShadow:
                            "0 4px 12px -3px oklch(0.82 0.14 88 / 0.55), inset 0 1px 0 rgba(255,255,255,0.4)",
                        }}
                      >
                        <Info className="w-3 h-3" />
                        جزئیات
                      </span>
                      {/* soft pulsing ring around the badge */}
                      <span
                        className="absolute top-1.5 left-1.5 w-3 h-3 rounded-full pointer-events-none animate-ping"
                        style={{ background: "oklch(0.82 0.14 88 / 0.7)", animationDuration: "2.4s" }}
                      />

                      <div className="flex items-start gap-4">
                        <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                          isSel ? "btn-gold" : "bg-[var(--gold-soft)]/50"
                        }`}>
                          <Icon className={`w-6 h-6 ${isSel ? "text-white" : "text-[var(--gold-deep)]"}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-base sm:text-lg mb-1">{b.title}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                          <span className="inline-flex items-center gap-1 mt-2 text-[11px] text-[var(--gold-deep)] font-medium opacity-90 group-hover:opacity-100">
                            بیشتر بخوانید
                            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                          </span>
                        </div>
                        <div className={`relative w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSel ? "border-[var(--gold)] bg-[var(--gold)]" : "border-[var(--border)]"
                        }`}>
                          <AnimatePresence>
                            {isSel && justChecked === i && (
                              <motion.span
                                key="ring"
                                initial={{ scale: 0.6, opacity: 0.9 }}
                                animate={{ scale: 2.6, opacity: 0 }}
                                transition={{ duration: 0.7, ease: "easeOut" }}
                                className="absolute inset-0 rounded-full bg-[var(--gold)]"
                              />
                            )}
                          </AnimatePresence>
                          {isSel && (
                            <motion.span
                              initial={justChecked === i ? { scale: 2.4, rotate: -20 } : false}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
                              className="relative flex items-center justify-center"
                            >
                              <Check className="w-3 h-3 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
                            </motion.span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <CTA disabled={!canNext} onClick={next}>ادامه ثبت درخواست</CTA>

              <Dialog open={openBenefit !== null} onOpenChange={(o) => !o && setOpenBenefit(null)}>
                <DialogContent
                  className="border-[var(--gold)]/40 max-w-[92vw] sm:max-w-md text-right p-0 overflow-hidden rounded-2xl shadow-[0_30px_80px_-20px_rgba(60,40,20,0.55),0_0_60px_-10px_oklch(0.82_0.14_88/0.45)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                  dir="rtl"
                  style={{
                    background:
                      "linear-gradient(140deg, oklch(0.985 0.008 85 / 0.96) 0%, oklch(0.96 0.018 82 / 0.94) 60%, oklch(0.92 0.035 82 / 0.92) 100%)",
                    backdropFilter: "blur(28px) saturate(140%)",
                    WebkitBackdropFilter: "blur(28px) saturate(140%)",
                    color: "oklch(0.22 0.015 60)",
                  }}
                >
                  {/* gold key light */}
                  <div
                    className="pointer-events-none absolute -top-20 -left-20 w-56 h-56 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, oklch(0.95 0.10 90 / 0.55), transparent 65%)",
                      filter: "blur(24px)",
                    }}
                  />
                  <div
                    className="pointer-events-none absolute -bottom-24 -right-16 w-64 h-64 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, oklch(0.98 0.02 85 / 0.55), transparent 70%)",
                      filter: "blur(32px)",
                    }}
                  />
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-[var(--gold)] to-transparent opacity-90" />

                  {openBenefit !== null && (() => {
                    const b = benefits[openBenefit];
                    const Icon = b.icon;
                    const renderRich = (text: string) => {
                      const parts = text.split(/(\*\*[^*]+\*\*)/g);
                      return parts.map((p, i) =>
                        p.startsWith("**") && p.endsWith("**") ? (
                          <strong
                            key={i}
                            className="font-extrabold"
                            style={{ color: "oklch(0.45 0.10 75)" }}
                          >
                            {p.slice(2, -2)}
                          </strong>
                        ) : (
                          <span key={i}>{p}</span>
                        ),
                      );
                    };
                    return (
                      <div className="relative p-6 sm:p-7">
                        <DialogHeader className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                              style={{
                                background: "var(--gradient-gold)",
                                boxShadow:
                                  "0 8px 24px -6px oklch(0.82 0.14 88 / 0.6), inset 0 1px 0 rgba(255,255,255,0.5)",
                              }}
                            >
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <DialogTitle
                              className="text-right text-xl sm:text-2xl font-bold leading-tight"
                              style={{ color: "oklch(0.32 0.04 60)" }}
                            >
                              {b.title}
                            </DialogTitle>
                          </div>
                          <DialogDescription
                            className="text-right text-sm sm:text-[15px] leading-7"
                            style={{ color: "oklch(0.35 0.02 60)" }}
                          >
                            {renderRich(b.intro ?? b.desc)}
                          </DialogDescription>
                        </DialogHeader>

                        <div
                          className="mt-5 h-px w-full"
                          style={{
                            background:
                              "linear-gradient(to left, transparent, oklch(0.78 0.085 78 / 0.6), transparent)",
                          }}
                        />

                        <ul className="space-y-3 mt-5">
                          {b.details.map((d, idx) => (
                            <motion.li
                              key={idx}
                              initial={{ opacity: 0, x: 8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.06 * idx + 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                              className="flex gap-3 items-start text-sm sm:text-[15px] leading-7"
                            >
                              <span
                                className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full"
                                style={{
                                  background: "var(--gold)",
                                  boxShadow: "0 0 10px var(--gold), 0 0 4px var(--gold)",
                                }}
                              />
                              <span style={{ color: "oklch(0.28 0.015 60)" }}>{renderRich(d)}</span>
                            </motion.li>
                          ))}
                        </ul>

                        <button
                          type="button"
                          onClick={() => setOpenBenefit(null)}
                          className="mt-6 w-full rounded-xl py-3 text-sm font-semibold tracking-wide transition-transform active:scale-[0.98]"
                          style={{
                            background: "var(--gradient-gold)",
                            color: "white",
                            boxShadow:
                              "0 10px 24px -8px oklch(0.82 0.14 88 / 0.55), inset 0 1px 0 rgba(255,255,255,0.4)",
                          }}
                        >
                          متوجه شدم
                        </button>
                      </div>
                    );
                  })()}
                </DialogContent>
              </Dialog>
            </motion.section>
          )}

          {step === 2 && (
            <StepShell key="phone" title="شماره تماس خود را وارد کنید" subtitle="جهت هماهنگی توسط منشی اختصاصی">
              <FloatingInput
                icon={<Phone className="w-5 h-5" />}
                label="شماره موبایل"
                value={phone}
                onChange={setPhone}
                type="tel"
                placeholder="09xxxxxxxxx"
                dir="ltr"
              />
              <Nav onBack={back} onNext={next} canNext={canNext} />
            </StepShell>
          )}

          {step === 3 && (
            <StepShell key="addr" title="آدرس خود را وارد کنید" subtitle="برای ارسال هدیه و دعوتنامه اختصاصی">
              <FloatingInput
                icon={<MapPin className="w-5 h-5" />}
                label="آدرس کامل"
                value={address}
                onChange={setAddress}
                multiline
                placeholder="شهر، منطقه، خیابان، پلاک، واحد"
              />
              <Nav onBack={back} onNext={next} canNext={canNext} />
            </StepShell>
          )}

          {step === 4 && (
            <StepShell key="img" title="ارسال تصویر صورت" subtitle="ترجیحاً بدون میکاپ سنگین، به‌صورت واضح و طبیعی">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
              {!preview ? (
                <motion.div
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); onFile(e.dataTransfer.files?.[0] ?? null); }}
                  animate={dragOver ? { scale: 1.02 } : { scale: 1 }}
                  className={`glass rounded-3xl p-10 sm:p-14 cursor-pointer text-center relative overflow-hidden transition-all ${
                    dragOver ? "ring-2 ring-[var(--gold)] shadow-[0_0_60px_oklch(0.82_0.14_88/0.5)]" : ""
                  }`}
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 mx-auto mb-5 rounded-2xl btn-gold flex items-center justify-center"
                  >
                    <UploadCloud className="w-10 h-10 text-white" />
                  </motion.div>
                  <p className="font-bold text-lg mb-2">تصویر را اینجا رها کنید</p>
                  <p className="text-sm text-muted-foreground">یا برای انتخاب کلیک کنید — JPG / PNG</p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
                    <span className="glass rounded-full px-3 py-1">حداقل ۶۰۰px</span>
                    <span className="glass rounded-full px-3 py-1">نور یکنواخت</span>
                    <span className="glass rounded-full px-3 py-1">بدون فیلتر</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-3xl p-4 sm:p-5 relative overflow-hidden"
                >
                  <div className="grid sm:grid-cols-[200px_1fr] gap-5 items-stretch">
                    {/* Preview */}
                    <div className="relative rounded-2xl overflow-hidden bg-[var(--ivory)] aspect-[3/4] sm:aspect-auto">
                      <img src={preview} alt="پیش‌نمایش" className="w-full h-full object-cover" />
                      {analyzing && (
                        <div className="absolute inset-0 backdrop-blur-sm bg-black/20 flex flex-col items-center justify-center text-white">
                          <Loader2 className="w-7 h-7 animate-spin mb-2" />
                          <span className="text-xs">در حال بررسی کیفیت…</span>
                        </div>
                      )}
                      {quality && !analyzing && (
                        <div className="absolute top-2 right-2 left-2 flex items-center justify-between">
                          <span className={`glass rounded-full px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 ${
                            quality.passed ? "text-[var(--gold-deep)]" : "text-destructive"
                          }`}>
                            {quality.passed ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {quality.score}٪
                          </span>
                          <button
                            onClick={clearFile}
                            className="w-7 h-7 rounded-full glass flex items-center justify-center"
                            aria-label="حذف"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Quality report */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <ImageIcon className="w-4 h-4 text-[var(--gold-deep)]" />
                        <h3 className="font-bold text-sm">بررسی خودکار کیفیت</h3>
                      </div>

                      {/* Score bar */}
                      <div className="mb-4">
                        <div className="h-2 rounded-full bg-[var(--gold-soft)]/40 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${quality?.score ?? 0}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              quality?.passed
                                ? "bg-gradient-to-l from-[var(--gold)] to-[var(--gold-deep)]"
                                : "bg-gradient-to-l from-orange-400 to-red-400"
                            }`}
                          />
                        </div>
                      </div>

                      <ul className="space-y-2">
                        {(quality?.checks ?? [
                          { label: "وضوح", ok: false, icon: "res" as const },
                          { label: "نور", ok: false, icon: "light" as const },
                          { label: "فوکوس", ok: false, icon: "sharp" as const },
                          { label: "حجم", ok: false, icon: "size" as const },
                        ]).map((c, i) => {
                          const Icon = c.icon === "res" ? Maximize2
                            : c.icon === "light" ? Sun
                            : c.icon === "sharp" ? ScanFace
                            : ImageIcon;
                          return (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: analyzing ? 0.3 : 1, x: 0 }}
                              transition={{ delay: 0.05 * i }}
                              className="flex items-center gap-3 text-xs"
                            >
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                analyzing ? "bg-[var(--gold-soft)]/40"
                                : c.ok ? "bg-[var(--gold)]/25 text-[var(--gold-deep)]"
                                : "bg-destructive/15 text-destructive"
                              }`}>
                                {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : c.ok ? <Check className="w-3.5 h-3.5" />
                                  : <Icon className="w-3.5 h-3.5" />}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">{c.label}</p>
                                {("hint" in c) && c.hint && (
                                  <p className="text-[10px] text-muted-foreground truncate">{c.hint}</p>
                                )}
                              </div>
                            </motion.li>
                          );
                        })}
                      </ul>

                      {quality && !analyzing && !quality.passed && (
                        <button
                          onClick={() => inputRef.current?.click()}
                          className="mt-4 glass rounded-xl px-3 py-2 text-xs font-medium flex items-center justify-center gap-2 hover:scale-[1.02] transition"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          آپلود تصویر دیگر
                        </button>
                      )}
                      {quality?.passed && !analyzing && (
                        <div className="mt-4 flex items-center gap-2 text-xs text-[var(--gold-deep)] font-medium">
                          <Sparkles className="w-3.5 h-3.5" />
                          تصویر تایید شد
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
              <Nav
                onBack={back}
                onNext={submitToBackend}
                canNext={canNext && !submitting}
                nextLabel={submitting ? "در حال ارسال…" : "ثبت نهایی درخواست"}
              />
            </StepShell>
          )}

          {step === 5 && (
            <SuccessScreen
              refCode={refCode}
              fullName={fullName}
              phone={phone}
              address={address}
              preview={preview}
              selected={selected}
              quality={quality}
              status={existingStatus}
            />
          )}
        </AnimatePresence>

        <footer className="text-center text-[11px] tracking-[0.4em] text-muted-foreground mt-16">
          TEHRAN PRIVATE SUITE
        </footer>
      </div>
    </main>
  );
}

function CTA({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`btn-gold w-full sm:w-auto sm:min-w-[280px] mx-auto block px-10 py-5 rounded-2xl font-bold text-base tracking-wide ${
        disabled ? "opacity-40 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </motion.button>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="max-w-xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-black mb-3">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="space-y-6">{children}</div>
    </motion.section>
  );
}

function FloatingInput({
  icon, label, value, onChange, type = "text", placeholder, multiline, dir,
}: {
  icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; multiline?: boolean; dir?: "ltr" | "rtl";
}) {
  const [focused, setFocused] = useState(false);
  const float = focused || value.length > 0;
  return (
    <div className="relative">
      <div className="absolute top-4 right-4 text-[var(--gold-deep)] z-10">{icon}</div>
      <label className={`absolute right-12 transition-all pointer-events-none z-10 ${
        float ? "top-1.5 text-[10px] text-[var(--gold-deep)] font-medium" : "top-4 text-sm text-muted-foreground"
      }`}>
        {label}
      </label>
      {multiline ? (
        <textarea
          rows={4}
          value={value}
          dir={dir}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={float ? placeholder : ""}
          className="glass-input w-full rounded-2xl pt-7 pb-3 pr-12 pl-4 text-base resize-none placeholder:text-muted-foreground/50"
        />
      ) : (
        <input
          type={type}
          value={value}
          dir={dir}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={float ? placeholder : ""}
          className="glass-input w-full rounded-2xl pt-7 pb-3 pr-12 pl-4 text-base placeholder:text-muted-foreground/50"
        />
      )}
    </div>
  );
}

function Nav({ onBack, onNext, canNext, nextLabel = "ادامه", backDisabled = false }: {
  onBack: () => void; onNext: () => void; canNext: boolean; nextLabel?: string; backDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 pt-4">
      {backDisabled ? (
        <span aria-hidden className="opacity-0 pointer-events-none px-5 py-3.5 text-sm" />
      ) : (
        <button
          onClick={onBack}
          className="glass rounded-2xl px-5 py-3.5 text-sm font-medium flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          بازگشت
        </button>
      )}
      <CTA onClick={onNext} disabled={!canNext}>{nextLabel}</CTA>
    </div>
  );
}

function SuccessScreen({
  refCode, phone, address, preview, selected, quality, status,
}: {
  refCode: string; phone: string; address: string;
  preview: string | null; selected: number[];
  quality: { score: number } | null;
  status?: string | null;
}) {
  const today = new Date().toLocaleDateString("fa-IR", {
    year: "numeric", month: "long", day: "numeric",
  });
  const maskedPhone = phone.replace(/^(\d{4})(\d{3})(\d{4})$/, "$1•••$3");
  const shortAddr = address.length > 60 ? address.slice(0, 60) + "…" : address;

  return (
    <motion.section
      key="done"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-xl mx-auto text-center py-4 relative"
    >
      {/* Sparkle particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0.4],
            x: Math.cos((i / 12) * Math.PI * 2) * (90 + (i % 3) * 20),
            y: Math.sin((i / 12) * Math.PI * 2) * (90 + (i % 3) * 20),
          }}
          transition={{ duration: 1.6, delay: 0.4 + i * 0.04, ease: "easeOut" }}
          className="absolute left-1/2 top-[72px] w-1.5 h-1.5 rounded-full bg-[var(--gold)] shadow-[0_0_12px_var(--gold)]"
        />
      ))}

      {/* Animated badge */}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.15 }}
        className="relative w-32 h-32 mx-auto mb-8"
      >
        <motion.div
          className="absolute -inset-6 rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.82 0.14 88 / 0.5), transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full btn-gold"
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-[6px] rounded-full bg-[var(--ivory)] flex items-center justify-center">
          <motion.div
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Check className="w-14 h-14 text-[var(--gold-deep)]" strokeWidth={3} />
          </motion.div>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="text-xs tracking-[0.4em] text-[var(--gold-deep)] mb-3"
      >
        APPLICATION RECEIVED
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        className="text-3xl sm:text-4xl font-black mb-3 leading-tight"
      >
        درخواست شما <span className="gold-text">ثبت شد</span>
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        className="text-muted-foreground max-w-md mx-auto leading-relaxed text-sm sm:text-base"
      >
        تیم پذیرش VIP لمون پرونده‌ی شما را بررسی می‌کند و ظرف ۲۴ ساعت آینده با شما تماس می‌گیرد.
      </motion.p>

      {/* Summary card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.6 }}
        className="glass rounded-3xl p-5 sm:p-6 mt-8 text-right relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-l from-transparent via-[var(--gold)] to-transparent" />

        {/* Header row */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            {preview ? (
              <div className="relative">
                <img src={preview} alt="" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[var(--gold)]" />
                {quality && (
                  <span className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full btn-gold flex items-center justify-center text-[9px] font-bold text-white">
                    {quality.score}
                  </span>
                )}
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[var(--gold-soft)]/60 flex items-center justify-center">
                <Crown className="w-6 h-6 text-[var(--gold-deep)]" />
              </div>
            )}
            <div>
              <p className="text-[10px] text-muted-foreground tracking-widest">VIP MEMBER</p>
              <p className="font-bold text-sm">عضو محترم لمون</p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-[10px] text-muted-foreground tracking-widest">REF</p>
            <p className="font-mono font-bold text-xs gold-text" dir="ltr">{refCode}</p>
          </div>
        </div>

        <div className="h-px bg-[var(--border)] mb-5" />

        {/* Info rows */}
        <ul className="space-y-3.5 text-sm">
          <SummaryRow icon={<Phone className="w-3.5 h-3.5" />} label="شماره تماس">
            <span dir="ltr" className="font-medium">{maskedPhone || phone}</span>
          </SummaryRow>
          <SummaryRow icon={<MapPin className="w-3.5 h-3.5" />} label="آدرس">
            <span className="font-medium">{shortAddr}</span>
          </SummaryRow>
          <SummaryRow icon={<Sparkles className="w-3.5 h-3.5" />} label="مزایای انتخابی">
            <div className="flex flex-wrap gap-1.5 justify-end">
              {selected.map((i) => (
                <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--gold-deep)] text-white font-bold shadow-sm border border-[var(--gold-deep)]">
                  {benefits[i].title}
                </span>
              ))}
            </div>
          </SummaryRow>
          <SummaryRow icon={<CalendarClock className="w-3.5 h-3.5" />} label="تاریخ ثبت">
            <span className="font-medium">{today}</span>
          </SummaryRow>
          <SummaryRow icon={<Hash className="w-3.5 h-3.5" />} label="وضعیت">
            {status === "approved" ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                تایید شد
              </span>
            ) : status === "rejected" ? (
              <span className="inline-flex items-center gap-1.5 text-rose-700 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                رد شد
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[var(--gold-deep)] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-deep)] animate-pulse" />
                در حال بررسی
              </span>
            )}
          </SummaryRow>
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05 }}
        className="glass rounded-2xl p-4 mt-6 inline-flex items-center gap-3"
      >
        <Crown className="w-5 h-5 text-[var(--gold-deep)]" />
        <span className="text-sm">به خانواده VIP لمون خوش آمدید</span>
      </motion.div>
    </motion.section>
  );
}

function SummaryRow({ icon, label, children }: {
  icon: React.ReactNode; label: string; children: React.ReactNode;
}) {
  return (
    <li className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-2 text-muted-foreground shrink-0">
        <span className="w-6 h-6 rounded-lg bg-[var(--gold-soft)]/50 text-[var(--gold-deep)] flex items-center justify-center">
          {icon}
        </span>
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-right min-w-0 flex-1">{children}</div>
    </li>
  );
}
