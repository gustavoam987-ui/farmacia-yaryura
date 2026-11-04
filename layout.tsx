import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Farmacia Yaryura",
  description: "Gestión de inventario y precios",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
