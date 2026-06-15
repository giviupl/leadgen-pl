import type { CompanyData, AiAnalysis } from '@/types';

export function AnalysisCard({
  company,
  analysis,
}: {
  company: CompanyData;
  analysis: AiAnalysis;
}) {
  const scoreColor = (score: number) => {
    if (score >= 7) return 'text-success';
    if (score >= 5) return 'text-warning';
    return 'text-danger';
  };

  const displayDomain = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

  return (
    <div className="space-y-6">
      <div className="bg-bg-panel border border-bg-border rounded-xl p-8 flex items-start justify-between gap-6">
        <div>
          <h2 className="text-3xl font-light mb-2">{company.nazwa}</h2>
          <p className="text-text-muted">
            NIP {company.nip} · {company.adres}
          </p>
          {company.website ? (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline mt-2"
            >
              {displayDomain(company.website)} ↗
            </a>
          ) : (
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(company.nazwa + ' oficjalna strona')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline mt-2"
            >
              Szukaj strony w Google ↗
            </a>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className={`text-7xl font-light ${scoreColor(analysis.ai_score)}`}>
            {analysis.ai_score}
          </div>
          <p className="text-text-muted text-sm">/ 10</p>
        </div>
      </div>

      <div className="bg-bg-panel border border-bg-border rounded-xl p-8">
        <h3 className="text-text-muted text-sm uppercase tracking-wider mb-3">Uzasadnienie scoringu</h3>
        <p className="leading-relaxed">{analysis.score_justification}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-bg-panel border border-bg-border rounded-xl p-8">
          <h3 className="text-text-muted text-sm uppercase tracking-wider mb-4">Dane firmy</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-text-muted">REGON</dt><dd>{company.regon}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-text-muted">KRS</dt><dd>{company.krs}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-text-muted">Forma prawna</dt><dd>{company.forma_prawna}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-text-muted">PKD</dt><dd className="text-right">{company.pkd}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-text-muted">Kapitał zakł.</dt><dd>{company.kapital_zakladowy.toLocaleString('pl-PL')} PLN</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-text-muted">Rejestracja</dt><dd>{company.data_rejestracji}</dd></div>
            <div className="flex justify-between gap-4 items-center pt-2 mt-2 border-t border-bg-border">
              <dt className="text-text-muted">VAT EU</dt>
              <dd>
                {company.vat_eu_active === true && (
                  <span className="inline-flex items-center gap-1.5 text-success">
                    <span className="w-2 h-2 bg-success rounded-full"></span>
                    Aktywny
                  </span>
                )}
                {company.vat_eu_active === false && (
                  <span className="text-text-muted">Nieaktywny</span>
                )}
                {company.vat_eu_active === undefined && (
                  <span className="text-text-muted">—</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-bg-panel border border-bg-border rounded-xl p-8">
          <h3 className="text-text-muted text-sm uppercase tracking-wider mb-4">Profil branżowy</h3>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-text-muted mb-1">Kategoria</dt><dd>{analysis.industry_profile.category}</dd></div>
            <div><dt className="text-text-muted mb-1">Typ działalności</dt><dd>{analysis.industry_profile.b2b_b2c}</dd></div>
            <div><dt className="text-text-muted mb-1">Sezonowość</dt><dd>{analysis.industry_profile.seasonality}</dd></div>
          </dl>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-bg-panel border border-bg-border rounded-xl p-8">
          <h3 className="text-text-muted text-sm uppercase tracking-wider mb-2">Budżet marketingowy</h3>
          <p className="text-2xl font-light">{analysis.estimated_marketing_budget}</p>
        </div>
        <div className="bg-bg-panel border border-bg-border rounded-xl p-8">
          <h3 className="text-text-muted text-sm uppercase tracking-wider mb-2">Budżet giftingowy</h3>
          <p className="text-2xl font-light text-accent">{analysis.estimated_gifting_budget}</p>
        </div>
      </div>

      <div className="bg-bg-panel border border-bg-border rounded-xl p-8">
        <h3 className="text-text-muted text-sm uppercase tracking-wider mb-4">Okazje giftingowe</h3>
        <ul className="space-y-3">
          {analysis.gifting_opportunities.map((opp, i) => (
            <li key={i} className="border-l-2 border-accent pl-4">
              <p className="font-medium">{opp.type}</p>
              <p className="text-text-muted text-sm mt-1">{opp.reason}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-bg-panel border border-bg-border rounded-xl p-8">
        <h3 className="text-text-muted text-sm uppercase tracking-wider mb-4">Rekomendacja giftingu</h3>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {analysis.gifting_recommendation.brands.map((brand) => (
              <span key={brand} className="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm">{brand}</span>
            ))}
          </div>
          <p className="text-sm leading-relaxed">{analysis.gifting_recommendation.brand_justification}</p>
          <div className="grid grid-cols-2 gap-4 text-sm pt-2">
            <div><span className="text-text-muted">Budżet per osoba:</span> <span>{analysis.gifting_recommendation.budget_per_person}</span></div>
            <div><span className="text-text-muted">Skala:</span> <span>{analysis.gifting_recommendation.estimated_quantities}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-accent/20 to-bg-panel border border-accent/40 rounded-xl p-8">
        <h3 className="text-accent text-sm uppercase tracking-wider mb-3">Elevator pitch</h3>
        <p className="leading-relaxed">{analysis.elevator_pitch}</p>
      </div>
    </div>
  );
}