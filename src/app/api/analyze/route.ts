import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

// --- Upstash setup (singleton, deduplikacja przy hot-reload w dev) ---
const redis = Redis.fromEnv();

const ipRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 d'),
  prefix: 'leadgen:ip',
  analytics: true,
});

const globalRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(500, '1 d'),
  prefix: 'leadgen:global',
  analytics: true,
});

export async function POST(request: NextRequest) {
  try {
    // --- 1. Walidacja konfiguracji serwera ---
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET;
    if (!webhookUrl || !webhookSecret) {
      console.error('[analyze] Missing N8N_WEBHOOK_URL or N8N_WEBHOOK_SECRET');
      return NextResponse.json(
        { error: 'Serwer źle skonfigurowany' },
        { status: 500 }
      );
    }

    // --- 2. Parse + walidacja NIP ---
    const body = await request.json().catch(() => null);
    if (!body?.nip || typeof body.nip !== 'string') {
      return NextResponse.json(
        { error: 'NIP jest wymagany' },
        { status: 400 }
      );
    }

    // Normalizacja: usuń spacje, myślniki, kropki — zostaw same cyfry
    const nip = body.nip.replace(/\D/g, '');
    if (!/^\d{10}$/.test(nip)) {
      return NextResponse.json(
        { error: 'NIP musi mieć 10 cyfr' },
        { status: 400 }
      );
    }

    // --- 3. Identyfikacja klienta (Vercel ustawia x-forwarded-for) ---
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // --- 4. Rate limit per IP (10/dzień) ---
    const ipResult = await ipRateLimit.limit(ip);
    if (!ipResult.success) {
      const resetIn = Math.ceil((ipResult.reset - Date.now()) / 1000 / 60 / 60);
      return NextResponse.json(
        {
          error: `Przekroczyłeś dzienny limit 10 analiz. Spróbuj ponownie za ~${resetIn}h.`,
          retryAfter: ipResult.reset,
        },
        { status: 429 }
      );
    }

    // --- 5. Rate limit globalny (500/dzień — bezpiecznik na quota Gemini) ---
    const globalResult = await globalRateLimit.limit('all');
    if (!globalResult.success) {
      return NextResponse.json(
        { error: 'Dzienny limit globalny serwisu wyczerpany. Wróć jutro.' },
        { status: 503 }
      );
    }

    // --- 6. Wywołanie n8n webhook z sekretnym headerem (timeout 60s) ---
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    let n8nResponse: Response;
    try {
      n8nResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-LeadGen-Secret': webhookSecret,
        },
        body: JSON.stringify({ nip }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!n8nResponse.ok) {
      const text = await n8nResponse.text().catch(() => '');
      console.error(`[analyze] n8n failed ${n8nResponse.status}:`, text.slice(0, 500));
      return NextResponse.json(
        { error: `Błąd analizy (status ${n8nResponse.status})` },
        { status: 502 }
      );
    }

    const data = await n8nResponse.json();
    return NextResponse.json(data, {
      headers: {
        'X-RateLimit-Limit': String(ipResult.limit),
        'X-RateLimit-Remaining': String(ipResult.remaining),
      },
    });
  } catch (err) {
    console.error('[analyze] error:', err);
    const message =
      err instanceof Error && err.name === 'AbortError'
        ? 'Analiza przekroczyła limit czasu (60s). Spróbuj ponownie.'
        : 'Wewnętrzny błąd serwera';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}