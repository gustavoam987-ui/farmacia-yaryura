"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useProducts } from "@/lib/useProducts";
import { isCritical } from "@/lib/metrics";
import Login from "@/components/Login";
import Sidebar, { Logo, NAV, type Tab } from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import Finance from "@/components/Finance";
import TopProducts from "@/components/TopProducts";
import StockAlerts from "@/components/StockAlerts";
import Products from "@/components/Products";
import ImportPrices from "@/components/ImportPrices";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [version, setVersion] = useState(0);
  const { products, loading, error, reload } = useProducts();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // Los datos de los paneles se actualizan al entrar a cada pestaña.
  useEffect(() => {
    if (session) reload();
  }, [session, tab, version, reload]);

  if (!ready) return null;
  if (!session) return <Login />;

  const current = NAV.find((n) => n.id === tab)!;
  const needsData = tab !== "products" && tab !== "import";

  return (
    <div className="min-h-screen lg:pl-64">
      <Sidebar tab={tab} onTab={setTab} email={session.user.email} criticalCount={products.filter(isCritical).length} />
      <main className="mx-auto max-w-6xl p-4 pb-24 sm:p-8 lg:pb-8">
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <Logo />
          <button onClick={() => supabase.auth.signOut()} aria-label="Salir" className="rounded-lg border border-slate-200 bg-white p-2"><LogOut size={18} /></button>
        </div>
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{current.title}</h1>
          <p className="text-sm text-slate-500">{current.subtitle}</p>
        </header>

        {error && needsData && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading && needsData && !products.length && <p className="text-sm text-slate-500">Cargando datos…</p>}

        {tab === "dashboard" && <Dashboard products={products} onNavigate={setTab} />}
        {tab === "finance" && <Finance products={products} />}
        {tab === "top" && <TopProducts products={products} />}
        {tab === "alerts" && <StockAlerts products={products} />}
        {tab === "products" && <Products />}
        {tab === "import" && <ImportPrices onDone={() => setVersion((v) => v + 1)} />}
      </main>
    </div>
  );
}
