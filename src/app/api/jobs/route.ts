import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const webhookUrl = process.env.N8N_JOBS_WEBHOOK_URL;
  const secret = process.env.LEADGEN_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    return NextResponse.json(
      { ok: false, error: 'Server misconfigured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LeadGen-Secret': secret,
      },
      body: JSON.stringify({ triggered_at: new Date().toISOString() }),
      // n8n może długo procesować (5+ min), dajmy duży timeout
      signal: AbortSignal.timeout(10 * 60 * 1000), // 10 min
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json(
        {
          ok: false,
          error: `n8n returned ${response.status}`,
          details: errorText.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json({ ok: true, n8n_response: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { ok: false, error: 'Failed to trigger workflow', message },
      { status: 502 }
    );
  }
}