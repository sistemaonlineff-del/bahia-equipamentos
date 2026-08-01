create extension if not exists "pgcrypto";

create table if not exists public.municipios (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.enderecos (
  id uuid primary key default gen_random_uuid(),
  municipio_id uuid not null references public.municipios(id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now(),
  unique (municipio_id, nome)
);

create table if not exists public.sistemas_produtivos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.condicoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.programas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.equipamentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  sistema_produtivo_id uuid references public.sistemas_produtivos(id),
  convenio_termo text not null,
  condicao_id uuid references public.condicoes(id),
  proprietario text not null,
  valor_estimado numeric(14, 2) not null default 0,
  municipio_id uuid references public.municipios(id),
  endereco_id uuid references public.enderecos(id),
  programa_id uuid references public.programas(id),
  descricao text,
  status text not null default 'Disponivel' check (status in ('Disponivel', 'Em analise', 'Solicitado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.equipamento_anexos (
  id uuid primary key default gen_random_uuid(),
  equipamento_id uuid not null references public.equipamentos(id) on delete cascade,
  nome_arquivo text not null,
  caminho_storage text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.solicitacoes (
  id uuid primary key default gen_random_uuid(),
  equipamento_id uuid not null references public.equipamentos(id) on delete cascade,
  nome_solicitante text not null,
  contato_solicitante text not null,
  local_destino text not null,
  justificativa text not null,
  nome_admin text,
  decisao_admin text not null default 'Pendente' check (decisao_admin in ('Pendente', 'Aprovado', 'Recusado')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists equipamentos_set_updated_at on public.equipamentos;
create trigger equipamentos_set_updated_at
before update on public.equipamentos
for each row
execute function public.set_updated_at();

drop trigger if exists solicitacoes_set_updated_at on public.solicitacoes;
create trigger solicitacoes_set_updated_at
before update on public.solicitacoes
for each row
execute function public.set_updated_at();

insert into public.municipios (nome)
values
  ('Salvador'),
  ('Feira de Santana'),
  ('Ilheus'),
  ('Juazeiro')
on conflict (nome) do nothing;

insert into public.sistemas_produtivos (nome)
values
  ('Agricultura familiar'),
  ('Pesca artesanal'),
  ('Agroindustria'),
  ('Associativismo rural')
on conflict (nome) do nothing;

insert into public.condicoes (nome)
values
  ('Novo'),
  ('Bom estado'),
  ('Em manutencao')
on conflict (nome) do nothing;

insert into public.programas (nome)
values
  ('Bahia Produtiva'),
  ('Mais Gestao'),
  ('Infraestrutura Rural')
on conflict (nome) do nothing;
