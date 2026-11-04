"use client";

import { useEffect } from "react";
import { Pill } from "lucide-react";

export default function WelcomeModal({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2200); // Duración de la transición de bienvenida
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md transition-all duration-500 animate-fade-in">
      <div className="flex flex-col items-center text-center space-y-4 scale-100 animate-bounce">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand text-white shadow-xl">
          <Pill size={40} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            ¡Bienvenido!
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Farmacia Yaryura • Preparando tu espacio de trabajo
          </p>
        </div>
        <div className="mt-4 flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand animate-ping"></span>
          <span className="h-2 w-2 rounded-full bg-brand animate-pulse"></span>
          <span className="h-2 w-2 rounded-full bg-brand animate-bounce"></span>
        </div>
      </div>
    </div>
  );
}
