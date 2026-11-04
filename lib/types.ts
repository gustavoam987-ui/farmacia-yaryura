// Ajustá estos campos a las columnas reales de tu tabla "products".
export type Product = {
  id: number | string;
  barcode: string | null;
  name: string;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
};

export type ProductInput = Omit<Product, "id">;
