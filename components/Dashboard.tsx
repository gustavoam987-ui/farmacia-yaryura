"use client";

import { AlertTriangle, Banknote, Boxes, Package, PackageX, TrendingUp } from "lucide-react";
import KpiCard from "./KpiCard";
import type { Tab } from "./Sidebar";
import { ars, int } from "@/lib/format";
import { criticalList, summarize } from "@/lib/metrics";
import type { Product } from "@/lib/types";

export default function Dashboard({ products, onNavigate }: { products: Product[]; onNavigate: (t: Tab) => void }) {
  const s = summarize(products);
  const segments = [
    { label: "Stock normal", n: s.count - s.critical, c: "bg-brand" },
    { label: "Stock bajo", n: s.low, c: "bg-amber-500" },
    { label: "Sin stock", n: s.zero, c: "bg-red-500" },
  ];
  const alerts = [
    { show: s.zero > 0, tone: "text-red-700 bg-red-50", text: `${s.zero} productos sin stock`, to: "alerts" as Tab },
    { show: s.low > 0, tone: "text-amber-700 bg-amber-50", text: `${s.low} productos con stock bajo`, to: "alerts" as Tab },
    { show: s.negative > 0, tone: "text-red-700 bg-red-50", text: `${s.negative} productos con precio de venta menor al costo`, to: "finance" as Tab },
    { show: s.noPrice > 0, tone: "text-amber-700 bg-amber-50", text: `${s.noPrice} productos sin precio de venta`, to: "products" as Tab },
    { show: s.noBarcode > 0, tone: "text-slate-600 bg-slate-100", text: `${s.noBarcode} productos sin código de barras`, to: "products" as Tab },
  ].filter((a) => a.show);
  const urgent = criticalList(products).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Inventario a costo" value={ars.format(s.cost)} hint="Lo invertido en stock" icon={Banknote} />
        <KpiCard label="Inventario a venta" value={ars.format(s.sale)} hint={`Ganancia potencial ${ars.format(s.profit)}`} icon={TrendingUp} />
        <KpiCard label="Productos cargados" value={int.format(s.count)} hint={`${int.format(s.units)} unidades`} icon={Package} tone="slate" />
        <KpiCard label="Unidades en stock" value={int.format(s.units)} icon={Boxes} tone="slate" />
        <KpiCard label="Stock bajo" value={s.low} hint="Igual o menor al mínimo" icon={AlertTriangle} tone="amber" />
        <KpiCard label="Sin stock" value={s.zero} hint="Reponer de inmediato" icon={PackageX} tone="red" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Estado del inventario</h2>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
            {segments.map((x) => <div key={x.label} className={x.c} style={{ width: `${s.count ? (x.n / s.count) * 100 : 0}%` }} />)}
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {segments.map((x) => (
              <li key={x.label} className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${x.c}`} /> {x.label}</span>
                <span className="font-medium">{x.n}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Alertas</h2>
          <ul className="mt-4 space-y-2">
            {alerts.map((a) => (
              <li key={a.text}>
                <button onClick={() => onNavigate(a.to)} className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium ${a.tone}`}>{a.text}</button>
              </li>
            ))}
            {!alerts.length && <li className="text-sm text-slate-500">Todo en orden por ahora.</li>}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Reposición urgente</h2>
          <button onClick={() => onNavigate("alerts")} className="text-sm font-medium text-brand hover:underline">Ver todo</button>
        </div>
        <ul className="mt-3 divide-y divide-slate-100">
          {urgent.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="font-medium">{p.name}</span>
              <span className={p.stock <= 0 ? "font-semibold text-red-600" : "font-semibold text-amber-600"}>{p.stock} / mín. {p.min_stock}</span>
            </li>
          ))}
          {!urgent.length && <li className="py-2.5 text-sm text-slate-500">No hay productos en stock crítico.</li>}
        </ul>
      </section>
    </div>
  );
}
