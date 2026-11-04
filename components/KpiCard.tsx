import type { LucideIcon } from "lucide-react";

const TONES = {
  brand: "bg-brand-light text-brand-dark",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  slate: "bg-slate-100 text-slate-600",
};

type Props = { label: string; value: string | number; hint?: string; icon: LucideIcon; tone?: keyof typeof TONES };

export default function KpiCard({ label, value, hint, icon: Icon, tone = "brand" }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${TONES[tone]}`}><Icon size={18} /></span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
