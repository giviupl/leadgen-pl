'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnalysisProgress, type AnalysisStage } from './AnalysisProgress';

export function NipAnalyzer() {
  const router = useRouter();
  const [nip, setNip] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<AnalysisStage>('idle');
  const [error, setError] = useState<string | null>(null);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const handleAnalyze = async () => {
    if (!nip.trim()) {
      setError('Wpisz NIP firmy');
      return;
    }

    const cleanNip = nip.trim();
    setLoading(true);
    setError(null);

    try {
      setStage('data');
      const fetchPromise = fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip: cleanNip }),
      });
      await sleep(1000);

      setStage('ai');
      const response = await fetchPromise;
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Błąd: ${response.status}`);
      }
      await response.json();

      setStage('save');
      await sleep(700);

      setStage('done');
      await sleep(500);

      // Redirect do /firma/[nip] — strona Server Component czyta świeży zapis z bazy
      const normalizedNip = cleanNip.replace(/\D/g, '');
      router.push(`/firma/${normalizedNip}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
      setLoading(false);
      setStage('idle');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-12">
      <div className="bg-bg-panel border border-bg-border rounded-xl p-6 mb-6">
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

      {loading && <AnalysisProgress currentStage={stage} />}
    </div>
  );
}
