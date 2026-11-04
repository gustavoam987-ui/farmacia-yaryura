"use client";

import { useEffect } from "react";

export default function WelcomeModal({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000); // 2 segundos de animación visible
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          ✓
        </div>
        <h2 className="text-xl font-bold text-slate-800">¡Bienvenido de nuevo!</h2>
        <p className="text-sm text-slate-500 mt-2">Cargando el sistema de Farmacia Yaryura...</p>
      </div>
    </div>
  );
}
