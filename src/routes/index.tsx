import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Syringe, ScanFace, Crown, MessageCircleHeart,
  Phone, MapPin, UploadCloud, Check, ArrowLeft, Sparkles, X,
  AlertTriangle, Loader2, ImageIcon, Sun, Maximize2
} from "lucide-react";
import logo from "@/assets/lemon-logo.png";

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
  { icon: Syringe,         title: "هدیه بوتاکس مصپورت", desc: "افکت چشم گربه‌ای، توسط پزشک متخصص" },
  { icon: ScanFace,        title: "آنالیز تخصصی صورت", desc: "ارزیابی کامل پوست و تناسب صورت" },
  { icon: Crown,           title: "عضویت در گروه VIP",  desc: "دسترسی به آفرها و رویدادهای اختصاصی" },
  { icon: MessageCircleHeart, title: "ارتباط مستقیم با پزشک", desc: "مشاوره خصوصی و پیگیری شخصی" },
];

const steps = ["مزایا", "تماس", "آدرس", "تصویر", "تایید"];

function VipLanding() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number[]>([0, 1, 2, 3]);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = (i: number) =>
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  const onFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const canNext =
    (step === 0 && selected.length > 0) ||
    (step === 1 && /^09\d{9}$/.test(phone)) ||
    (step === 2 && address.trim().length > 8) ||
    (step === 3 && !!file);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Ambient luxury blobs */}
      <div className="ambient-blob bg-[oklch(0.88_0.14_88)] w-[520px] h-[520px] -top-40 -right-40" />
      <div className="ambient-blob bg-[oklch(0.92_0.08_60)] w-[600px] h-[600px] top-1/3 -left-60" />
      <div className="ambient-blob bg-[oklch(0.85_0.1_75)] w-[400px] h-[400px] bottom-0 right-1/4 opacity-30" />

      <div className="relative z-10 mx-auto max-w-3xl px-5 pt-8 pb-20 sm:pt-14">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <img src={logo} alt="کلینیک لمون" className="h-12 w-auto drop-shadow-sm" />
            <div className="hidden sm:block">
              <p className="text-xs text-muted-foreground tracking-widest">LEMON AESTHETIC</p>
              <p className="text-sm font-semibold">کلینیک زیبایی لمون</p>
            </div>
          </div>
          <div className="glass rounded-full px-4 py-1.5 flex items-center gap-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-[var(--gold-deep)]" />
            <span className="font-medium">پذیرش VIP</span>
          </div>
        </header>

        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between gap-2">
            {steps.map((label, i) => (
              <div key={i} className="flex-1 flex items-center gap-2">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-500 ${
                    i < step ? "btn-gold" : i === step ? "glass ring-2 ring-[var(--gold)]" : "glass opacity-50"
                  }`}>
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`mt-2 text-[10px] sm:text-xs transition-opacity ${i === step ? "opacity-100 font-medium" : "opacity-50"}`}>
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[var(--gold-soft)] to-transparent -mt-5" />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
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

              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {benefits.map((b, i) => {
                  const Icon = b.icon;
                  const isSel = selected.includes(i);
                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i + 0.3 }}
                      whileHover={{ scale: 1.03, y: -4 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => toggle(i)}
                      className={`glass rounded-2xl p-5 text-right relative overflow-hidden group transition-all duration-500 ${
                        isSel ? "ring-2 ring-[var(--gold)] shadow-[0_0_40px_oklch(0.82_0.14_88/0.4)]" : ""
                      }`}
                    >
                      {isSel && (
                        <span className="shine-sweep absolute inset-0 rounded-2xl pointer-events-none" />
                      )}
                      <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-l from-transparent via-[var(--gold)] to-transparent opacity-80" />
                      <div className="flex items-start gap-4">
                        <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                          isSel ? "btn-gold" : "bg-[var(--gold-soft)]/50"
                        }`}>
                          <Icon className={`w-6 h-6 ${isSel ? "text-white" : "text-[var(--gold-deep)]"}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-base sm:text-lg mb-1">{b.title}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSel ? "border-[var(--gold)] bg-[var(--gold)]" : "border-[var(--border)]"
                        }`}>
                          {isSel && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <CTA disabled={!canNext} onClick={next}>ادامه ثبت درخواست</CTA>
            </motion.section>
          )}

          {step === 1 && (
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

          {step === 2 && (
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

          {step === 3 && (
            <StepShell key="img" title="ارسال تصویر صورت" subtitle="ترجیحاً بدون میکاپ سنگین، به‌صورت واضح و طبیعی">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
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
                {preview ? (
                  <div className="relative inline-block">
                    <img src={preview} alt="پیش‌نمایش" className="max-h-64 rounded-2xl shadow-lg mx-auto" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                      className="absolute -top-3 -left-3 w-8 h-8 rounded-full glass flex items-center justify-center"
                      aria-label="حذف"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 mx-auto mb-5 rounded-2xl btn-gold flex items-center justify-center"
                    >
                      <UploadCloud className="w-10 h-10 text-white" />
                    </motion.div>
                    <p className="font-bold text-lg mb-2">تصویر را اینجا رها کنید</p>
                    <p className="text-sm text-muted-foreground">یا برای انتخاب کلیک کنید — JPG / PNG</p>
                  </>
                )}
              </motion.div>
              <Nav onBack={back} onNext={next} canNext={canNext} nextLabel="ثبت نهایی درخواست" />
            </StepShell>
          )}

          {step === 4 && (
            <motion.section
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center py-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="relative w-28 h-28 mx-auto mb-8"
              >
                <div className="absolute inset-0 rounded-full btn-gold animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-[var(--ivory)] flex items-center justify-center">
                  <Check className="w-12 h-12 text-[var(--gold-deep)]" strokeWidth={3} />
                </div>
                <motion.div
                  className="absolute -inset-4 rounded-full"
                  style={{ boxShadow: "0 0 60px oklch(0.82 0.14 88 / 0.6)" }}
                  animate={{ opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                />
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                درخواست شما <span className="gold-text">ثبت شد</span>
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                در اولین فرصت جهت هماهنگی با شما تماس گرفته خواهد شد
              </p>
              <div className="glass rounded-2xl p-5 mt-8 inline-flex items-center gap-3">
                <Crown className="w-5 h-5 text-[var(--gold-deep)]" />
                <span className="text-sm">به خانواده VIP لمون خوش آمدید</span>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <footer className="text-center text-xs text-muted-foreground mt-16">
          © Lemon Aesthetic Center — Tehran
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

function Nav({ onBack, onNext, canNext, nextLabel = "ادامه" }: {
  onBack: () => void; onNext: () => void; canNext: boolean; nextLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 pt-4">
      <button
        onClick={onBack}
        className="glass rounded-2xl px-5 py-3.5 text-sm font-medium flex items-center gap-2 hover:scale-105 transition-transform"
      >
        <ArrowLeft className="w-4 h-4" />
        بازگشت
      </button>
      <CTA onClick={onNext} disabled={!canNext}>{nextLabel}</CTA>
    </div>
  );
}
