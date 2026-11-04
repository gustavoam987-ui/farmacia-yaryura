"use client";

import { AlertTriangle, FileSpreadsheet, LayoutDashboard, LogOut, Package, Pill, Star, Wallet, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabase";

export type Tab = "dashboard" | "finance" | "top" | "alerts" | "products" | "import" | "sale";

export const NAV: { id: Tab; label: string; title: string; subtitle: string; icon: typeof Pill }[] = [
  { id: "dashboard", label: "Panel", title: "Panel general", subtitle: "Resumen del negocio en tiempo real", icon: LayoutDashboard },
  { id: "finance", label: "Finanzas", title: "Finanzas y balance", subtitle: "Inversión, ingresos proyectados y márgenes", icon: Wallet },
  { id: "top", label: "Destacados", title: "Productos destacados", subtitle: "Rotación y productos que más aportan", icon: Star },
  { id: "alerts", label: "Reposición", title: "Reposición de stock", subtitle: "Productos en o por debajo del stock mínimo", icon: AlertTriangle },
  { id: "products", label: "Productos", title: "Productos", subtitle: "Alta, edición y búsqueda", icon: Package },
  { id: "import", label: "Importar", title: "Importar planilla", subtitle: "Actualizá precios desde Excel o CSV", icon: FileSpreadsheet },
  { id: "sale", label: "Venta", title: "Registrar Venta", subtitle: "Cobros y mostrador", icon: ShoppingCart },
];

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white"><Pill size={20} /></span>
      <div className="leading-tight">
        <p className="text-xs font-semibold tracking-wide text-slate-500">FARMACIA</p>
        <p className="font-bold tracking-wide text-brand">YARYURA</p>
      </div>
    </div>
  );
}

type Props = { tab: Tab; onTab: (t: Tab) => void; email?: string; criticalCount: number };

export default function Sidebar({ tab, onTab, email, criticalCount }: Props) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white p-4 lg:flex">
        <div className="px-2 pb-6 pt-2"><Logo /></div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => onTab(id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${tab === id ? "bg-brand-light text-brand-dark" : "text-slate-600 hover:bg-slate-100"}`}>
              <Icon size={18} /> <span className="flex-1 text-left">{label}</span>
              {id === "alerts" && criticalCount > 0 && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">{criticalCount}</span>}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-200 pt-4">
          {email && <p className="mb-2 truncate px-2 text-xs text-slate-500">{email}</p>}
          <button onClick={() => supabase.auth.signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            <LogOut size={18} /> Salir
          </button>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onTab(id)}
            className={`relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${tab === id ? "text-brand" : "text-slate-500"}`}>
            <Icon size={20} /> {label}
            {id === "alerts" && criticalCount > 0 && <span className="absolute right-3 top-1 h-2 w-2 rounded-full bg-red-500" />}
          </button>
        ))}
      </nav>
    </>
  );
}
