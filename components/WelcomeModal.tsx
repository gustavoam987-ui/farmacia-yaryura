"use client";

export default function WelcomeModal({ onFinish }: { onFinish: () => void }) {
  // Hace que desaparezca solo y recargue después de 2 segundos
  setTimeout(() => {
    onFinish();
  }, 2000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold animate-bounce">
          ✓
        </div>
        <h2 className="text-xl font-bold text-slate-800">¡Bienvenido de nuevo!</h2>
        <p className="text-sm text-slate-500 mt-2">Cargando el sistema de Farmacia Yaryura...</p>
      </div>
    </div>
  );
}
