'use client';

import { useState } from 'react';
import type { AnalysisResponse } from '@/types';
import { AnalysisCard } from './AnalysisCard';

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
      {result && <AnalysisCard company={result.company} analysis={result.analysis} />}
    </div>
  );
}