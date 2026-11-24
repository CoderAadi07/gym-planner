
create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_date date not null,
  record_type text not null
    check (record_type in ('workout', 'checkin')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, record_date, record_type)
);

alter table public.user_progress enable row level security;

drop policy if exists "Users can view their own progress" on public.user_progress;
drop policy if exists "Users can insert their own progress" on public.user_progress;
drop policy if exists "Users can update their own progress" on public.user_progress;
drop policy if exists "Users can delete their own progress" on public.user_progress;

create policy "Users can view their own progress"
on public.user_progress for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own progress"
on public.user_progress for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own progress"
on public.user_progress for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own progress"
on public.user_progress for delete
to authenticated
using (auth.uid() = user_id);

grant usage on schema public to authenticated;

grant select, insert, update, delete
on table public.user_progress
to authenticated;

create index if not exists user_progress_user_date_idx
on public.user_progress (user_id, record_date);
