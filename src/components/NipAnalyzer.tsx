'use client';

import { useState } from 'react';
import type { AnalysisResponse } from '@/types';
import { AnalysisCard } from './AnalysisCard';
import { AnalysisProgress, type AnalysisStage } from './AnalysisProgress';

export function NipAnalyzer() {
  const [nip, setNip] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<AnalysisStage>('idle');
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const handleAnalyze = async () => {
    if (!nip.trim()) {
      setError('Wpisz NIP firmy');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Etap 1: pobieram dane firmy — minimalny 1s żeby było widoczne
      setStage('data');
      const fetchPromise = fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip: nip.trim() }),
      });
      await sleep(1000);

      // Etap 2: analizuję AI — REALNIE czekamy na response z backendu
      setStage('ai');
      const response = await fetchPromise;
      if (!response.ok) throw new Error(`Błąd: ${response.status}`);
      const data: AnalysisResponse = await response.json();

      // Etap 3: zapisuję raport — pokazuję chwilę przed wynikiem
      setStage('save');
      await sleep(700);

      // Etap 4: gotowe — krótki check
      setStage('done');
      await sleep(500);

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
    } finally {
      setLoading(false);
      setStage('idle');
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
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleAnalyze()}
            placeholder="np. 5252344078"
            disabled={loading}
            className="flex-1 bg-bg-dark border border-bg-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition disabled:opacity-50"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !nip.trim()}
            className="bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Analizuję…' : 'Analizuj'}
          </button>
        </div>
        {error && <p className="text-danger text-sm mt-3">{error}</p>}
      </div>

      {/* Progress podczas analizy */}
      {loading && <AnalysisProgress currentStage={stage} />}

      {/* Wynik */}
      {result && !loading && <AnalysisCard company={result.company} analysis={result.analysis} />}
    </div>
  );
}