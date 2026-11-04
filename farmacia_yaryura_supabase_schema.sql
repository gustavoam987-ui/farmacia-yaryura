-- Farmacia Yaryura — esquema inicial Supabase
-- Ejecutar completo en Supabase > SQL Editor > New query.
-- Luego crear el primer usuario en Authentication > Users y asignarlo como admin
-- ejecutando el INSERT indicado al final (reemplazar el UUID).

create extension if not exists pgcrypto;

-- Usuarios habilitados para operar la farmacia.
create table if not exists public.app_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'operator'
    check (role in ('admin','operator','viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_pharmacy_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_users u
    where u.user_id = (select auth.uid()) and u.active = true
  );
$$;

create or replace function public.is_pharmacy_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_users u
    where u.user_id = (select auth.uid())
      and u.active = true and u.role = 'admin'
  );
$$;

-- Catálogo de productos.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  barcode text,
  name text not null,
  active_ingredient text not null default '',
  laboratory text not null default '',
  presentation text not null default '',
  concentration text not null default '',
  category text not null default '',
  purchase_price numeric(14,2) not null default 0 check (purchase_price >= 0),
  sale_price numeric(14,2) not null default 0 check (sale_price >= 0),
  margin numeric(8,3) not null default 0,
  stock numeric(14,3) not null default 0 check (stock >= 0),
  minimum_stock numeric(14,3) not null default 0 check (minimum_stock >= 0),
  supplier text not null default 'Droguería del Sud',
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create unique index if not exists products_barcode_unique
  on public.products (barcode)
  where barcode is not null and barcode <> '';

create index if not exists products_name_search_idx
  on public.products using gin (to_tsvector('simple', name || ' ' || active_ingredient));

