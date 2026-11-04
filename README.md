# Farmacia Yaryura

Next.js (App Router) + TypeScript + Tailwind CSS + Supabase.

## Puesta en marcha

1. `npm install`
2. Copiá `.env.example` a `.env.local` y completá la URL y la anon key de tu proyecto Supabase.
3. En Supabase, creá un usuario en Authentication > Users (correo y contraseña).
4. `npm run dev` y abrí http://localhost:3000

## Importar planilla

En la pestaña «Importar planilla» subís el Excel o CSV del proveedor, asignás las columnas (código, nombre, precio de compra), elegís el margen, revisás la comparación y confirmás. Coincide primero por código de barras; si no hay código, por nombre y lo marca «Revisar». Nunca modifica el stock.

## Tabla `products`

`lib/types.ts` supone estas columnas: `id`, `barcode`, `name`, `cost_price`, `sale_price`, `stock`, `min_stock`.
Si tu tabla usa otros nombres, cambialos en `lib/types.ts` y en `components/Products.tsx`.

## Seguridad (RLS)

Con Row Level Security activado, la tabla necesita políticas. Ejemplo para usuarios autenticados:

```sql
alter table products enable row level security;
create policy "acceso autenticado" on products
  for all to authenticated using (true) with check (true);
```

## Publicar

Subí el repo a GitHub e importalo en Vercel, cargando las dos variables de entorno.

## Paneles

- **Panel**: indicadores (inventario a costo y a venta, productos, stock bajo, sin stock) y alertas.
- **Finanzas**: inversión, ingreso y ganancia proyectados (suponen vender todo el stock actual a los precios actuales) y margen global.
- **Destacados**: rotación de los últimos 30 días (requiere la tabla `stock_movements`) y ranking por ganancia potencial y capital en stock.
- **Reposición**: productos con stock menor o igual al mínimo.

## Tabla opcional para medir rotación

Reemplazá `bigint` por el tipo real del `id` de tu tabla `products` (por ejemplo `uuid`).

```sql
create table stock_movements (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  type text not null check (type in ('in', 'out', 'adjust')),
  quantity integer not null,
  created_at timestamptz not null default now()
);
alter table stock_movements enable row level security;
create policy "acceso autenticado" on stock_movements
  for all to authenticated using (true) with check (true);
```

Cada venta o salida de mercadería debe guardarse como una fila con `type = 'out'`. La app todavía no tiene una pantalla para registrarlas.
