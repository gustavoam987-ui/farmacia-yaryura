"use client";

import { useState } from "react";
import { Pill } from "lucide-react";
import { supabase } from "@/lib/supabase";
import WelcomeModal from "./WelcomeModal";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
async function submit(e: React.FormEvent) {
  e.preventDefault();
  setBusy(true);
  setError(null);
  
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    setError("Correo o contraseña incorrectos.");
    setBusy(false); // Solo desactivamos el busy si hay error
  } else {
    // ¡Login exitoso! Mostramos la animación de bienvenida
    setShowWelcome(true);
    // No ponemos setBusy(false) aquí para que el botón se mantenga bloqueado mientras se muestra el cartel
  }
}
  
    setBusy(false);
  }

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white"><Pill size={20} /></span>
          <div className="leading-tight">
            <p className="text-xs font-semibold tracking-wide text-slate-500">FARMACIA</p>
            <p className="font-bold tracking-wide text-brand">YARYURA</p>
          </div>
        </div>
        <label className="block text-sm font-medium text-slate-600">
          Correo
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-brand" />
        </label>
        <label className="block text-sm font-medium text-slate-600">
          Contraseña
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-brand" />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
      {/* Aquí colocamos el componente de bienvenida */}
      {showWelcome && (
        <WelcomeModal 
          onFinish={() => {
            window.location.reload();
          }} 
        />
      )}
    </main>
  );
}
