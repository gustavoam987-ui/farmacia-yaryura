export default function Bar({ value, max, className = "bg-brand" }: { value: number; max: number; className?: string }) {
  const w = value > 0 && max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${className}`} style={{ width: `${w}%` }} />
    </div>
  );
}
