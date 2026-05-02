import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, Search, Phone, MapPin, ImageIcon, LogOut, RefreshCw,
  Hash, Calendar, ShieldAlert, X, Check, Crown
} from "lucide-react";
import logo from "@/assets/lemon-logo-neon.webp";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "داشبورد ادمین | کلینیک لمون" }],
  }),
  component: AdminPage,
});

type Submission = {
  id: string;
  ref_code: string;
  phone: string;
  address: string;
  selected_benefits: number[];
  photo_path: string | null;
  photo_quality: {
    width?: number; height?: number; score?: number; passed?: boolean;
    brightness?: number; sharpness?: number; sizeKB?: number;
  } | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

const BENEFIT_LABELS = [
  "هدیه بوتاکس مصپورت",
  "آنالیز تخصصی چهره",
  "عضویت در گروه VIP",
  "ارتباط مستقیم با پزشک",
];

function AdminPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "contacted" | "approved" | "rejected">("all");
  const [selected, setSelected] = useState<Submission | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/auth" });
        return;
      }
      setUserEmail(session.user.email ?? null);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      const admin = (roles ?? []).some((r) => r.role === "admin");
      setIsAdmin(admin);
      setAuthChecked(true);
      if (admin) load();
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/auth" });
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vip_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("خطا در بارگذاری: " + error.message);
    } else {
      setItems((data ?? []) as Submission[]);
    }
    setLoading(false);
  };

  const openItem = async (s: Submission) => {
    setSelected(s);
    setPhotoUrl(null);
    if (s.photo_path) {
      const { data, error } = await supabase.storage
        .from("vip-photos")
        .createSignedUrl(s.photo_path, 60 * 10);
      if (!error && data) setPhotoUrl(data.signedUrl);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("vip_submissions")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("خطا در بروزرسانی");
    } else {
      toast.success("وضعیت بروزرسانی شد");
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
      if (selected?.id === id) setSelected({ ...selected, status });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("این درخواست حذف شود؟")) return;
    const { error } = await supabase.from("vip_submissions").delete().eq("id", id);
    if (error) {
      toast.error("خطا در حذف");
    } else {
      toast.success("حذف شد");
      setItems((prev) => prev.filter((it) => it.id !== id));
      setSelected(null);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const filtered = items.filter((it) => {
    if (statusFilter !== "all" && it.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      it.phone.includes(q) ||
      it.ref_code.toLowerCase().includes(q) ||
      it.address.toLowerCase().includes(q)
    );
  });

  if (!authChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--gold-deep)]" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center px-5">
        <div className="glass rounded-3xl p-8 max-w-md text-center">
          <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">دسترسی غیرمجاز</h1>
          <p className="text-sm text-muted-foreground mb-2">
            حساب شما (<span className="font-mono">{userEmail}</span>) نقش ادمین ندارد.
          </p>
          <p className="text-xs text-muted-foreground mb-5">
            از طریق Cloud → Database → user_roles یک رکورد با نقش <code>admin</code> برای حساب خود اضافه کنید.
          </p>
          <div className="flex gap-2 justify-center">
            <button onClick={signOut} className="glass-input rounded-xl px-4 py-2 text-sm">
              خروج
            </button>
            <Link to="/" className="btn-gold rounded-xl px-4 py-2 text-sm font-bold">
              صفحه اصلی
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 sm:px-6 py-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="لمون" className="h-10 w-auto neon-logo" />
          <div>
            <p className="text-[10px] tracking-[0.3em] text-[var(--gold-deep)]">ADMIN PANEL</p>
            <h1 className="text-lg font-bold">داشبورد VIP لمون</h1>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-xs text-muted-foreground" dir="ltr">{userEmail}</span>
          <button onClick={load} className="glass-input rounded-xl p-2.5" title="بروزرسانی">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={signOut} className="glass-input rounded-xl px-3 py-2 text-sm flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            خروج
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "کل درخواست‌ها", value: items.length, color: "text-foreground" },
          { label: "جدید", value: items.filter((i) => i.status === "new").length, color: "text-[var(--gold-deep)]" },
          { label: "تایید شده", value: items.filter((i) => i.status === "approved").length, color: "text-emerald-600" },
          { label: "رد شده", value: items.filter((i) => i.status === "rejected").length, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4">
            <p className="text-[11px] text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute top-3 right-3 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="جستجو در شماره، کد، آدرس…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full rounded-2xl py-2.5 pr-10 pl-4 text-sm"
          />
        </div>
        <div className="flex gap-1 glass rounded-2xl p-1">
          {(["all", "new", "contacted", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                statusFilter === s ? "btn-gold text-white" : "hover:bg-[var(--gold-soft)]/30"
              }`}
            >
              {s === "all" ? "همه" : s === "new" ? "جدید" : s === "contacted" ? "تماس" : s === "approved" ? "تایید" : "رد"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--gold-deep)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
          <Crown className="w-10 h-10 mx-auto mb-3 opacity-40" />
          هیچ درخواستی یافت نشد
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((it) => (
            <button
              key={it.id}
              onClick={() => openItem(it)}
              className="glass rounded-2xl p-4 text-right hover:scale-[1.005] transition flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--gold-soft)]/40 flex items-center justify-center shrink-0">
                {it.photo_path ? (
                  <ImageIcon className="w-5 h-5 text-[var(--gold-deep)]" />
                ) : (
                  <Crown className="w-5 h-5 text-[var(--gold-deep)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-[var(--gold-deep)]">{it.ref_code}</span>
                  <StatusBadge status={it.status} />
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span dir="ltr" className="font-medium">{it.phone}</span>
                  <span className="text-muted-foreground truncate">{it.address}</span>
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0">
                {new Date(it.created_at).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" })}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="glass rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--ivory)" }}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 left-4 w-9 h-9 rounded-full glass-input flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <Hash className="w-4 h-4 text-[var(--gold-deep)]" />
                <span className="font-mono text-sm text-[var(--gold-deep)]">{selected.ref_code}</span>
                <StatusBadge status={selected.status} />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(selected.created_at).toLocaleString("fa-IR")}
              </p>
            </div>

            <div className="grid sm:grid-cols-[200px_1fr] gap-5 mb-5">
              <div className="glass-input rounded-2xl overflow-hidden aspect-[3/4] bg-[var(--gold-soft)]/30 flex items-center justify-center">
                {photoUrl ? (
                  <a href={photoUrl} target="_blank" rel="noopener noreferrer">
                    <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                  </a>
                ) : selected.photo_path ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--gold-deep)]" />
                ) : (
                  <span className="text-xs text-muted-foreground">بدون عکس</span>
                )}
              </div>
              <div className="space-y-3 text-sm">
                <Field icon={<Phone className="w-4 h-4" />} label="شماره تماس">
                  <a href={`tel:${selected.phone}`} dir="ltr" className="font-bold text-[var(--gold-deep)]">
                    {selected.phone}
                  </a>
                </Field>
                <Field icon={<MapPin className="w-4 h-4" />} label="آدرس">
                  <span>{selected.address}</span>
                </Field>
                {selected.photo_quality && (
                  <Field icon={<ImageIcon className="w-4 h-4" />} label="کیفیت عکس">
                    <span>
                      امتیاز {selected.photo_quality.score}٪
                      {selected.photo_quality.width && (
                        <> · {selected.photo_quality.width}×{selected.photo_quality.height}</>
                      )}
                      {selected.photo_quality.passed ? (
                        <span className="text-emerald-600 mr-2">✓ تایید</span>
                      ) : (
                        <span className="text-destructive mr-2">رد</span>
                      )}
                    </span>
                  </Field>
                )}
                <Field icon={<Crown className="w-4 h-4" />} label="مزایای انتخاب‌شده">
                  <div className="flex flex-wrap gap-1.5">
                    {selected.selected_benefits.map((i) => (
                      <span key={i} className="glass-input rounded-full px-2.5 py-0.5 text-[11px]">
                        {BENEFIT_LABELS[i] ?? `#${i}`}
                      </span>
                    ))}
                  </div>
                </Field>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">تغییر وضعیت:</p>
              <div className="flex flex-wrap gap-2">
                {(["new", "contacted", "approved", "rejected"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected.id, s)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                      selected.status === s ? "btn-gold text-white" : "glass-input"
                    }`}
                  >
                    {s === "new" ? "جدید" : s === "contacted" ? "تماس گرفته شد" : s === "approved" ? "تایید" : "رد"}
                  </button>
                ))}
                <button
                  onClick={() => remove(selected.id)}
                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 mr-auto"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mb-0.5">
        {icon}
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    new: { label: "جدید", cls: "bg-[var(--gold)]/20 text-[var(--gold-deep)]" },
    contacted: { label: "در تماس", cls: "bg-blue-500/15 text-blue-700" },
    approved: { label: "تایید", cls: "bg-emerald-500/15 text-emerald-700" },
    rejected: { label: "رد", cls: "bg-destructive/15 text-destructive" },
  };
  const v = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${v.cls}`}>
      {v.label}
    </span>
  );
}