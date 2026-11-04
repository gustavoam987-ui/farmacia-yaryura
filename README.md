# Farmacia Yaryura

Next.js (App Router) + TypeScript + Tailwind CSS + Supabase.

## Puesta en marcha

1. `npm install`
2. Copiá `.env.example` a `.env.local` y completá la URL y la anon key de tu proyecto Supabase.
3. En Supabase, creá un usuario en Authentication > Users (correo y contraseña).
4. `npm run dev` y abrí http://localhost:3000

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
