'use client';

import { useState } from 'react';
import type { AnalysisResponse } from '@/types';

export function NipAnalyzer() {
  const [nip, setNip] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!nip.trim()) {
      setError('Wpisz NIP firmy');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip: nip.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Błąd: ${response.status}`);
      }

      const data: AnalysisResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 9) return 'text-success';
    if (score >= 7) return 'text-success';
    if (score >= 5) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Formularz */}
      <div className="bg-bg-panel border border-bg-border rounded-xl p-8 mb-8">
        <label className="block text-text-muted text-sm mb-2">
          NIP firmy do analizy
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={nip}
            onChange={(e) => setNip(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="np. 5252344078"
            disabled={loading}
            className="flex-1 bg-bg-dark border border-bg-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !nip.trim()}
            className="bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Analizuję...' : 'Analizuj'}
          </button>
        </div>
        {error && <p className="text-danger text-sm mt-3">{error}</p>}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-bg-border border-t-accent rounded-full animate-spin mb-4"></div>
          <p className="text-text-muted">
            Pobieram dane z KRS, analizuję AI, zapisuję do bazy…
          </p>
        </div>
      )}

      {/* Wynik */}
      {result && (
        <div className="space-y-6">
          {/* Header: nazwa + score */}
          <div className="bg-bg-panel border border-bg-border rounded-xl p-8 flex items-start justify-between gap-6">
            <div>
              <h2 className="text-3xl font-light mb-2">{result.company.nazwa}</h2>
              <p className="text-text-muted">
                NIP {result.company.nip} · {result.company.adres}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-7xl font-light ${scoreColor(result.analysis.ai_score)}`}>
                {result.analysis.ai_score}
              </div>
              <p className="text-text-muted text-sm">/ 10</p>
            </div>
          </div>

          {/* Uzasadnienie */}
          <div className="bg-bg-panel border border-bg-border rounded-xl p-8">
            <h3 className="text-text-muted text-sm uppercase tracking-wider mb-3">
              Uzasadnienie scoringu
            </h3>
            <p className="leading-relaxed">{result.analysis.score_justification}</p>
          </div>

          {/* Dane firmy + Profil branżowy */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-bg-panel border border-bg-border rounded-xl p-8">
              <h3 className="text-text-muted text-sm uppercase tracking-wider mb-4">
                Dane firmy
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">REGON</dt>
                  <dd>{result.company.regon}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">KRS</dt>
                  <dd>{result.company.krs}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">Forma prawna</dt>
                  <dd>{result.company.forma_prawna}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">PKD</dt>
                  <dd className="text-right">{result.company.pkd}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">Kapitał zakł.</dt>
                  <dd>{result.company.kapital_zakladowy.toLocaleString('pl-PL')} PLN</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">Rejestracja</dt>
                  <dd>{result.company.data_rejestracji}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-bg-panel border border-bg-border rounded-xl p-8">
              <h3 className="text-text-muted text-sm uppercase tracking-wider mb-4">
                Profil branżowy
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-text-muted mb-1">Kategoria</dt>
                  <dd>{result.analysis.industry_profile.category}</dd>
                </div>
                <div>
                  <dt className="text-text-muted mb-1">Typ działalności</dt>
                  <dd>{result.analysis.industry_profile.b2b_b2c}</dd>
                </div>
                <div>
                  <dt className="text-text-muted mb-1">Sezonowość</dt>
                  <dd>{result.analysis.industry_profile.seasonality}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Budżety */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-bg-panel border border-bg-border rounded-xl p-8">
              <h3 className="text-text-muted text-sm uppercase tracking-wider mb-2">
                Budżet marketingowy
              </h3>
              <p className="text-2xl font-light">
                {result.analysis.estimated_marketing_budget}
              </p>
            </div>
            <div className="bg-bg-panel border border-bg-border rounded-xl p-8">
              <h3 className="text-text-muted text-sm uppercase tracking-wider mb-2">
                Budżet giftingowy
              </h3>
              <p className="text-2xl font-light text-accent">
                {result.analysis.estimated_gifting_budget}
              </p>
            </div>
          </div>

          {/* Okazje */}
          <div className="bg-bg-panel border border-bg-border rounded-xl p-8">
            <h3 className="text-text-muted text-sm uppercase tracking-wider mb-4">
              Okazje giftingowe
            </h3>
            <ul className="space-y-3">
              {result.analysis.gifting_opportunities.map((opp, i) => (
                <li key={i} className="border-l-2 border-accent pl-4">
                  <p className="font-medium">{opp.type}</p>
                  <p className="text-text-muted text-sm mt-1">{opp.reason}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Rekomendacja */}
          <div className="bg-bg-panel border border-bg-border rounded-xl p-8">
            <h3 className="text-text-muted text-sm uppercase tracking-wider mb-4">
              Rekomendacja giftingu
            </h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {result.analysis.gifting_recommendation.brands.map((brand) => (
                  <span
                    key={brand}
                    className="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm"
                  >
                    {brand}
                  </span>
                ))}
              </div>
              <p className="text-sm leading-relaxed">
                {result.analysis.gifting_recommendation.brand_justification}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                <div>
                  <span className="text-text-muted">Budżet per osoba:</span>{' '}
                  <span>{result.analysis.gifting_recommendation.budget_per_person}</span>
                </div>
                <div>
                  <span className="text-text-muted">Skala:</span>{' '}
                  <span>{result.analysis.gifting_recommendation.estimated_quantities}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Kogo szukać */}
          <div className="bg-bg-panel border border-bg-border rounded-xl p-8">
            <h3 className="text-text-muted text-sm uppercase tracking-wider mb-4">
              Kogo szukać
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {result.analysis.recommended_contacts.map((c, i) => (
                <div key={i} className="bg-bg-dark border border-bg-border rounded-lg p-4">
                  <p className="font-medium">{c.role}</p>
                  <p className="text-text-muted text-sm">{c.department}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Elevator pitch */}
          <div className="bg-gradient-to-br from-accent/20 to-bg-panel border border-accent/40 rounded-xl p-8">
            <h3 className="text-accent text-sm uppercase tracking-wider mb-3">
              Elevator pitch
            </h3>
            <p className="leading-relaxed">{result.analysis.elevator_pitch}</p>
          </div>
        </div>
      )}
    </div>
  );
}