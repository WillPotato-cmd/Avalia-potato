-- Rode este script no SQL Editor do seu projeto Supabase antes de usar o site.
-- Se você já tinha rodado uma versão anterior, pode rodar este script inteiro de novo:
-- os "create table if not exists" e "add column if not exists" não duplicam nada.

create table if not exists lojas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  regiao text,
  criado_em timestamptz default now()
);
alter table lojas add column if not exists regiao text;

create table if not exists feedbacks (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references lojas(id) on delete set null,
  data date not null,
  nota integer not null check (nota between 1 and 5),
  texto text,
  origem text check (origem in ('ifood', '99food')),
  pedido text,
  cliente text,
  criado_em timestamptz default now()
);
alter table feedbacks add column if not exists origem text check (origem in ('ifood', '99food'));
alter table feedbacks add column if not exists pedido text;
alter table feedbacks add column if not exists cliente text;

create table if not exists notas_secas (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references lojas(id) on delete set null,
  mes text not null, -- formato 'YYYY-MM'
  nota integer not null check (nota between 1 and 5),
  quantidade integer not null check (quantidade > 0),
  criado_em timestamptz default now()
);

create table if not exists vendas_diarias (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references lojas(id) on delete set null,
  canal text not null check (canal in ('ifood', '99food')),
  data date not null,
  pedidos integer not null default 0,
  vendas numeric not null default 0,
  investimento numeric not null default 0,
  com_promo integer default 0,
  sem_promo integer default 0,
  criado_em timestamptz default now()
);

create table if not exists operacao_mensal (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references lojas(id) on delete set null,
  mes text not null, -- formato 'YYYY-MM'
  cancel_cliente integer default 0,
  cancel_plataforma integer default 0,
  motivos text,
  tempo_func text,
  tempo_pct numeric,
  log_entrega integer,
  log_preparo integer,
  log_espera integer,
  criado_em timestamptz default now(),
  unique (loja_id, mes)
);

alter table lojas enable row level security;
alter table feedbacks enable row level security;
alter table notas_secas enable row level security;
alter table vendas_diarias enable row level security;
alter table operacao_mensal enable row level security;

-- Como é uso pessoal (login único via Supabase Auth), liberamos acesso
-- para qualquer usuário autenticado. Recriamos as políticas para evitar erro
-- de "já existe" caso você rode este script mais de uma vez.
drop policy if exists "Usuários autenticados podem tudo em lojas" on lojas;
create policy "Usuários autenticados podem tudo em lojas"
  on lojas for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Usuários autenticados podem tudo em feedbacks" on feedbacks;
create policy "Usuários autenticados podem tudo em feedbacks"
  on feedbacks for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Usuários autenticados podem tudo em notas_secas" on notas_secas;
create policy "Usuários autenticados podem tudo em notas_secas"
  on notas_secas for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Usuários autenticados podem tudo em vendas_diarias" on vendas_diarias;
create policy "Usuários autenticados podem tudo em vendas_diarias"
  on vendas_diarias for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Usuários autenticados podem tudo em operacao_mensal" on operacao_mensal;
create policy "Usuários autenticados podem tudo em operacao_mensal"
  on operacao_mensal for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
