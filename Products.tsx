"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product, ProductInput } from "@/lib/types";

const ars = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const empty: ProductInput = { barcode: "", name: "", cost_price: 0, sale_price: 0, stock: 0, min_stock: 5 };

export default function Products() {
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<ProductInput | null>(null);
  const [editId, setEditId] = useState<Product["id"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("name").limit(2000);
    if (error) setError(error.message);
    else {
      setItems(data as Product[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? items.filter((p) => p.name.toLowerCase().includes(t) || (p.barcode ?? "").includes(t)) : items;
  }, [items, q]);

  const stats = useMemo(() => ({
    total: items.length,
    units: items.reduce((a, p) => a + p.stock, 0),
    low: items.filter((p) => p.stock <= p.min_stock).length,
    value: items.reduce((a, p) => a + p.stock * p.cost_price, 0),
  }), [items]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const payload = { ...form, barcode: form.barcode?.trim() || null };
    const { error } =
      editId === null
        ? await supabase.from("products").insert(payload)
        : await supabase.from("products").update(payload).eq("id", editId);
    if (error) return setError(error.message);
    setForm(null);
    setEditId(null);
    load();
  }

  async function remove(p: Product) {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) setError(error.message);
    else load();
  }

  const num = (k: keyof ProductInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => (f ? { ...f, [k]: Number(e.target.value) } : f));
  const field = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-brand";

  return (
    <section>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Productos", stats.total],
          ["Unidades", stats.units],
          ["Stock bajo", stats.low],
          ["Inventario a costo", ars.format(stats.value)],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o código de barras"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 outline-none focus:border-brand" />
        </div>
        <button onClick={() => { setEditId(null); setForm({ ...empty }); }}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark">
          <Plus size={18} /> Agregar producto
        </button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-slate-500">
            <tr className="border-b border-slate-200">
              {["Producto", "Código", "Compra", "Venta", "Stock", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-slate-500">{p.barcode}</td>
                <td className="px-4 py-3">{ars.format(p.cost_price)}</td>
                <td className="px-4 py-3">{ars.format(p.sale_price)}</td>
                <td className={`px-4 py-3 font-semibold ${p.stock === 0 ? "text-red-600" : p.stock <= p.min_stock ? "text-amber-600" : ""}`}>{p.stock}</td>
                <td className="px-4 py-3 text-right">
                  <button aria-label="Editar" onClick={() => { setEditId(p.id); setForm({ barcode: p.barcode, name: p.name, cost_price: p.cost_price, sale_price: p.sale_price, stock: p.stock, min_stock: p.min_stock }); }}
                    className="rounded-md p-2 hover:bg-slate-100"><Pencil size={16} /></button>
                  <button aria-label="Eliminar" onClick={() => remove(p)} className="rounded-md p-2 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{loading ? "Cargando…" : "No hay productos para mostrar."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-10 grid place-items-center bg-black/40 p-4">
          <form onSubmit={save} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editId === null ? "Nuevo producto" : "Editar producto"}</h2>
              <button type="button" aria-label="Cerrar" onClick={() => setForm(null)}><X size={18} /></button>
            </div>
            <label className="block text-sm font-medium text-slate-600">Nombre
              <input required className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="block text-sm font-medium text-slate-600">Código de barras
              <input className={field} value={form.barcode ?? ""} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-slate-600">Precio de compra
                <input type="number" min={0} step="any" className={field} value={form.cost_price} onChange={num("cost_price")} />
              </label>
              <label className="block text-sm font-medium text-slate-600">Precio de venta
                <input type="number" min={0} step="any" className={field} value={form.sale_price} onChange={num("sale_price")} />
              </label>
              <label className="block text-sm font-medium text-slate-600">Stock
                <input type="number" min={0} className={field} value={form.stock} onChange={num("stock")} />
              </label>
              <label className="block text-sm font-medium text-slate-600">Stock mínimo
                <input type="number" min={0} className={field} value={form.min_stock} onChange={num("min_stock")} />
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setForm(null)} className="rounded-lg border border-slate-200 px-4 py-2 font-medium hover:bg-slate-100">Cancelar</button>
              <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
