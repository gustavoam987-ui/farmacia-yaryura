export type Mode = "markup" | "margin";

// markup: recargo sobre costo (10.000 con 30% = 13.000)
// margin: margen sobre precio de venta (10.000 con 30% = 14.285,71)
export function calcPrice(cost: number, pct: number, mode: Mode, round: number): number {
  const v = mode === "margin" && pct < 100 ? cost / (1 - pct / 100) : cost * (1 + pct / 100);
  return round > 1 ? Math.ceil(v / round) * round : Math.round(v * 100) / 100;
}
