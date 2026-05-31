import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import type { CompanyRow, AiReportRow } from '@/types';

export const dynamic = 'force-dynamic';

export default async function HistoriaPage() {
  const [{ data: companies }, { data: reports }] = await Promise.all([
    supabaseServer.from('companies').select('*').order('updated_at', { ascending: false }),
    supabaseServer.from('company_ai_reports').select('*').order('generated_at', { ascending: false }),
  ]);

  const items = (companies as CompanyRow[] ?? []).map((c) => ({
    company: c,
    latestReport: (reports as AiReportRow[] ?? []).find((r) => r.company_id === c.id) ?? null,
  }));

  const scoreColor = (score: number | undefined) => {
    if (!score) return 'text-text-muted';
    if (score >= 7) return 'text-success';
    if (score >= 5) return 'text-warning';
    return 'text-danger';
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-light">Historia analiz</h1>
        <p className="text-text-muted text-sm">{items.length} {items.length === 1 ? 'firma' : items.length < 5 ? 'firmy' : 'firm'}</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-bg-panel border border-bg-border rounded-xl p-12 text-center">
          <p className="text-text-muted">Brak analiz w bazie. Wpisz pierwszy NIP na <Link href="/" className="text-accent">stronie głównej</Link>.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map(({ company, latestReport }) => (
            <li key={company.id}>
              <Link
                href={`/firma/${company.nip}`}
                className="block bg-bg-panel border border-bg-border hover:border-accent/50 rounded-xl p-6 transition"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-light truncate">{company.name ?? 'Bez nazwy'}</h2>
                    <p className="text-text-muted text-sm mt-1">
                      NIP {company.nip} · {company.legal_form ?? '—'}
                    </p>
                    {latestReport && (
                      <p className="text-text-muted text-xs mt-2">
                        {latestReport.industry_profile?.category} · {new Date(latestReport.generated_at).toLocaleDateString('pl-PL')}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-4xl font-light ${scoreColor(latestReport?.ai_score)}`}>
                      {latestReport?.ai_score ?? '—'}
                    </div>
                    <p className="text-text-muted text-xs">/ 10</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}