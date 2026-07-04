# Discord Integration for the Engagement Hub — Design

Date: 2026-07-04
Status: Approved (follow-up to the Engagement Hub spec)

## Goal

Make the engagement hub self-running and visible inside Discord, where the
player base already lives: auto-fulfill role redemptions, mirror milestones
into a channel, and remind players before their streak expires.

## Decisions

- **Three independent features, each gated by its own env vars.** Any subset
  can be enabled; everything degrades to the previous behavior when
  unconfigured. No new dependencies — plain Discord REST API calls.
- **Auto role grant** (`lib/engagement/discord.ts` → `grantLegendRole`):
  when a `discord_legend` redemption succeeds and the bot is configured, the
  role is granted via `PUT /guilds/{guild}/members/{user}/roles/{role}` and the
  redemption is marked `fulfilled` with code `auto: role granted`. If the grant
  fails (user left the server, missing permission), the redemption stays
  `pending` in the admin queue — the manual path is the fallback, never lost.
- **Milestone mirror**: `addFeedEvent` (the single point where site feed rows
  are written) also posts to a channel webhook. Respects the existing
  `show_activity` privacy toggle, since the mirror lives behind the same gate.
  `allowed_mentions: { parse: [] }` prevents username-injection pings.
- **Streak reminder DMs**: daily Vercel cron (18:00 UTC → 6 hours before the
  UTC-midnight streak deadline) hits `/api/cron/streak-reminders`, protected by
  `CRON_SECRET` (Vercel sends it as a Bearer token automatically). Candidates:
  `dm_reminders = true`, `last_checkin_date = yesterday`, `streak_count >= 2`,
  capped at 200 per run. **Opt-in** via a toggle on `/profile/me` — new
  `dm_reminders` column, default false (unsolicited DMs annoy players and risk
  the bot getting reported).

## New environment variables

`DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_LEGEND_ROLE_ID` (role grant);
`DISCORD_FEED_WEBHOOK_URL` (mirror); `CRON_SECRET` (reminders).

## Schema change

`engagement_profiles.dm_reminders boolean not null default false` — added to
the create-table statement plus an idempotent `alter table ... add column if
not exists` migration for databases provisioned from the earlier schema.

## Testing

Build + lint + existing streak tests; smoke test that the cron endpoint 401s
without the secret and no-ops gracefully when Discord/Supabase are unconfigured.
