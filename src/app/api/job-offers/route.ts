import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: { url?: string; notes?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.url || typeof body.url !== 'string') {
    return NextResponse.json({ ok: false, error: 'URL jest wymagany' }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(body.url);
  } catch {
    return NextResponse.json({ ok: false, error: 'Nieprawidłowy URL' }, { status: 400 });
  }

  const domain = parsedUrl.hostname.replace(/^www\./, '');
  const notes = typeof body.notes === 'string' ? body.notes.slice(0, 2000) : null;

  // Sprawdź czy URL już istnieje
  const { data: existing } = await supabaseServer
    .from('job_offers')
    .select('id, status')
    .eq('url', body.url)
    .maybeSingle();

  if (existing) {
    const updates: Record<string, unknown> = {};
    if (existing.status !== 'applied') {
      updates.status = 'applied';
      updates.applied_at = new Date().toISOString();
    }
    if (notes !== null) updates.notes = notes;

    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabaseServer
        .from('job_offers')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, offer: data, was_duplicate: true });
    }
    return NextResponse.json({ ok: true, offer: existing, was_duplicate: true });
  }

  const { data, error } = await supabaseServer
    .from('job_offers')
    .insert({
      url: body.url,
      domain,
      offer_type: 'company_site',
      source: 'snippet',
      title: body.url,
      language: 'pl',
      fit_score: null,
      fit_reasoning: 'Dodane manualnie',
      key_skills: [],
      red_flags: [],
      status: 'applied',
      applied_at: new Date().toISOString(),
      notes,
      source_query: 'manual',
      cv_sent: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, offer: data, was_duplicate: false });
}