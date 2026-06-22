import { NextResponse } from 'next/server';
import type { DiscoverResponse } from '@/types';

export const maxDuration = 120; // discover trwa ~30-60s

export async function POST() {
  const webhookUrl = process.env.N8N_DISCOVER_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    return NextResponse.json(
      { error: 'Brak konfiguracji webhooka' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LeadGen-Secret': secret,
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[discover] n8n error:', res.status, text);
      return NextResponse.json(
        { error: 'Błąd workflow odkrywania' },
        { status: 502 }
      );
    }

    const data: DiscoverResponse = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[discover] fetch failed:', err);
    return NextResponse.json(
      { error: 'Nie udało się połączyć z n8n' },
      { status: 502 }
    );
  }
}