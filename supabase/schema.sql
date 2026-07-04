-- Engagement Hub schema. Run once in the Supabase SQL editor.
-- All access happens server-side via the service-role key; RLS below is
-- defense in depth so the anon key can never touch these tables.

create table if not exists engagement_profiles (
  discord_id text primary key,
  username text not null,
  avatar text,
  game_name text,
  show_activity boolean not null default true,
  streak_count integer not null default 0,
  last_checkin_date date,
  total_points integer not null default 0 check (total_points >= 0),
  lifetime_points integer not null default 0,
  lifetime_spend numeric(10, 2) not null default 0,
  wipe_checkin_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists point_transactions (
  id uuid primary key default gen_random_uuid(),
  discord_id text not null references engagement_profiles (discord_id) on delete cascade,
  amount integer not null,
  type text not null,
  description text not null default '',
  ref text unique,
  created_at timestamptz not null default now()
);

create index if not exists point_transactions_user_idx
  on point_transactions (discord_id, created_at desc);

create table if not exists user_achievements (
  discord_id text not null references engagement_profiles (discord_id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (discord_id, achievement_id)
);

create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  type text not null check (type in ('checkin_days', 'purchases', 'points_earned')),
  goal integer not null check (goal > 0),
  points integer not null check (points > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists challenge_progress (
  challenge_id uuid not null references challenges (id) on delete cascade,
  discord_id text not null references engagement_profiles (discord_id) on delete cascade,
  progress integer not null default 0,
  completed_at timestamptz,
  primary key (challenge_id, discord_id)
);

create table if not exists redemptions (
  id uuid primary key default gen_random_uuid(),
  discord_id text not null references engagement_profiles (discord_id) on delete cascade,
  reward_id text not null,
  reward_name text not null,
  cost integer not null,
  status text not null default 'pending' check (status in ('pending', 'fulfilled', 'refunded')),
  code text,
  created_at timestamptz not null default now()
);

create table if not exists activity_events (
  id uuid primary key default gen_random_uuid(),
  discord_id text not null references engagement_profiles (discord_id) on delete cascade,
  type text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_created_idx
  on activity_events (created_at desc);

-- Atomic points adjustment: ledger row + balance update in one transaction.
-- Duplicate refs (webhook retries) are silently ignored. Overspend raises.
create or replace function adjust_points(
  p_discord_id text,
  p_amount integer,
  p_type text,
  p_description text,
  p_ref text default null
) returns integer
language plpgsql
security definer
as $$
declare
  new_balance integer;
begin
  if p_ref is not null and exists (select 1 from point_transactions where ref = p_ref) then
    select total_points into new_balance from engagement_profiles where discord_id = p_discord_id;
    return new_balance;
  end if;

  update engagement_profiles
  set total_points = total_points + p_amount,
      lifetime_points = lifetime_points + greatest(p_amount, 0)
  where discord_id = p_discord_id
  returning total_points into new_balance;

  if new_balance is null then
    raise exception 'profile % not found', p_discord_id;
  end if;

  insert into point_transactions (discord_id, amount, type, description, ref)
  values (p_discord_id, p_amount, p_type, p_description, p_ref);

  return new_balance;
end;
$$;

alter table engagement_profiles enable row level security;
alter table point_transactions enable row level security;
alter table user_achievements enable row level security;
alter table challenges enable row level security;
alter table challenge_progress enable row level security;
alter table redemptions enable row level security;
alter table activity_events enable row level security;
