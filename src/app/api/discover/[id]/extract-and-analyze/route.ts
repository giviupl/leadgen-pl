import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n-production-2b74.up.railway.app';
const N8N_EXTRACT_NIP_PATH = process.env.N8N_EXTRACT_NIP_PATH || 'extract-nip';
const N8N_ANALYZE_NIP_PATH = process.env.N8N_ANALYZE_NIP_PATH || 'dfc18236-7d46-4a08-ac75-a0c721ebcf98';
const N8N_SECRET = process.env.N8N_WEBHOOK_SECRET!;

const CONFIDENCE_THRESHOLD = 0.7;

export const maxDuration = 120;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 1. Pobierz discovered company
    const { data: discovery, error: discoveryError } = await supabaseServer
      .from('discovered_companies')
      .select('id, raw_name, company_id')
      .eq('id', id)
      .single();

    if (discoveryError || !discovery) {
      return NextResponse.json(
        { ok: false, error: 'Discovery not found' },
        { status: 404 }
      );
    }

    // Cached: już zlinkowane → redirect bez ponownej analizy
    if (discovery.company_id) {
      const { data: company } = await supabaseServer
        .from('companies')
        .select('nip')
        .eq('id', discovery.company_id)
        .single();

      if (company?.nip) {
        return NextResponse.json({
          ok: true,
          nip: company.nip,
          cached: true,
          redirect_url: `/firma/${company.nip}`
        });
      }
    }

    // 2. extract-nip
    const extractResponse = await fetch(`${N8N_BASE_URL}/webhook/${N8N_EXTRACT_NIP_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LeadGen-Secret': N8N_SECRET
      },
      body: JSON.stringify({ company_name: discovery.raw_name })
    });

    const extractData = await extractResponse.json();

    if (!extractData.ok) {
      return NextResponse.json({
        ok: false,
        reason: 'no_nip_found',
        company_name: discovery.raw_name,
        message: 'Nie znaleziono NIP. Firma może nie być zarejestrowana w PL.'
      }, { status: 404 });
    }

    if (extractData.confidence < CONFIDENCE_THRESHOLD) {
      return NextResponse.json({
        ok: false,
        reason: 'low_confidence',
        confidence: extractData.confidence,
        candidate_nip: extractData.nip,
        message: `AI niepewne (${Math.round(extractData.confidence * 100)}%). Sprawdź ręcznie.`
      }, { status: 200 });
    }

    // 3. analyze-nip
    const analyzeResponse = await fetch(`${N8N_BASE_URL}/webhook/${N8N_ANALYZE_NIP_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LeadGen-Secret': N8N_SECRET
      },
      body: JSON.stringify({ nip: extractData.nip })
    });

    const analyzeData = await analyzeResponse.json();

    if (!analyzeData.ok) {
      return NextResponse.json({
        ok: false,
        reason: 'analyze_failed',
        nip: extractData.nip,
        message: 'Nie udało się przeanalizować firmy.'
      }, { status: 500 });
    }

    // 4. Pobierz company_id (utworzony przez analyze-nip)
    const { data: company } = await supabaseServer
      .from('companies')
      .select('id')
      .eq('nip', extractData.nip)
      .single();

    // 5. Zlinkuj discovery → company + flag PL registration
    await supabaseServer
      .from('discovered_companies')
      .update({
        company_id: company?.id,
        has_pl_registration: true
      })
      .eq('id', id);

    return NextResponse.json({
      ok: true,
      nip: extractData.nip,
      confidence: extractData.confidence,
      redirect_url: `/firma/${extractData.nip}`
    });

  } catch (error) {
    console.error('[discover extract-and-analyze] error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}