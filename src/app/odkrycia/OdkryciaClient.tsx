'use client';

import { useState } from 'react';
import type { DiscoveredCompany, DiscoverResponse } from '@/types';
import DiscoveryCard from '@/components/DiscoveryCard';

type Props = {
  initialCompanies: DiscoveredCompany[];
};

export default function OdkryciaClient({ initialCompanies }: Props) {
  const [companies, setCompanies] = useState<DiscoveredCompany[]>(initialCompanies);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDiscover() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/discover', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Błąd serwera');
      }
      const data: DiscoverResponse = await res.json();
      const sorted = [...data.companies].sort((a, b) =>
        b.discovered_at.localeCompare(a.discovered_at)
      );
      setCompanies(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Odkrycia firm pod radarem</h1>
        <p className="text-text-muted">
          Duże firmy z polskimi operacjami, których konkurencja nie ma na liście.
        </p>
      </header>

      <div className="mb-8">
        <button
          onClick={handleDiscover}
          disabled={loading}
          className="bg-accent hover:bg-accent/80 disabled:bg-bg-border disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-full transition"
        >
          {loading ? 'Wyszukiwanie... (30-60s)' : '🔍 Wyszukaj nowe odkrycia'}
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {companies.length === 0 ? (
        <p className="text-text-muted">Brak odkryć. Kliknij przycisk powyżej, żeby wyszukać firmy.</p>
      ) : (
        <>
          <p className="text-text-muted mb-4">
            Znaleziono <span className="text-text-main font-semibold">{companies.length}</span> firm
          </p>
          <div className="grid gap-4">
            {companies.map((c) => (
              <DiscoveryCard key={c.id} company={c} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}