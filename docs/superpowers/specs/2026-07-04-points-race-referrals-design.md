# Points Race & Referral System — Design

Date: 2026-07-04
Status: Approved (follow-up to the Engagement Hub spec)

## Points Race (seasonal points leaderboard)

**Goal:** a second competitive ladder that resets every wipe, giving hardcore
players a reason to grind points and check standings.

**Key decision — no balance resets.** The race ranks players by points *earned*
during the current season (positive ledger entries since the season start), so
spendable balances are never touched. No reset job, no season table: the season
window is derived at read time from the most recent published wipe in the CMS
(fallback: start of the current UTC month when no wipes exist).

Implementation: `season_points_leaderboard(p_since, p_limit)` SQL function
aggregates the ledger; `/api/engagement/points-leaderboard` returns the top 10
plus the caller's own rank within the top 50. The `PointsRace` component renders
on `/leaderboard` under the kill boards, highlighting the caller's row.

## Referral system

**Goal:** turn existing players into the acquisition channel.

Flow:

1. Every player's profile shows a personal link `/?ref=<discordId>` with a copy
   button and live recruit count.
2. The proxy stores a validated `ref` (`^\d{5,25}$`, first one wins) in an
   httpOnly `aces_ref` cookie for 30 days.
3. On first-ever login, the Discord callback passes the cookie to
   `upsertProfile`, which stores `referred_by` after checking it isn't the user
   themselves and the referrer profile exists. The cookie is cleared on login.
4. Payout happens at the trust point — the referred player's **first verified
   purchase** (Tip4Serv webhook): referrer +250 and `referral_count` increment,
   buyer +100 welcome bonus. Both transactions carry unique refs
   (`referral:<buyerId>`), so the payout is idempotent and once-per-recruit.
5. New Community achievements: Recruiter (1 recruit, 100 pts) and Headhunter
   (5 recruits, 300 pts), evaluated when the payout lands. Feed/Discord event:
   "recruited a new player to the server".

Anti-abuse: attribution only on profile creation (no re-referring existing
players), self-referral blocked, payout requires a real paid order, and points
only flow through the transactional `adjust_points` RPC.

## Schema changes

`engagement_profiles.referred_by text`, `engagement_profiles.referral_count
integer default 0`, plus the `season_points_leaderboard` function — all included
in `supabase/schema.sql` with idempotent migrations for existing databases.
