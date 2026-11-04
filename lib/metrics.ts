import type { Product } from "./types";

export const isCritical = (p: Product) => p.stock <= p.min_stock;

// Primero los agotados, después los de mayor faltante respecto del mínimo.
export function criticalList(ps: Product[]) {
  return ps
    .filter(isCritical)
    .sort((a, b) => (a.stock <= 0 ? 0 : 1) - (b.stock <= 0 ? 0 : 1) || b.min_stock - b.stock - (a.min_stock - a.stock));
}

export function summarize(ps: Product[]) {
  const cost = ps.reduce((a, p) => a + p.stock * p.cost_price, 0);
  const sale = ps.reduce((a, p) => a + p.stock * p.sale_price, 0);
  const profit = sale - cost;
  return {
    count: ps.length,
    units: ps.reduce((a, p) => a + p.stock, 0),
    cost,
    sale,
    profit,
    marginOnSale: sale ? (profit / sale) * 100 : 0,
    markupOnCost: cost ? (profit / cost) * 100 : 0,
    zero: ps.filter((p) => p.stock <= 0).length,
    low: ps.filter((p) => p.stock > 0 && p.stock <= p.min_stock).length,
    critical: ps.filter(isCritical).length,
    noPrice: ps.filter((p) => !p.sale_price).length,
    negative: ps.filter((p) => p.sale_price > 0 && p.sale_price < p.cost_price).length,
    noBarcode: ps.filter((p) => !p.barcode).length,
  };
}
