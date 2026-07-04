# Engagement Hub — Design

Date: 2026-07-04
Status: Approved

## Goal

Give players reasons to visit the site daily, appealing to a mixed player base:
competitive players (achievements, rarity, leaderboard-linked unlocks) and casual
players (streaks, daily rewards, points). Secondary effects: more purchases (points
on spend, redeemable discounts) and community visibility (activity feed).

## Decisions

- **Auth: Discord only.** One "Login with Discord" button. No passwords, no Steam
  login for the site. The existing checkout Discord OAuth flow is untouched; a new,
  separate auth flow issues an HMAC-signed session cookie (same pattern as the
  admin session in `lib/password-auth.ts`).
- **Storage: Supabase Postgres** for all engagement data. The existing Vercel Blob
  CMS store stays as-is for leaderboard/wipes/ticker — a JSON blob cannot handle a
  concurrent, transactional points ledger. Supabase is accessed **server-side only**
  via the service-role key; no client-side Supabase, RLS locks the tables down as
  defense in depth.
- **Graceful degradation:** if `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are not
  set, the site works exactly as today — engagement UI hides itself, engagement API
  routes return 503.
- **Redemptions are fulfilled manually** (admin queue in the panel). Tip4Serv coupon
  creation via API is not confirmed to exist, so redemptions create a `pending`
  record the admin resolves (grant Discord role, hand out kit, issue coupon code).
  The design supports attaching a code to a fulfilled redemption.
- **Days are UTC calendar days** for check-ins and streaks.

## Data model (Supabase)

- `engagement_profiles` — discord_id (PK), username, avatar, game_name,
  show_activity, streak_count, last_checkin_date, total_points, lifetime_points,
  lifetime_spend, wipe_checkin_count, created_at
- `point_transactions` — ledger; unique nullable `ref` gives idempotency
  (webhook credits use the Tip4Serv payment id as ref)
- `user_achievements` — (discord_id, achievement_id) PK, unlocked_at
- `challenges` — admin-defined weekly challenges; type is `checkin_days` |
  `purchases` | `points_earned`, with goal, points, starts_at, ends_at, active
- `challenge_progress` — (challenge_id, discord_id), progress, completed_at
- `redemptions` — reward_id, cost, status `pending` | `fulfilled` | `refunded`, code
- `activity_events` — public feed rows (discord_id, type, message, created_at)
- RPC `adjust_points(discord_id, amount, type, description, ref)` — inserts ledger
  row and updates balances atomically; rejects overspend; no-ops on duplicate ref.

## Points economy

Earning: daily check-in `min(10 + 5×(streak−1), 80)` (day 7 = 40); purchases 5 pts
per $1 (5%), credited only from the verified Tip4Serv webhook, idempotent on payment
id; achievements 25–500; challenges 50–150.

Spending (initial catalog, defined in code): 5% discount (500), 10% discount (900),
"Site Legend" Discord role (1500). All redemptions land in the admin queue.

Streak resets to 1 when a UTC day is missed. Check-in is automatic on first
authenticated page view of the day (client fires POST `/api/engagement/checkin`,
server enforces one per day).

## Achievements

Defined in code (`lib/engagement/achievements.ts`) with server-side checkers that
run on check-in and on webhook credit. Categories: Loyalty (first login, 7/30-day
streak, 6-month member), Supporter (first purchase, $50, $200 lifetime), Competitor
(on leaderboard, top 10, #1 — matched by the user's `game_name` profile field
against the CMS leaderboard), Community (check-in within 1 h of a published wipe,
5 check-ins on wipe days). Gallery page shows rarity (% of players who have each).

## Weekly challenges

Admin creates challenges with a date window; progress auto-tracked from check-in
and webhook events. Homepage shows compact progress bars for active challenges.

## Pages & API

Pages: `/profile/me`, `/profile/[discordId]`, `/achievements`, `/rewards`,
admin `/admin/engagement` (challenges CRUD, pending redemptions, manual point grants).

API: `/api/auth/discord/{login,callback}`, `/api/auth/logout`,
`/api/engagement/{me,checkin,feed,achievements,challenges,redeem,profile/[id]}`,
`/api/admin/engagement` (admin session required, same pattern as existing admin routes).

Header gains a login button that becomes avatar + points + streak with a dropdown
(profile, achievements, rewards, logout). Homepage gains the challenge strip, the
activity feed, and a check-in toast. Existing sections and shop funnel unchanged.

## Security & error handling

- All writes go through server routes that verify the signed session cookie.
- Webhook credits verified by the existing `TIP4SERV_WEBHOOK_SECRET` and made
  idempotent by ledger `ref`.
- OAuth callback failures redirect to `/?login_error=...` and the header shows a
  transient error state; sessions expire after 30 days.
- Rate limiting on check-in and redeem via the existing in-memory `rateLimit`.

## Testing

- Pure streak/points date math lives in `lib/engagement/streak.ts` with unit tests
  run via `node --experimental-strip-types --test` (no new test framework).
- `npm run build` + lint must pass; manual E2E of login → check-in → redeem.

## New environment variables

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — engagement database
- `AUTH_SECRET` — signs the Discord session cookie (falls back to
  `DISCORD_CLIENT_SECRET` if unset)

Run `supabase/schema.sql` in the Supabase SQL editor once to provision tables.
