"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";

const ars = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

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

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Estás seguro de eliminar el producto "${name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("Error al eliminar: " + error.message);
    } else {
      setProducts(products.filter((p) => String(p.id) !== String(id)));
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;

    const { error } = await supabase
      .from("products")
      .update({
        name: editingProduct.name,
        barcode: editingProduct.barcode,
        purchase_price: Number(editingProduct.purchase_price),
        sale_price: Number(editingProduct.sale_price),
        stock: Number(editingProduct.stock),
      })
      .eq("id", editingProduct.id);

    if (error) {
      alert("Error al actualizar: " + error.message);
    } else {
      setEditingProduct(null);
      fetchProducts();
    }
  }

  const totalProducts = products.length;
  const totalUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const lowStockCount = products.filter((p) => (p.stock || 0) <= ((p as any).min_stock || 5)).length;
  const inventoryCost = products.reduce((acc, p) => acc + (((p as any).purchase_price || 0) * (p.stock || 0)), 0);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-800">Alta, edición y búsqueda</h2>
      </div>

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
                <tr key={String(p.id)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500">{p.barcode || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{(p as any).purchase_price != null ? ars.format((p as any).purchase_price) : "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{(p as any).sale_price != null ? ars.format((p as any).sale_price) : "—"}</td>
                  <td className={`px-4 py-3 font-semibold ${(p.stock || 0) <= ((p as any).min_stock || 5) ? "text-amber-600" : "text-slate-800"}`}>
                    {p.stock ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingProduct({ ...p })}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(String(p.id), p.name)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Eliminar"
                      >
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

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Editar Producto</h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500">Nombre</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Código de barras</label>
                <input
                  type="text"
                  value={editingProduct.barcode || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500">Precio Compra ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingProduct.purchase_price ?? ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, purchase_price: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500">Precio Venta ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingProduct.sale_price ?? ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sale_price: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Stock actual</label>
                <input
                  type="number"
                  value={editingProduct.stock ?? 0}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
