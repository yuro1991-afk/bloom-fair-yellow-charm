create table if not exists forge_graphs (
  id         text primary key,
  user_id    text not null,
  name       text not null,
  graph      jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists forge_graphs_user_idx on forge_graphs (user_id, updated_at desc);
