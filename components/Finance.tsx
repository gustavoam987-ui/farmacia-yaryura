"use client";

import { Banknote, Percent, PiggyBank, TrendingUp } from "lucide-react";
import Bar from "./Bar";
import KpiCard from "./KpiCard";
import { ars, int, pct } from "@/lib/format";
import { summarize } from "@/lib/metrics";
import type { Product } from "@/lib/types";

const BUCKETS: { label: string; test: (m: number) => boolean; color: string }[] = [
  { label: "Pérdida (venta menor al costo)", test: (m) => m < 0, color: "bg-red-500" },
  { label: "0% a 10%", test: (m) => m >= 0 && m < 10, color: "bg-amber-500" },
  { label: "10% a 20%", test: (m) => m >= 10 && m < 20, color: "bg-lime-500" },
  { label: "20% a 30%", test: (m) => m >= 20 && m < 30, color: "bg-emerald-500" },
  { label: "30% o más", test: (m) => m >= 30, color: "bg-brand" },
];

export default function Finance({ products }: { products: Product[] }) {
  const s = summarize(products);
  const priced = products.filter((p) => p.stock > 0 && p.sale_price > 0);
  const margin = (p: Product) => ((p.sale_price - p.cost_price) / p.sale_price) * 100;
  const buckets = BUCKETS.map((b) => {
    const list = priced.filter((p) => b.test(margin(p)));
    return { ...b, n: list.length, profit: list.reduce((a, p) => a + p.stock * (p.sale_price - p.cost_price), 0) };
  });
  const maxN = Math.max(0, ...buckets.map((b) => b.n));
  const top = [...priced].sort((a, b) => b.stock * (b.sale_price - b.cost_price) - a.stock * (a.sale_price - a.cost_price)).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Inversión en stock" value={ars.format(s.cost)} hint="Stock actual × precio de compra" icon={PiggyBank} tone="slate" />
        <KpiCard label="Ingreso proyectado" value={ars.format(s.sale)} hint="Stock actual × precio de venta" icon={Banknote} />
        <KpiCard label="Ganancia estimada" value={ars.format(s.profit)} icon={TrendingUp} />
        <KpiCard label="Margen global" value={pct(s.marginOnSale)} hint={`Recargo sobre costo: ${pct(s.markupOnCost)}`} icon={Percent} />
      </div>
      <p className="text-sm text-slate-500">La proyección supone vender todo el stock actual a los precios actuales. No incluye ventas reales, descuentos ni gastos.</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Productos según su margen</h2>
          <ul className="mt-4 space-y-4">
            {buckets.map((b) => (
              <li key={b.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{b.label}</span>
                  <span className="font-medium">{int.format(b.n)} productos</span>
                </div>
                <Bar value={b.n} max={maxN} className={b.color} />
                <p className="mt-1 text-xs text-slate-500">Ganancia estimada: {ars.format(b.profit)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Mayor ganancia potencial</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="text-slate-500"><tr className="border-b border-slate-200">
                {["Producto", "Stock", "Ganancia unit.", "Ganancia total"].map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}
              </tr></thead>
              <tbody>
                {top.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3 font-medium">{p.name}</td>
                    <td className="py-2 pr-3">{p.stock}</td>
                    <td className="py-2 pr-3">{ars.format(p.sale_price - p.cost_price)}</td>
                    <td className="py-2 pr-3 font-semibold">{ars.format(p.stock * (p.sale_price - p.cost_price))}</td>
                  </tr>
                ))}
                {!top.length && <tr><td colSpan={4} className="py-6 text-center text-slate-500">Sin datos para mostrar.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
