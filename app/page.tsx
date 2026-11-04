"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LogOut, Pill, Package, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Login from "@/components/Login";
import Products from "@/components/Products";
import ImportPrices from "@/components/ImportPrices";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "import">("products");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return null;
  if (!session) return <Login />;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white">
              <Pill size={20} />
            </span>
            <div className="leading-tight">
              <p className="text-xs font-semibold tracking-wide text-slate-500">FARMACIA</p>
              <p className="font-bold tracking-wide text-brand">YARYURA</p>
            </div>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100 sm:hidden"
          >
            <LogOut size={16} /> Salir
          </button>
        </div>

        {/* Pestañas de navegación */}
        <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "products"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Package size={16} /> Productos
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "import"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileSpreadsheet size={16} /> Importar Planilla
          </button>
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100"
        >
          <LogOut size={16} /> Salir
        </button>
      </header>

      {/* Renderizado de la pestaña activa */}
      {activeTab === "products" ? <Products /> : <ImportPrices onDone={() => setActiveTab("products")} />}
    </div>
  );
}
