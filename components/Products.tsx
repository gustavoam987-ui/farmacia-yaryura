"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";

const ars = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("name");
    if (!error && data) {
      setProducts(data as Product[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  // Cálculos corregidos usando min_stock
  const totalProducts = products.length;
  const totalUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const lowStockCount = products.filter((p) => (p.stock || 0) <= ((p as any).min_stock || 5)).length;
  const inventoryCost = products.reduce((acc, p) => acc + ((p.purchase_price || 0) * (p.stock || 0)), 0);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-800">Alta, edición y búsqueda</h2>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Productos</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{totalProducts}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Unidades</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{totalUnits}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Stock bajo</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{lowStockCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Inventario a costo</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{ars.format(inventoryCost)}</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o código de barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Compra</th>
              <th className="px-4 py-3 font-medium">Venta</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Cargando productos...</td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No se encontraron productos.</td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500">{p.barcode || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{p.purchase_price != null ? ars.format(p.purchase_price) : "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{p.sale_price != null ? ars.format(p.sale_price) : "—"}</td>
                  <td className={`px-4 py-3 font-semibold ${(p.stock || 0) <= ((p as any).min_stock || 5) ? "text-amber-600" : "text-slate-800"}`}>
                    {p.stock ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
