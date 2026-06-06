import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';
export const maxDuration = 120; // Vercel: max 120s dla tej route

// --- Upstash setup ---
const redis = Redis.fromEnv();

const ipRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 d'),   // 5/dzień per IP (find-contacts pali ~5 Serper credits)
  prefix: 'leadgen:find:ip',
  analytics: true,
});

const globalRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, '1 d'), // 200/dzień globalnie (~1000 credits Serper / 2500 mies)
  prefix: 'leadgen:find:global',
  analytics: true,
});

export async function POST(request: NextRequest) {
  try {
    // --- 1. Walidacja konfiguracji ---
    const webhookUrl = process.env.N8N_FIND_CONTACTS_URL;
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET;
    if (!webhookUrl || !webhookSecret) {
      console.error('[find-contacts] Missing N8N_FIND_CONTACTS_URL or N8N_WEBHOOK_SECRET');
      return NextResponse.json(
        { error: 'Serwer źle skonfigurowany' },
        { status: 500 }
      );
    }

    // --- 2. Parse + walidacja NIP ---
    const body = await request.json().catch(() => null);
    if (!body?.nip || typeof body.nip !== 'string') {
      return NextResponse.json({ error: 'NIP jest wymagany' }, { status: 400 });
    }

    const nip = body.nip.replace(/\D/g, '');
    if (!/^\d{10}$/.test(nip)) {
      return NextResponse.json({ error: 'NIP musi mieć 10 cyfr' }, { status: 400 });
    }

    // --- 3. Identyfikacja klienta ---
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // --- 4. Rate limit per IP (5/dzień) — skip w dev dla localhost ---
    const isDevLocalhost =
      process.env.NODE_ENV === 'development' &&
      (ip === '::1' || ip === '127.0.0.1' || ip === 'unknown');

    let ipResult: { limit: number; remaining: number; reset: number } = {
      limit: 999,
      remaining: 999,
      reset: 0,
    };

    if (!isDevLocalhost) {
      const r = await ipRateLimit.limit(ip);
      if (!r.success) {
        const resetIn = Math.ceil((r.reset - Date.now()) / 1000 / 60 / 60);
        return NextResponse.json(
          {
            error: `Przekroczyłeś dzienny limit 5 wyszukiwań. Spróbuj ponownie za ~${resetIn}h.`,
            retryAfter: r.reset,
          },
          { status: 429 }
        );
      }
      ipResult = { limit: r.limit, remaining: r.remaining, reset: r.reset };
    }

    // --- 5. Rate limit globalny ---
    const globalResult = await globalRateLimit.limit('all');
    if (!globalResult.success) {
      return NextResponse.json(
        { error: 'Dzienny limit globalny wyczerpany. Wróć jutro.' },
        { status: 503 }
      );
    }

    // --- 6. Wywołanie n8n (timeout 115s — Gemini z thinking mode trwa do 90s) ---
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 115_000);

    let n8nResponse: Response;
    try {
      n8nResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-LeadGen-Secret': webhookSecret,
        },
        body: JSON.stringify({ nip, force_refresh: body.force_refresh === true }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!n8nResponse.ok) {
      const text = await n8nResponse.text().catch(() => '');
      console.error(`[find-contacts] n8n failed ${n8nResponse.status}:`, text.slice(0, 500));
      return NextResponse.json(
        { error: `Błąd wyszukiwania (status ${n8nResponse.status})` },
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
    console.error('[find-contacts] error:', err);
    const message =
      err instanceof Error && err.name === 'AbortError'
        ? 'Wyszukiwanie kontaktów przekroczyło limit czasu (115s). Spróbuj ponownie.'
        : 'Wewnętrzny błąd serwera';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}