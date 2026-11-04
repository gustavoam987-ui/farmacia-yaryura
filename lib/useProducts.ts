"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const all: Product[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from("products").select("*").order("id").range(from, from + 999);
      if (error) { setError(error.message); setLoading(false); return; }
      all.push(...(data as Product[]));
      if (!data || data.length < 1000) break;
    }
    setProducts(all);
    setError(null);
    setLoading(false);
  }, []);

  return { products, loading, error, reload };
}
