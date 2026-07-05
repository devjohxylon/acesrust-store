import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-auth';
import { getWipePrizesState, saveWipePrizesConfig } from '@/lib/cms-service';
import type { WipePrizesConfig } from '@/lib/cms-types';
import { isEngagementConfigured } from '@/lib/engagement/db';
import {
  createChallenge,
  deleteChallenge,
  grantPoints,
  listAllChallenges,
  listRedemptions,
  resolveRedemption,
  updateChallenge,
} from '@/lib/engagement/service';
import { announceLatestPendingWipe, announceWipeWinners } from '@/lib/engagement/wipe-prizes';
import type { ChallengeType } from '@/lib/engagement/types';

const CHALLENGE_TYPES: ChallengeType[] = ['checkin_days', 'purchases', 'points_earned'];

function parseChallenge(body: Record<string, unknown>) {
  const type = body.type;
  if (
    typeof body.title !== 'string' ||
    !body.title.trim() ||
    typeof body.starts_at !== 'string' ||
    typeof body.ends_at !== 'string' ||
    !CHALLENGE_TYPES.includes(type as ChallengeType)
  ) {
    return null;
  }

  const goal = Number(body.goal);
  const points = Number(body.points);
  if (!Number.isInteger(goal) || goal < 1 || !Number.isInteger(points) || points < 1) {
    return null;
  }

  return {
    title: body.title.trim(),
    description: typeof body.description === 'string' ? body.description.trim() : '',
    type: type as ChallengeType,
    goal,
    points,
    starts_at: body.starts_at,
    ends_at: body.ends_at,
    active: Boolean(body.active),
  };
}

function parseWipePrizesConfig(body: Record<string, unknown>): WipePrizesConfig | null {
  const place = (value: unknown) => {
    if (!value || typeof value !== 'object') return null;
    const row = value as Record<string, unknown>;
    if (typeof row.title !== 'string' || typeof row.description !== 'string') return null;
    return { title: row.title.trim(), description: row.description.trim() };
  };

  const first = place(body.first);
  const second = place(body.second);
  const third = place(body.third);
  if (!first || !second || !third) return null;

  return {
    enabled: Boolean(body.enabled),
    first,
    second,
    third,
  };
}

export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isEngagementConfigured()) {
    return NextResponse.json({
      configured: false,
      challenges: [],
      redemptions: [],
      wipePrizes: null,
    });
  }

  try {
    const [challenges, redemptions, wipePrizes] = await Promise.all([
      listAllChallenges(),
      listRedemptions(),
      getWipePrizesState().catch(() => null),
    ]);
    return NextResponse.json({ configured: true, challenges, redemptions, wipePrizes });
  } catch (error) {
    console.error('Failed to load engagement admin data:', error);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isEngagementConfigured()) {
    return NextResponse.json({ error: 'Engagement storage not configured' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    switch (body.action) {
      case 'create_challenge': {
        const input = parseChallenge(body);
        if (!input) return NextResponse.json({ error: 'Invalid challenge' }, { status: 400 });
        const challenge = await createChallenge(input);
        return NextResponse.json({ challenge }, { status: 201 });
      }
      case 'update_challenge': {
        const input = parseChallenge(body);
        if (typeof body.id !== 'string' || !input) {
          return NextResponse.json({ error: 'Invalid challenge' }, { status: 400 });
        }
        await updateChallenge(body.id, input);
        return NextResponse.json({ ok: true });
      }
      case 'delete_challenge': {
        if (typeof body.id !== 'string') {
          return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }
        await deleteChallenge(body.id);
        return NextResponse.json({ ok: true });
      }
      case 'resolve_redemption': {
        const status = body.status;
        if (typeof body.id !== 'string' || (status !== 'fulfilled' && status !== 'refunded')) {
          return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }
        await resolveRedemption(
          body.id,
          status,
          typeof body.code === 'string' && body.code.trim() ? body.code.trim() : null
        );
        return NextResponse.json({ ok: true });
      }
      case 'grant_points': {
        const amount = Number(body.amount);
        if (
          typeof body.discordId !== 'string' ||
          !Number.isInteger(amount) ||
          amount === 0 ||
          typeof body.description !== 'string'
        ) {
          return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }
        const balance = await grantPoints(body.discordId, amount, body.description);
        return NextResponse.json({ balance });
      }
      case 'save_wipe_prizes': {
        const config = parseWipePrizesConfig(body);
        if (!config) return NextResponse.json({ error: 'Invalid prize config' }, { status: 400 });
        const wipePrizes = await saveWipePrizesConfig(config);
        return NextResponse.json({ wipePrizes });
      }
      case 'announce_wipe_winners': {
        if (typeof body.wipeId === 'string' && body.wipeId.trim()) {
          const snapshot = await announceWipeWinners(body.wipeId.trim());
          return NextResponse.json({ snapshot });
        }
        const snapshot = await announceLatestPendingWipe();
        if (!snapshot) {
          return NextResponse.json({ error: 'No pending wipe to announce' }, { status: 404 });
        }
        return NextResponse.json({ snapshot });
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Engagement admin action failed:', error);
    const message = error instanceof Error ? error.message : 'Action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
