export const revalidate = 0;

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import { AnalysisCard } from '@/components/AnalysisCard';
import { FindContactsSection } from '@/components/FindContactsSection';
import type { CompanyRow, AiReportRow, CompanyData, CompanyContactsRow } from '@/types';

export const dynamic = 'force-dynamic';

export default async function FirmaPage({ params }: { params: Promise<{ nip: string }> }) {
  const { nip } = await params;

  const { data: company } = await supabaseServer
    .from('companies')
    .select('*')
    .eq('nip', nip)
    .single<CompanyRow>();

  if (!company) notFound();

  const { data: reports } = await supabaseServer
    .from('company_ai_reports')
    .select('*')
    .eq('company_id', company.id)
    .order('generated_at', { ascending: false });

  const reportsList = (reports as AiReportRow[] ?? []);
  const latestReport = reportsList[0];
  const olderReports = reportsList.slice(1);

const { data: contacts } = await supabaseServer
  .from('company_contacts')
  .select('persons, linkedin_search_urls, scraped_at, rejected')
  .eq('company_id', company.id)
  .maybeSingle<CompanyContactsRow>();

  // Adapter: row z bazy → shape oczekiwany przez AnalysisCard
const companyForCard: CompanyData = {
  nip: company.nip,
  regon: company.regon ?? '—',
  krs: company.krs_number ?? '—',
  nazwa: company.name ?? 'Bez nazwy',
  adres: company.address ?? '—',
  wojewodztwo: '—',  // BIR nie zwraca województwa osobno
  pkd: company.pkd ?? '—',
  pkd_opis: company.pkd_description ?? '—',
  forma_prawna: company.legal_form ?? '—',
  data_rejestracji: company.registration_date ?? '—',
  kapital_zakladowy: company.share_capital ?? 0,
  zarzad: company.board_members ?? [],
  vat_eu_active: company.vat_eu_active ?? undefined,
  source: 'database',
};

  const scoreColor = (score: number) => {
    if (score >= 7) return 'text-success';
    if (score >= 5) return 'text-warning';
    return 'text-danger';
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/historia" className="text-text-muted hover:text-text-main text-sm inline-flex items-center gap-2 mb-6">
        ← Wróć do historii
      </Link>

      {latestReport ? (
        <>
          <AnalysisCard company={companyForCard} analysis={{
            ai_score: latestReport.ai_score,
            score_justification: latestReport.ai_report,
            industry_profile: latestReport.industry_profile,
            estimated_marketing_budget: latestReport.estimated_marketing_budget,
            estimated_gifting_budget: latestReport.estimated_gifting_budget,
            gifting_opportunities: latestReport.gifting_opportunities,
            gifting_recommendation: latestReport.gifting_recommendation,
            recommended_contacts: latestReport.recommended_contacts,
            elevator_pitch: latestReport.elevator_pitch,
          }} />

<FindContactsSection
  nip={nip}
  companyName={company.name ?? 'Bez nazwy'}
  initialContacts={contacts}
/>

          {olderReports.length > 0 && (
            <div className="mt-12">
              <h3 className="text-text-muted text-sm uppercase tracking-wider mb-4">
                Wcześniejsze analizy ({olderReports.length})
              </h3>
              <ul className="space-y-2">
                {olderReports.map((r) => (
                  <li key={r.id} className="bg-bg-panel border border-bg-border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm">{new Date(r.generated_at).toLocaleDateString('pl-PL')}</p>
                      <p className="text-text-muted text-xs">{r.llm_provider} / {r.llm_model}</p>
                    </div>
                    <div className={`text-2xl font-light ${scoreColor(r.ai_score)}`}>{r.ai_score}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="bg-bg-panel border border-bg-border rounded-xl p-12 text-center">
          <h2 className="text-xl font-light mb-2">{company.name}</h2>
          <p className="text-text-muted">Brak raportów AI dla tej firmy.</p>
        </div>
      )}
    </main>
  );
}