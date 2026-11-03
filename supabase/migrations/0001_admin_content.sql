-- VALEX website content and project management.
-- Create the first admin in Supabase Auth, then insert that user's UUID into admin_users.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_site_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

create table if not exists public.site_content (
  id text primary key default 'main' check (id = 'main'),
  content jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  summary text not null default '',
  data jsonb not null,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.media_assets (
  asset_id text primary key,
  project_slug text not null,
  public_id text not null unique,
  secure_url text not null,
  resource_type text not null check (resource_type in ('image', 'video')),
  bytes bigint not null check (bytes > 0),
  format text not null default '',
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists media_assets_project_slug_idx on public.media_assets(project_slug);

alter table public.admin_users enable row level security;
alter table public.site_content enable row level security;
alter table public.projects enable row level security;
alter table public.media_assets enable row level security;

drop policy if exists "admins read own admin record" on public.admin_users;
create policy "admins read own admin record" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "public read site content" on public.site_content;
create policy "public read site content" on public.site_content
  for select to anon, authenticated using (true);
drop policy if exists "admins manage site content" on public.site_content;
create policy "admins manage site content" on public.site_content
  for all to authenticated using ((select public.is_site_admin()))
  with check ((select public.is_site_admin()));

drop policy if exists "public read published projects" on public.projects;
create policy "public read published projects" on public.projects
  for select to anon, authenticated using (is_published or (select public.is_site_admin()));
drop policy if exists "admins manage projects" on public.projects;
create policy "admins manage projects" on public.projects
  for all to authenticated using ((select public.is_site_admin()))
  with check ((select public.is_site_admin()));

drop policy if exists "admins manage media registry" on public.media_assets;
create policy "admins manage media registry" on public.media_assets
  for all to authenticated using ((select public.is_site_admin()))
  with check ((select public.is_site_admin()));

grant select on public.site_content to anon, authenticated;
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.media_assets to authenticated;
grant select on public.admin_users to authenticated;
grant all on public.site_content to authenticated;
