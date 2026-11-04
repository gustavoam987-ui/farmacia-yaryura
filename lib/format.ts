export const ars = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
export const int = new Intl.NumberFormat("es-AR");
export const pct = (n: number) => `${n.toFixed(1)}%`;
