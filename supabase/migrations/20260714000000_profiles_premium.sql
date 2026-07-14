-- Estado premium del usuario. Flag simple en profiles: no hay pasarela de
-- pago todavía, se activa manualmente hasta que exista un flujo de billing.
alter table profiles add column if not exists is_premium boolean not null default false;
alter table profiles add column if not exists premium_since timestamptz;
