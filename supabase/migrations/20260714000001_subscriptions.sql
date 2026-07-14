-- ============================================================
-- FORGE — Suscripciones premium
--
-- subscriptions es la fuente de verdad: soporta el día que se conecte un
-- proveedor de pago real (Stripe, etc.) sin volver a migrar, y también
-- otorgar premium manualmente (marketing, cuentas propias) con
-- provider = 'manual' y current_period_end null (sin vencimiento).
--
-- profiles.is_premium queda como flag de lectura rápida, sincronizado por
-- trigger cada vez que cambia una fila de subscriptions. El resto de la app
-- sigue leyendo profiles.is_premium sin joins.
-- ============================================================

-- premium_since ya no hace falta: subscriptions.created_at cubre ese dato
-- con más contexto (plan, proveedor, vigencia).
alter table profiles drop column if exists premium_since;

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing')),
  plan text not null default 'premium',
  provider text not null default 'manual' check (provider in ('manual', 'stripe')),
  provider_customer_id text,
  provider_subscription_id text,
  -- null = sin vencimiento (uso típico de un grant manual/promocional)
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index subscriptions_user_idx on subscriptions (user_id);

alter table subscriptions enable row level security;

-- Solo lectura de la propia suscripción. Altas/bajas se hacen por SQL/dashboard
-- (grant manual) o, a futuro, por una función de servidor que procese webhooks
-- del proveedor de pago — nunca directo desde el cliente.
create policy "subscriptions_select_own" on subscriptions
  for select using (auth.uid() = user_id);

-- Recalcula profiles.is_premium para un usuario según si tiene alguna
-- suscripción activa y vigente.
create or replace function public.recompute_premium(target uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update profiles set is_premium = exists (
    select 1 from subscriptions
    where user_id = target
      and status = 'active'
      and (current_period_end is null or current_period_end > now())
  )
  where user_id = target;
end;
$$;

create or replace function public.subscriptions_sync_premium()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'DELETE' then
    perform public.recompute_premium(old.user_id);
    return old;
  else
    perform public.recompute_premium(new.user_id);
    return new;
  end if;
end;
$$;

create trigger subscriptions_sync_premium_trigger
after insert or update or delete on subscriptions
for each row execute function public.subscriptions_sync_premium();

revoke execute on function public.recompute_premium(uuid) from public, anon, authenticated;
