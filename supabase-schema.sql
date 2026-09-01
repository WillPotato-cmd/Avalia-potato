-- Rode este script no SQL Editor do seu projeto Supabase antes de usar o site.

create table if not exists lojas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  criado_em timestamptz default now()
);

create table if not exists feedbacks (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references lojas(id) on delete set null,
  data date not null,
  nota integer not null check (nota between 1 and 5),
  texto text,
  criado_em timestamptz default now()
);

alter table lojas enable row level security;
alter table feedbacks enable row level security;

-- Como é uso pessoal (login único via Supabase Auth), liberamos acesso
-- para qualquer usuário autenticado.
create policy "Usuários autenticados podem tudo em lojas"
  on lojas for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Usuários autenticados podem tudo em feedbacks"
  on feedbacks for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
