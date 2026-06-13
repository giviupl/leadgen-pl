import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n-production-2b74.up.railway.app';
const N8N_EXTRACT_NIP_PATH = process.env.N8N_EXTRACT_NIP_PATH || 'extract-nip';
const N8N_ANALYZE_NIP_PATH = process.env.N8N_ANALYZE_NIP_PATH || 'dfc18236-7d46-4a08-ac75-a0c721ebcf98';
const N8N_SECRET = process.env.N8N_WEBHOOK_SECRET!;

const CONFIDENCE_THRESHOLD = 0.7;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lead_id: string }> }
) {
  const { lead_id } = await params;

  try {
    // ============================================
    // 1. Pobierz radar lead z bazy
    // ============================================
    const { data: lead, error: leadError } = await supabaseServer
      .from('radar_leads')
      .select('id, company_name_raw, company_id')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { ok: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Jeśli już ma company_id, redirect bez ponownej analizy
    if (lead.company_id) {
      const { data: company } = await supabaseServer
        .from('companies')
        .select('nip')
        .eq('id', lead.company_id)
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

    // ============================================
    // 2. Wywołaj extract-nip workflow
    // ============================================
    const extractResponse = await fetch(`${N8N_BASE_URL}/webhook/${N8N_EXTRACT_NIP_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LeadGen-Secret': N8N_SECRET
      },
      body: JSON.stringify({ company_name: lead.company_name_raw })
    });

    const extractData = await extractResponse.json();

    // Brak NIP w wynikach
    if (!extractData.ok) {
      // Zapisz że próbowaliśmy (żeby user widział "AI próbowało")
      await supabaseServer
        .from('radar_leads')
        .update({
          extraction_attempted_at: new Date().toISOString(),
          extraction_confidence: 0
        })
        .eq('id', lead_id);

      return NextResponse.json({
        ok: false,
        reason: 'no_nip_found',
        company_name: lead.company_name_raw,
        message: 'Nie znaleziono NIP w wynikach wyszukiwania. Wpisz NIP ręcznie.'
      }, { status: 404 });
    }

    // Niska pewność — nie kontynuuj
    if (extractData.confidence < CONFIDENCE_THRESHOLD) {
      await supabaseServer
        .from('radar_leads')
        .update({
          extraction_attempted_at: new Date().toISOString(),
          extraction_confidence: extractData.confidence
        })
        .eq('id', lead_id);

      return NextResponse.json({
        ok: false,
        reason: 'low_confidence',
        confidence: extractData.confidence,
        company_name: lead.company_name_raw,
        candidate_nip: extractData.nip,
        message: `AI niepewne (${Math.round(extractData.confidence * 100)}%). Sprawdź ręcznie.`
      }, { status: 200 }); // 200 bo nie jest to "error" — wymagana decyzja usera
    }

    // ============================================
    // 3. Wywołaj analyze-nip workflow z znalezionym NIP
    // ============================================
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
        message: 'Nie udało się przeanalizować firmy w BIR. NIP może nie istnieć.'
      }, { status: 500 });
    }

    // ============================================
    // 4. Pobierz company_id (utworzony przez analyze-nip)
    // ============================================
    const { data: company } = await supabaseServer
      .from('companies')
      .select('id')
      .eq('nip', extractData.nip)
      .single();

    // ============================================
    // 5. Zlinkuj radar_lead → company + zapisz metadane
    // ============================================
    await supabaseServer
      .from('radar_leads')
      .update({
        company_id: company?.id,
        extraction_attempted_at: new Date().toISOString(),
        extraction_confidence: extractData.confidence,
        extraction_source_url: extractData.source_url
      })
      .eq('id', lead_id);

    // ============================================
    // 6. Sukces
    // ============================================
    return NextResponse.json({
      ok: true,
      nip: extractData.nip,
      confidence: extractData.confidence,
      reasoning: extractData.reasoning,
      redirect_url: `/firma/${extractData.nip}`
    });

  } catch (error) {
    console.error('[extract-and-analyze] error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}