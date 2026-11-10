-- Skema timesheet Kenallebih. Tempel di Supabase > SQL Editor, lalu Run.

create table if not exists members (
  id uuid primary key,
  name text not null,
  pin_hash text not null
);

create table if not exists kpis (
  id uuid primary key,
  member_id uuid not null references members(id) on delete cascade,
  title text not null,
  period text not null check (period in ('weekly','monthly','deadline')),
  target numeric not null,
  unit text not null default '',
  deadline date
);

create table if not exists entries (
  id uuid primary key,
  member_id uuid not null references members(id) on delete cascade,
  date date not null,
  start_at text not null,
  end_at text not null
);

create table if not exists tasks (
  id uuid primary key,
  member_id uuid not null references members(id) on delete cascade,
  date date not null,
  text text not null,
  status text not null default 'todo' check (status in ('todo','doing','done')),
  result text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists ticks (
  id uuid primary key,
  kpi_id uuid not null references kpis(id) on delete cascade,
  date date not null,
  amount numeric not null
);

create index if not exists entries_member_date on entries (member_id, date);
create index if not exists tasks_member_date on tasks (member_id, date);
create index if not exists ticks_kpi on ticks (kpi_id);

-- Keamanan: aktifkan RLS tanpa policy. Artinya kunci publik (anon) tidak bisa
-- membaca atau menulis apa pun. Hanya server aplikasi (secret key) yang bisa akses.
alter table members enable row level security;
alter table kpis    enable row level security;
alter table entries enable row level security;
alter table tasks   enable row level security;
alter table ticks   enable row level security;
