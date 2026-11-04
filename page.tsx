"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LogOut, Pill } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Login from "@/components/Login";
import Products from "@/components/Products";
import ImportPrices from "@/components/ImportPrices";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"products" | "import">("products");
  const [version, setVersion] = useState(0);

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

  const tabClass = (t: string) =>
    `rounded-lg px-4 py-2 text-sm font-medium ${tab === t ? "bg-brand-light text-brand-dark" : "text-slate-600 hover:bg-slate-100"}`;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white"><Pill size={20} /></span>
          <div className="leading-tight">
            <p className="text-xs font-semibold tracking-wide text-slate-500">FARMACIA</p>
            <p className="font-bold tracking-wide text-brand">YARYURA</p>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100">
          <LogOut size={16} /> Salir
        </button>
      </header>
      <nav className="mb-6 flex gap-2">
        <button className={tabClass("products")} onClick={() => setTab("products")}>Productos</button>
        <button className={tabClass("import")} onClick={() => setTab("import")}>Importar planilla</button>
      </nav>
      {tab === "products" ? <Products key={version} /> : <ImportPrices onDone={() => setVersion((v) => v + 1)} />}
    </div>
  );
}
