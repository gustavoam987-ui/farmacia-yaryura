"use client";

import { useEffect, useMemo, useState } from "react";
import Bar from "./Bar";
import { ars, int } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";

type Rotation = { id: string; qty: number };

export default function TopProducts({ products }: { products: Product[] }) {
  const [rotation, setRotation] = useState<Rotation[] | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 30 * 864e5).toISOString();
      const { data, error } = await supabase
        .from("stock_movements").select("product_id, quantity").eq("type", "out").gte("created_at", since).limit(10000);
      if (error) { setMissing(true); return; }
      const m = new Map<string, number>();
      (data ?? []).forEach((r) => m.set(String(r.product_id), (m.get(String(r.product_id)) ?? 0) + Math.abs(Number(r.quantity))));
      setRotation([...m].map(([id, qty]) => ({ id, qty })).sort((a, b) => b.qty - a.qty).slice(0, 10));
    })();
  }, []);

  const byId = useMemo(() => new Map(products.map((p) => [String(p.id), p])), [products]);
  const topProfit = [...products].filter((p) => p.stock > 0).sort((a, b) => b.stock * (b.sale_price - b.cost_price) - a.stock * (a.sale_price - a.cost_price)).slice(0, 8);
  const topCapital = [...products].sort((a, b) => b.stock * b.cost_price - a.stock * a.cost_price).slice(0, 8);
  const maxQty = rotation?.[0]?.qty ?? 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Más movidos en los últimos 30 días</h2>
        {missing && (
          <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            Para medir la rotación hace falta registrar las salidas de mercadería en una tabla <b>stock_movements</b>, que todavía no existe en tu Supabase. El README trae el SQL para crearla. Mientras tanto, abajo ves los productos que más aportan según su stock y precio.
          </p>
        )}
        {rotation && !rotation.length && <p className="mt-3 text-sm text-slate-500">Todavía no hay egresos registrados en los últimos 30 días.</p>}
        {rotation && rotation.length > 0 && (
          <ul className="mt-4 space-y-4">
            {rotation.map((r, i) => (
              <li key={r.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{i + 1}. {byId.get(r.id)?.name ?? `Producto ${r.id}`}</span>
                  <span>{int.format(r.qty)} unidades</span>
                </div>
                <Bar value={r.qty} max={maxQty} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Mayor ganancia potencial</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {topProfit.map((p) => (
              <li key={p.id} className="flex justify-between gap-3 py-2.5">
                <span className="font-medium">{p.name}</span>
                <span className="font-semibold">{ars.format(p.stock * (p.sale_price - p.cost_price))}</span>
              </li>
            ))}
            {!topProfit.length && <li className="py-2.5 text-slate-500">Sin datos para mostrar.</li>}
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Mayor capital en stock</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {topCapital.map((p) => (
              <li key={p.id} className="flex justify-between gap-3 py-2.5">
                <span className="font-medium">{p.name}</span>
                <span className="font-semibold">{ars.format(p.stock * p.cost_price)}</span>
              </li>
            ))}
            {!topCapital.length && <li className="py-2.5 text-slate-500">Sin datos para mostrar.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
