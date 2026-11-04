"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import { ShoppingCart, Search, CheckCircle, AlertCircle, Minus, Plus, Trash2 } from "lucide-react";

type CartItem = {
  product: Product;
  quantity: number;
  isBlister: boolean; // true si vende por blíster/fracción, false si es caja entera
  unitPrice: number;
};

const ars = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export default function RegisterSale({ products, onSaleCompleted }: { products: Product[]; onSaleCompleted: () => void }) {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Filtrar productos para el buscador rápido
  const filtered = search.trim() === "" 
    ? [] 
    : products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        (p.barcode && p.barcode.includes(search))
      ).slice(0, 10);

  const addToCart = (product: Product, isBlister: boolean = false) => {
    setErr(null);
    setMsg(null);
    
    // Si vende por blíster verificamos si tiene unidades por caja definidas (asumimos por defecto 10 si no tiene)
    const unitsPerPackage = product.units_per_package || 10; 
    
    // Calcular precio unitario según corresponda
    let unitPrice = product.sale_price;
    if (isBlister) {
      unitPrice = product.sale_price / unitsPerPackage;
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id && item.isBlister === isBlister);
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex].quantity += 1;
        return copy;
      }
      return [...prev, { product, quantity: 1, isBlister, unitPrice }];
    });
    setSearch("");
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const copy = [...prev];
      const newQty = copy[index].quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      copy[index].quantity = newQty;
      return copy;
    });
  };

  const removeItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!confirm(`¿Confirmar venta por un total de ${ars.format(totalAmount)}? Se descontará el stock automáticamente.`)) return;

    setBusy(true);
    setErr(null);
    setMsg(null);

    try {
      // 1. Descontar stock en la base de datos para cada producto del carrito
      for (const item of cart) {
        const unitsPerPkg = item.product.units_per_package || 10;
        
        // Calcular cuántas unidades absolutas se restan al stock general
        // Si es caja: quantity * 1 (o si tu stock representa cajas enteras). Si es blíster: quantity / unitsPerPkg.
        const stockReduction = item.isBlister 
          ? item.quantity / unitsPerPkg 
          : item.quantity;

        const currentStock = item.product.stock ?? 0;
        const newStock = Math.max(0, currentStock - stockReduction);

        // Actualizar en Supabase
        const { error: updateError } = await supabase
          .from("products")
          .update({ stock: Number(newStock.toFixed(2)) })
          .eq("id", item.product.id);

        if (updateError) throw new Error(updateError.message);

        // Opcional: Registrar movimiento si existe la tabla stock_movements
        await supabase.from("stock_movements").insert({
          product_id: item.product.id,
          change: -stockReduction,
          reason: item.isBlister ? `Venta blíster (${item.quantity} un.)` : `Venta caja (${item.quantity} un.)`
        }).catch(() => {
          // Si la tabla stock_movements no existe aún, ignoramos el error para que la venta no falle
        });
      }

      setMsg("¡Venta registrada con éxito y stock actualizado!");
      setCart([]);
      onSaleCompleted(); // Recarga los productos en la app principal
    } catch (e: any) {
      setErr(e.message || "Error al procesar la venta.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Columna Izquierda / Centro: Buscador y Resultados */}
      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Search size={20} /> Buscar Producto para Venta
          </h2>
          <p className="mt-1 text-sm text-slate-500">Escribí el nombre comercial, monodroga o código de barras.</p>
          
          <div className="relative mt-4">
            <input 
              type="text"
              placeholder="Ej: Tafirol 500, Ibuprofeno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand shadow-sm"
            />
          </div>

          {/* Lista desplegable de resultados de búsqueda */}
          {filtered.length > 0 && (
            <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-md max-h-80 overflow-y-auto">
              {filtered.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      Stock: <span className="font-semibold text-slate-700">{p.stock ?? 0}</span> | Venta caja: <span className="font-semibold text-emerald-600">{ars.format(p.sale_price)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => addToCart(p, false)}
                      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark transition-colors"
                    >
                      + Caja
                    </button>
                    <button 
                      onClick={() => addToCart(p, true)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      + Blíster
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Carrito / Ticket de Mostrador */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[400px]">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3">
              <ShoppingCart size={20} /> Venta Actual
            </h2>

            {cart.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400">El carrito está vacío. Buscá productos para agregarlos.</p>
            ) : (
              <div className="divide-y divide-slate-100 mt-3 max-h-72 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={index} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.product.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.isBlister ? "Formato: Blíster / Fracción" : "Formato: Caja entera"} — {ars.format(item.unitPrice)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                        <button onClick={() => updateQuantity(index, -1)} className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600"><Minus size={12} /></button>
                        <span className="px-2 text-xs font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(index, 1)} className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600"><Plus size={12} /></button>
                      </div>
                      <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4 space-y-4">
            <div className="flex items-center justify-between text-base font-bold text-slate-800">
              <span>Total a cobrar:</span>
              <span className="text-emerald-600 text-lg">{ars.format(totalAmount)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || busy}
              className="w-full rounded-xl bg-brand py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50 transition-colors shadow-sm"
            >
              {busy ? "Procesando..." : "Confirmar Venta y Descontar Stock"}
            </button>
          </div>
        </div>

        {err && <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={16} /> {err}</div>}
        {msg && <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle size={16} /> {msg}</div>}
      </div>
    </div>
  );
}
