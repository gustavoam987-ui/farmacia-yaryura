"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Banknote, ClipboardCopy, PackageX } from "lucide-react";
import KpiCard from "./KpiCard";
import { ars } from "@/lib/format";
import { criticalList } from "@/lib/metrics";
import type { Product } from "@/lib/types";

type Filter = "all" | "zero" | "low";

export default function StockAlerts({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [note, setNote] = useState<string | null>(null);
  const all = useMemo(() => criticalList(products), [products]);
  const list = all.filter((p) => (filter === "zero" ? p.stock <= 0 : filter === "low" ? p.stock > 0 : true));
  const missing = (p: Product) => Math.max(0, p.min_stock - p.stock);
  const total = all.reduce((a, p) => a + missing(p) * p.cost_price, 0);

  async function copy() {
    const text = list.map((p) => `- ${p.name}${p.barcode ? ` (${p.barcode})` : ""}: faltan ${missing(p)} para llegar al mínimo`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setNote("Lista copiada.");
    } catch {
      setNote("El navegador bloqueó el portapapeles.");
    }
    setTimeout(() => setNote(null), 3000);
  }

  const chip = (f: Filter, label: string) => (
    <button onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === f ? "bg-brand text-white" : "border border-slate-200 bg-white hover:bg-slate-100"}`}>{label}</button>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Productos críticos" value={all.length} hint="Stock igual o menor al mínimo" icon={AlertTriangle} tone="amber" />
        <KpiCard label="Sin stock" value={all.filter((p) => p.stock <= 0).length} icon={PackageX} tone="red" />
        <KpiCard label="Costo de reponer hasta el mínimo" value={ars.format(total)} hint="Faltante × precio de compra" icon={Banknote} tone="slate" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {chip("all", "Todos")}{chip("zero", "Sin stock")}{chip("low", "Stock bajo")}
        <button onClick={copy} className="ml-auto flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-100">
          <ClipboardCopy size={16} /> Copiar lista para el pedido
        </button>
        {note && <span className="text-sm text-slate-500">{note}</span>}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-slate-500"><tr className="border-b border-slate-200">
            {["Estado", "Producto", "Código", "Stock", "Mínimo", "Faltan", "Costo de reposición"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.stock <= 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{p.stock <= 0 ? "Sin stock" : "Stock bajo"}</span>
                </td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-slate-500">{p.barcode}</td>
                <td className="px-4 py-3 font-semibold">{p.stock}</td>
                <td className="px-4 py-3">{p.min_stock}</td>
                <td className="px-4 py-3">{missing(p)}</td>
                <td className="px-4 py-3">{ars.format(missing(p) * p.cost_price)}</td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No hay productos para reponer.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
