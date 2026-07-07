import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const n8nSecret = process.env.N8N_WEBHOOK_SECRET;
  const leadgenSecret = process.env.LEADGEN_WEBHOOK_SECRET;

  return NextResponse.json({
    n8n_webhook_secret_length: n8nSecret?.length ?? 0,
    n8n_webhook_secret_first_4: n8nSecret?.slice(0, 4) ?? 'MISSING',
    n8n_webhook_secret_last_4: n8nSecret?.slice(-4) ?? 'MISSING',
    leadgen_webhook_secret_length: leadgenSecret?.length ?? 0,
    leadgen_webhook_secret_first_4: leadgenSecret?.slice(0, 4) ?? 'MISSING',
    leadgen_webhook_secret_last_4: leadgenSecret?.slice(-4) ?? 'MISSING',
    are_equal: n8nSecret === leadgenSecret,
    n8n_base_url: process.env.N8N_BASE_URL ?? 'not set (using fallback)',
    n8n_extract_nip_path: process.env.N8N_EXTRACT_NIP_PATH ?? 'not set (using fallback)',
  });
}