-- Lotes: el vencimiento debe registrarse por lote, no en la ficha general.
create table if not exists public.stock_batches (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  lot_number text not null default '',
  expiry_date date,
  quantity numeric(14,3) not null default 0 check (quantity >= 0),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists stock_batches_expiry_idx
  on public.stock_batches (expiry_date);

-- Historial auditable de movimientos.
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  batch_id uuid references public.stock_batches(id) on delete restrict,
  movement_type text not null
    check (movement_type in ('in','out','adjustment','sale','return','import')),
  quantity numeric(14,3) not null,
  stock_before numeric(14,3) not null,
  stock_after numeric(14,3) not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists stock_movements_product_date_idx
  on public.stock_movements (product_id, created_at desc);

-- Historial de importaciones de listas de proveedores.
create table if not exists public.price_imports (
  id uuid primary key default gen_random_uuid(),
  supplier text not null default 'Droguería del Sud',
  file_name text not null default '',
  rows_total integer not null default 0,
  rows_added integer not null default 0,
  rows_updated integer not null default 0,
  rows_skipped integer not null default 0,
  status text not null default 'preview'
    check (status in ('preview','applied','cancelled','failed')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.price_import_items (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.price_imports(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  barcode text not null default '',
  product_name text not null default '',
  old_purchase_price numeric(14,2),
  new_purchase_price numeric(14,2),
  status text not null default 'review'
    check (status in ('new','price_changed','unchanged','review','skipped','applied')),
  created_at timestamptz not null default now()
);

-- Configuración general de precios de la farmacia.
create table if not exists public.pharmacy_settings (
  id integer primary key default 1 check (id = 1),
  default_margin numeric(8,3) not null default 30,
  margin_method text not null default 'markup'
    check (margin_method in ('markup','margin')),
  rounding numeric(14,2) not null default 1 check (rounding > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.pharmacy_settings (id)
values (1)
on conflict (id) do nothing;

-- updated_at automático.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- RLS en todas las tablas expuestas.
alter table public.app_users enable row level security;
alter table public.products enable row level security;
alter table public.stock_batches enable row level security;
alter table public.stock_movements enable row level security;
alter table public.price_imports enable row level security;
alter table public.price_import_items enable row level security;
alter table public.pharmacy_settings enable row level security;

-- Los usuarios habilitados pueden consultar; solo admin administra usuarios.
drop policy if exists "app_users_read_self_or_admin" on public.app_users;
create policy "app_users_read_self_or_admin"
on public.app_users for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_pharmacy_admin()));

drop policy if exists "app_users_admin_manage" on public.app_users;
create policy "app_users_admin_manage"
on public.app_users for all to authenticated
using ((select public.is_pharmacy_admin()))
with check ((select public.is_pharmacy_admin()));

-- Catálogo: admin y operador pueden modificar; viewer solo consulta.
drop policy if exists "products_read_members" on public.products;
create policy "products_read_members"
on public.products for select to authenticated
using ((select public.is_pharmacy_user()));

drop policy if exists "products_write_operators" on public.products;
create policy "products_write_operators"
on public.products for all to authenticated
using (exists (
  select 1 from public.app_users u
  where u.user_id = (select auth.uid())
    and u.active and u.role in ('admin','operator')
))
with check (exists (
  select 1 from public.app_users u
  where u.user_id = (select auth.uid())
    and u.active and u.role in ('admin','operator')
));

-- Lotes y movimientos: miembros leen; operadores/admin escriben.
drop policy if exists "batches_read_members" on public.stock_batches;
create policy "batches_read_members" on public.stock_batches
for select to authenticated using ((select public.is_pharmacy_user()));
drop policy if exists "batches_write_operators" on public.stock_batches;
create policy "batches_write_operators" on public.stock_batches
for all to authenticated
using (exists (select 1 from public.app_users u where u.user_id=(select auth.uid()) and u.active and u.role in ('admin','operator')))
with check (exists (select 1 from public.app_users u where u.user_id=(select auth.uid()) and u.active and u.role in ('admin','operator')));

drop policy if exists "movements_read_members" on public.stock_movements;
create policy "movements_read_members" on public.stock_movements
for select to authenticated using ((select public.is_pharmacy_user()));
drop policy if exists "movements_write_operators" on public.stock_movements;
create policy "movements_write_operators" on public.stock_movements
for insert to authenticated
with check (exists (select 1 from public.app_users u where u.user_id=(select auth.uid()) and u.active and u.role in ('admin','operator')));

-- Importaciones y sus filas: solo admin/operador.
drop policy if exists "imports_manage_operators" on public.price_imports;
create policy "imports_manage_operators" on public.price_imports
for all to authenticated
using (exists (select 1 from public.app_users u where u.user_id=(select auth.uid()) and u.active and u.role in ('admin','operator')))
with check (exists (select 1 from public.app_users u where u.user_id=(select auth.uid()) and u.active and u.role in ('admin','operator')));

drop policy if exists "import_items_manage_operators" on public.price_import_items;
create policy "import_items_manage_operators" on public.price_import_items
for all to authenticated
using (exists (select 1 from public.app_users u where u.user_id=(select auth.uid()) and u.active and u.role in ('admin','operator')))
with check (exists (select 1 from public.app_users u where u.user_id=(select auth.uid()) and u.active and u.role in ('admin','operator')));

drop policy if exists "settings_read_members" on public.pharmacy_settings;
create policy "settings_read_members" on public.pharmacy_settings
for select to authenticated using ((select public.is_pharmacy_user()));
drop policy if exists "settings_write_admin" on public.pharmacy_settings;
create policy "settings_write_admin" on public.pharmacy_settings
for all to authenticated
using ((select public.is_pharmacy_admin()))
with check ((select public.is_pharmacy_admin()));

-- No se conceden permisos de lectura/escritura a usuarios anónimos.
revoke all on public.app_users, public.products, public.stock_batches,
  public.stock_movements, public.price_imports, public.price_import_items,
  public.pharmacy_settings from anon;

grant select, insert, update, delete on public.app_users to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.stock_batches to authenticated;
grant select, insert on public.stock_movements to authenticated;
grant select, insert, update, delete on public.price_imports to authenticated;
grant select, insert, update, delete on public.price_import_items to authenticated;
grant select, insert, update, delete on public.pharmacy_settings to authenticated;

-- PASO FINAL: después de crear el usuario propietario en Authentication > Users,
-- copiá su UUID y ejecutá esta sentencia reemplazando EL-UUID-DEL-PROPIETARIO:
-- insert into public.app_users (user_id, display_name, role, active)
-- values ('EL-UUID-DEL-PROPIETARIO', 'Propietario', 'admin', true);
