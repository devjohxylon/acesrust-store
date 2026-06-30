import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-auth';
import {
  createWipe,
  deleteWipe,
  getAllWipes,
  updateWipe,
} from '@/lib/cms-service';
import type { WipeScheduleInput } from '@/lib/cms-types';

function parseWipeInput(body: Record<string, unknown>): WipeScheduleInput | null {
  if (typeof body.title !== 'string' || typeof body.scheduledAt !== 'string') {
    return null;
  }

  const wipeType = body.wipeType;
  if (wipeType !== 'map' && wipeType !== 'blueprint' && wipeType !== 'full') {
    return null;
  }

  return {
    title: body.title,
    description: typeof body.description === 'string' ? body.description : null,
    scheduledAt: body.scheduledAt,
    wipeType,
    isPublished: Boolean(body.isPublished),
  };
}

export async function GET() {
  try {
    await requireAdminSession();
    const wipes = await getAllWipes();
    return NextResponse.json({ wipes });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const body = await request.json();
    const input = parseWipeInput(body);

    if (!input) {
      return NextResponse.json({ error: 'Invalid wipe data' }, { status: 400 });
    }

    const wipe = await createWipe(input);
    return NextResponse.json(wipe, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create wipe' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdminSession();
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : null;
    const input = parseWipeInput(body);

    if (!id || !input) {
      return NextResponse.json({ error: 'Invalid wipe data' }, { status: 400 });
    }

    const wipe = await updateWipe(id, input);
    return NextResponse.json(wipe);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update wipe' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Wipe id is required' }, { status: 400 });
    }

    await deleteWipe(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to delete wipe' }, { status: 500 });
  }
}
