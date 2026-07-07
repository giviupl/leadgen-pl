import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import type { JobOfferStatus } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_STATUSES: JobOfferStatus[] = ['new', 'applied', 'dismissed'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
  }

  let body: { status?: JobOfferStatus; cv_sent?: boolean; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid status', valid: VALID_STATUSES },
        { status: 400 }
      );
    }
    updates.status = body.status;
    if (body.status === 'applied') {
      updates.applied_at = new Date().toISOString();
    }
  }

  if (typeof body.cv_sent === 'boolean') {
    updates.cv_sent = body.cv_sent;
  }

  if (typeof body.notes === 'string') {
    updates.notes = body.notes.slice(0, 2000);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: 'Nothing to update' }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from('job_offers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, offer: data });
}