"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { calcPrice, type Mode } from "@/lib/pricing";
import type { Product } from "@/lib/types";

type Status = "new" | "changed" | "review" | "same" | "skip";
type Row = { status: Status; barcode: string; name: string; cost: number; product?: Product; sale: number; apply: boolean };
type Cols = { barcode: number; name: number; cost: number };

const ars = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const LABEL: Record<Status, string> = { new: "Nuevo", changed: "Costo cambió", review: "Revisar", same: "Sin cambios", skip: "Sin identificar" };
const norm = (s: unknown) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
const code = (v: unknown) => String(v ?? "").trim().replace(/\.0+$/, "");
const toNum = (v: unknown): number | null => {
  if (typeof v === "number") return v;
  let s = String(v ?? "").replace(/[^\d,.\-]/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
};

export default function ImportPrices({ onDone }: { onDone: () => void }) {
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<unknown[][]>([]);
  const [map, setMap] = useState<Cols>({ barcode: -1, name: -1, cost: -1 });
  const [pct, setPct] = useState(30);
  const [mode, setMode] = useState<Mode>("markup");
  const [round, setRound] = useState(0);
  const [reprice, setReprice] = useState(true);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr(null); setMsg(null); setRows(null);
    try {
      const wb = XLSX.read(await f.arrayBuffer(), { type: "array" });
      const all = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "", raw: true });
      const hi = all.findIndex((r) => r.filter((x) => x !== "").length >= 2);
      if (hi < 0) return setErr("El archivo está vacío.");
      const hdr = all[hi].map((h, i) => String(h || `Columna ${i + 1}`));
      const find = (re: RegExp) => hdr.findIndex((h) => re.test(norm(h)));
      setHeaders(hdr);
      setData(all.slice(hi + 1).filter((r) => r.some((x) => x !== "")));
      setFileName(f.name);
      setMap({
        barcode: find(/(codigo.*barra|ean|barra|cod.*bar)/),
        name: find(/(descrip|producto|nombre|medicamento)/),
        cost: find(/(precio|costo|pcio|importe)/),
      });
    } catch {
      setErr("No se pudo leer el archivo. Usá .xlsx o .csv.");
    }
  }

  async function compare() {
    if (map.cost < 0 || (map.name < 0 && map.barcode < 0)) return setErr("Indicá la columna de precio de compra y al menos la de código o nombre.");
    setBusy(true); setErr(null); setMsg(null);
    const prods: Product[] = [];
    for (let from = 0; ; from += 1000) {
      const { data: d, error } = await supabase.from("products").select("*").range(from, from + 999);
      if (error) { setErr(error.message); setBusy(false); return; }
      prods.push(...(d as Product[]));
      if (!d || d.length < 1000) break;
    }
    const byCode = new Map(prods.filter((p) => p.barcode).map((p) => [code(p.barcode), p]));
    const byName = new Map(prods.map((p) => [norm(p.name), p]));
    const out = data.map((r): Row => {
      const barcode = map.barcode >= 0 ? code(r[map.barcode]) : "";
      const name = map.name >= 0 ? String(r[map.name] ?? "").trim() : "";
      const cost = toNum(r[map.cost]);
      if (cost == null || (!barcode && !name)) return { status: "skip", barcode, name, cost: 0, sale: 0, apply: false };
      const sale = calcPrice(cost, pct, mode, round);
      let p = barcode ? byCode.get(barcode) : undefined;
      let review = false;
      if (!p && name) {
        const q = byName.get(norm(name));
        if (q && (!q.barcode || !barcode)) { p = q; review = true; }
      }
      if (!p) return name ? { status: "new", barcode, name, cost, sale, apply: true } : { status: "skip", barcode, name, cost, sale, apply: false };
      const changed = Math.abs(p.cost_price - cost) > 0.004;
      return { status: review ? "review" : changed ? "changed" : "same", barcode, name, cost, product: p, sale, apply: changed && !review };
    });
    setRows(out);
    setBusy(false);
  }

  async function apply() {
    if (!rows) return;
    const sel = rows.filter((r) => r.apply && (r.status === "new" || r.status === "changed" || r.status === "review"));
    if (!sel.length) return setErr("No hay cambios marcados.");
    if (!confirm(`Se aplicarán ${sel.length} cambios. El stock no se modifica. ¿Confirmar?`)) return;
    setBusy(true); setErr(null);
    const news = sel.filter((r) => r.status === "new").map((r) => ({ barcode: r.barcode || null, name: r.name, cost_price: r.cost, sale_price: r.sale, stock: 0, min_stock: 5 }));
    for (let i = 0; i < news.length; i += 500) {
      const { error } = await supabase.from("products").insert(news.slice(i, i + 500));
      if (error) { setErr(error.message); setBusy(false); return; }
    }
    const ups = sel.filter((r) => r.product);
    for (let i = 0; i < ups.length; i += 20) {
      const res = await Promise.all(ups.slice(i, i + 20).map((r) => {
        const patch: Record<string, unknown> = { cost_price: r.cost };
        if (reprice) patch.sale_price = r.sale;
        if (!r.product!.barcode && r.barcode) patch.barcode = r.barcode;
        return supabase.from("products").update(patch).eq("id", r.product!.id);
      }));
      const bad = res.find((x) => x.error);
      if (bad?.error) { setErr(bad.error.message); setBusy(false); return; }
    }
    setMsg(`Listo: ${news.length} productos nuevos y ${ups.length} actualizados.`);
    setRows(null); setData([]); setHeaders([]); setFileName("");
    setBusy(false);
    onDone();
  }

  const count = (s: Status) => rows?.filter((r) => r.status === s).length ?? 0;
  const field = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-brand";
  const colSelect = (k: keyof Cols, label: string) => (
    <label className="block text-sm font-medium text-slate-600">{label}
      <select className={field} value={map[k]} onChange={(e) => setMap({ ...map, [k]: Number(e.target.value) })}>
        <option value={-1}>— no usar —</option>
        {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
      </select>
    </label>
  );

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><FileSpreadsheet size={20} /> Importar planilla de precios</h2>
        <p className="mt-1 text-sm text-slate-500">Subí el Excel (.xlsx) o CSV de tu proveedor. No se cambia nada hasta que revises y confirmes. El stock nunca se modifica.</p>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className="mt-4 block text-sm" />
        {fileName && <p className="mt-2 text-sm text-slate-500">{fileName}: {data.length} filas leídas.</p>}
      </div>

      {headers.length > 0 && !rows && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold">Indicá qué columna es cada dato</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {colSelect("barcode", "Código de barras")}
            {colSelect("name", "Nombre del producto")}
            {colSelect("cost", "Precio de compra")}
          </div>
          <h3 className="pt-2 font-semibold">Precio de venta</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm font-medium text-slate-600">Margen (%)
              <input type="number" step="any" className={field} value={pct} onChange={(e) => setPct(Number(e.target.value))} />
            </label>
            <label className="block text-sm font-medium text-slate-600">Tipo de cálculo
              <select className={field} value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                <option value="markup">Recargo sobre costo</option>
                <option value="margin">Margen sobre precio de venta</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-600">Redondeo hacia arriba
              <select className={field} value={round} onChange={(e) => setRound(Number(e.target.value))}>
                <option value={0}>Sin redondeo</option><option value={10}>A $10</option><option value={50}>A $50</option><option value={100}>A $100</option>
              </select>
            </label>
          </div>
          <button onClick={compare} disabled={busy} className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
            {busy ? "Comparando…" : "Comparar con mis productos"}
          </button>
        </div>
      )}

      {rows && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {(["new", "changed", "review", "same", "skip"] as Status[]).map((s) => (
              <div key={s} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">{LABEL[s]}</p>
                <p className="mt-1 text-2xl font-semibold">{count(s)}</p>
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={reprice} onChange={(e) => {
              const v = e.target.checked; setReprice(v);
            }} /> Recalcular también el precio de venta de los productos existentes
          </label>
          <p className="text-sm text-slate-500">Las filas «Revisar» coinciden solo por nombre y quedan sin marcar.</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-slate-500"><tr className="border-b border-slate-200">
                {["", "Estado", "Producto", "Costo anterior", "Costo nuevo", "Variación", "Venta nueva"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map((r, i) => ({ r, i })).filter((x) => x.r.status !== "same").slice(0, 300).map(({ r, i }) => {
                  const old = r.product?.cost_price;
                  const v = old ? ((r.cost - old) / old) * 100 : null;
                  return (
                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">{r.status !== "skip" && <input type="checkbox" checked={r.apply} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, apply: e.target.checked } : x)))} />}</td>
                      <td className="px-4 py-3">{LABEL[r.status]}</td>
                      <td className="px-4 py-3 font-medium">{r.name || r.product?.name || r.barcode}</td>
                      <td className="px-4 py-3">{old != null ? ars.format(old) : "—"}</td>
                      <td className="px-4 py-3">{r.status === "skip" ? "—" : ars.format(r.cost)}</td>
                      <td className={`px-4 py-3 ${v != null && v > 0 ? "font-semibold text-red-600" : ""}`}>{v == null ? "—" : `${v.toFixed(1)}%`}</td>
                      <td className="px-4 py-3">{r.status === "skip" ? "—" : r.status === "new" || reprice ? ars.format(r.sale) : "sin cambio"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRows(null)} className="rounded-lg border border-slate-200 px-4 py-2 font-medium hover:bg-slate-100">Volver</button>
            <button onClick={apply} disabled={busy} className="rounded-lg bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
              {busy ? "Aplicando…" : "Confirmar actualización"}
            </button>
          </div>
        </div>
      )}

      {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      {msg && <p className="rounded-lg bg-brand-light p-3 text-sm text-brand-dark">{msg}</p>}
    </section>
  );
}
