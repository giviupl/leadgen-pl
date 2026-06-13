'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AnalyzeButtonProps {
  leadId: string;
  companyName: string;
}

export function AnalyzeButton({ leadId, companyName }: AnalyzeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<string>('');

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setStage('🔍 Szukam NIP firmy...');

    try {
      // Simulacja progress (extract trwa ~3-15s)
      setTimeout(() => {
        if (loading) setStage('📊 Analizuję firmę w BIR i AI...');
      }, 4000);

      const res = await fetch(`/api/radar/${leadId}/extract-and-analyze`, {
        method: 'POST'
      });

      const data = await res.json();

      if (!data.ok) {
        // Low confidence — pokaż info + opcja ręczna
        if (data.reason === 'low_confidence') {
          setError(`AI niepewne (${Math.round(data.confidence * 100)}%). Wpisz NIP ręcznie.`);
          setLoading(false);
          return;
        }
        // No NIP found
        if (data.reason === 'no_nip_found') {
          setError('Nie znaleziono NIP. Wpisz ręcznie.');
          setLoading(false);
          return;
        }
        // Inne błędy
        setError(data.message || 'Coś poszło nie tak. Spróbuj ponownie.');
        setLoading(false);
        return;
      }

      // Sukces — redirect do karty firmy
      router.push(data.redirect_url);
      router.refresh(); // wymusza re-fetch radar leads na powrocie

    } catch (e) {
      setError('Błąd połączenia. Spróbuj ponownie.');
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-warning">⚠️ {error}</span>
        <button
          onClick={() => {
            setError(null);
            // Redirect do wyszukiwarki z pre-fillem nazwy
            router.push(`/?company_search=${encodeURIComponent(companyName)}`);
          }}
          className="text-accent hover:underline"
        >
          Wpisz ręcznie →
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <span className="text-xs text-text-muted animate-pulse">
        {stage}
      </span>
    );
  }

  return (
    <button
      onClick={handleAnalyze}
      className="text-xs bg-accent/10 text-accent border border-accent/30 rounded-full px-3 py-1 hover:bg-accent/20 transition"
    >
      🔍 Analizuj firmę
    </button>
  );
}