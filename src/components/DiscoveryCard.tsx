'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { DiscoveredCompany } from '@/types';

type Props = {
  company: DiscoveredCompany;
};

export default function DiscoveryCard({ company }: Props) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/discover/${company.id}/extract-and-analyze`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || data.error || 'Nie udało się przeanalizować');
      }
      if (data.redirect_url) {
        router.push(data.redirect_url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd analizy');
      setAnalyzing(false);
    }
  }

  return (
    <div className="bg-bg-panel border border-bg-border rounded-xl p-5 hover:border-text-muted transition">
      <div className="mb-3">
        <h3 className="text-lg font-semibold mb-2">{company.raw_name}</h3>
        <div className="flex flex-wrap gap-2 text-xs text-text-muted">
          {company.employees_range && (
            <span className="bg-bg-main px-2 py-1 rounded">👥 {company.employees_range}</span>
          )}
          {company.hq_country && (
            <span className="bg-bg-main px-2 py-1 rounded">🌍 {company.hq_country}</span>
          )}
          {company.industry_raw && (
            <span className="bg-bg-main px-2 py-1 rounded">🏭 {company.industry_raw}</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-4">
        <a
          href={company.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:text-blue-300 transition"
        >
          LinkedIn ↗
        </a>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="bg-accent hover:bg-accent/80 disabled:bg-bg-border disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-full transition"
        >
          {analyzing ? 'Analizuję... (~30s)' : 'Analizuj firmę →'}
        </button>
      </div>

      {error && <p className="text-danger text-xs mt-3">{error}</p>}
    </div>
  );
}