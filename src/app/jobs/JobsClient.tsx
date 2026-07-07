'use client';

import { useMemo, useState, useTransition } from 'react';
import type { JobOffer, JobOfferStatus } from '@/types';
import JobOfferCard from '@/components/JobOfferCard';

type TabKey = 'all' | 'job_board' | 'company_site' | 'directory';
type StatusFilter = 'new' | 'applied' | 'dismissed' | 'expired' | 'all';

interface Props {
  initialOffers: JobOffer[];
}

export default function JobsClient({ initialOffers }: Props) {
  const [offers, setOffers] = useState<JobOffer[]>(initialOffers);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('new');
  const [minScore, setMinScore] = useState<number>(6);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // Manual add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addUrl, setAddUrl] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const counts = useMemo(() => {
    const byTab = {
      all: offers.length,
      job_board: offers.filter(o => o.offer_type === 'job_board').length,
      company_site: offers.filter(o => o.offer_type === 'company_site').length,
      directory: offers.filter(o => o.offer_type === 'directory').length,
    };
    const byStatus = {
      new: offers.filter(o => o.status === 'new').length,
      applied: offers.filter(o => o.status === 'applied').length,
      dismissed: offers.filter(o => o.status === 'dismissed').length,
      expired: offers.filter(o => o.status === 'expired').length,
    };
    return { byTab, byStatus };
  }, [offers]);

const filtered = useMemo(() => {
    return offers
      .filter(o => activeTab === 'all' || o.offer_type === activeTab)
      .filter(o => statusFilter === 'all' || o.status === statusFilter)
      .filter(o => {
        // Manualnie dodane (fit_score = null) zawsze pokazuj w applied
        if (o.fit_score === null && o.source_query === 'manual') return true;
        return (o.fit_score ?? 0) >= minScore;
      });
  }, [offers, activeTab, statusFilter, minScore]);

  async function handleStatusChange(id: string, newStatus: JobOfferStatus) {
    setOffers(prev =>
      prev.map(o =>
        o.id === id
          ? {
              ...o,
              status: newStatus,
              applied_at: newStatus === 'applied' ? new Date().toISOString() : o.applied_at,
            }
          : o
      )
    );

    try {
      const res = await fetch(`/api/job-offers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
    } catch (err) {
      console.error('Status update failed', err);
      setOffers(initialOffers);
      alert('Nie udało się zaktualizować statusu.');
    }
  }

  async function handleCvSentToggle(id: string, newCvSent: boolean) {
    setOffers(prev =>
      prev.map(o => (o.id === id ? { ...o, cv_sent: newCvSent } : o))
    );

    try {
      const res = await fetch(`/api/job-offers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_sent: newCvSent }),
      });
      if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
    } catch (err) {
      console.error('CV sent update failed', err);
      setOffers(initialOffers);
      alert('Nie udało się zaktualizować statusu CV.');
    }
  }

  async function handleNotesChange(id: string, notes: string) {
    setOffers(prev =>
      prev.map(o => (o.id === id ? { ...o, notes } : o))
    );

    try {
      const res = await fetch(`/api/job-offers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
    } catch (err) {
      console.error('Notes update failed', err);
      alert('Nie udało się zapisać notatki.');
    }
  }

  async function handleAddManual() {
    if (!addUrl.trim()) {
      setAddError('URL jest wymagany');
      return;
    }

    setIsAdding(true);
    setAddError(null);

    try {
      const res = await fetch('/api/job-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: addUrl.trim(),
          notes: addNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      if (data.offer && data.offer.id) {
        setOffers(prev => {
          const exists = prev.find(o => o.id === data.offer.id);
          if (exists) {
            return prev.map(o => (o.id === data.offer.id ? data.offer : o));
          }
          return [data.offer, ...prev];
        });
      }

      setAddUrl('');
      setAddNotes('');
      setShowAddForm(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nieznany błąd';
      setAddError(msg);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRefresh() {
    setRefreshMessage('Uruchamiam wyszukiwanie... (może trwać 5-10 min)');
    startRefreshTransition(async () => {
      try {
        const res = await fetch('/api/jobs', { method: 'POST' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        setRefreshMessage('Workflow zakończony. Odśwież stronę żeby zobaczyć nowe oferty.');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Nieznany błąd';
        setRefreshMessage(`Błąd: ${msg}`);
      }
    });
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Jobs</h1>
            <p className="text-sm text-zinc-400">
              {offers.length} ofert · score ≥ 4 · sortowane po fit_score
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors"
          >
            {isRefreshing ? 'Wyszukuję...' : '↻ Szukaj nowych'}
          </button>
        </div>

        {refreshMessage && (
          <div className="mb-4 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-300">
            {refreshMessage}
          </div>
        )}

        <div className="flex gap-1 mb-4 border-b border-zinc-800 flex-wrap">
          {([
            ['all', 'Wszystkie', counts.byTab.all],
            ['job_board', 'Portale rekrutacyjne', counts.byTab.job_board],
            ['company_site', 'Strony firmowe', counts.byTab.company_site],
            ['directory', 'Listingi', counts.byTab.directory],
          ] as const).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
                activeTab === key
                  ? 'border-zinc-100 text-zinc-100'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {label} <span className="text-zinc-600">({count})</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
          <div className="flex gap-1 flex-wrap">
            {([
              ['new', `Nowe (${counts.byStatus.new})`],
              ['applied', `Aplikowane (${counts.byStatus.applied})`],
              ['expired', `Wygasłe (${counts.byStatus.expired})`],
              ['dismissed', `Odrzucone (${counts.byStatus.dismissed})`],
              ['all', `Wszystkie`],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  statusFilter === key
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <label className="text-zinc-500">Min score:</label>
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-100"
            >
              {[0, 4, 5, 6, 7, 8, 9, 10].map(v => (
                <option key={v} value={v}>≥ {v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Manual add form — tylko w tabie Aplikowane */}
        {statusFilter === 'applied' && (
          <div className="mb-6 border border-zinc-800 rounded-lg bg-zinc-900/30 overflow-hidden">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full px-4 py-3 text-left text-sm hover:bg-zinc-900/50 transition-colors flex items-center justify-between"
            >
              <span className="text-zinc-300">+ Dodaj ofertę ręcznie</span>
              <span className="text-zinc-500 text-xs">{showAddForm ? 'Zwiń' : 'Rozwiń'}</span>
            </button>

            {showAddForm && (
              <div className="px-4 pb-4 pt-2 border-t border-zinc-800 space-y-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">URL oferty *</label>
                  <input
                    type="url"
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Notatki (opcjonalne)</label>
                  <textarea
                    value={addNotes}
                    onChange={(e) => setAddNotes(e.target.value)}
                    placeholder="Skąd, kontakt, deadline..."
                    rows={2}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none resize-none"
                  />
                </div>

                {addError && (
                  <div className="text-xs text-red-400 px-2 py-1 bg-red-900/20 rounded">
                    {addError}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleAddManual}
                    disabled={isAdding || !addUrl.trim()}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm text-white transition-colors"
                  >
                    {isAdding ? 'Dodaję...' : 'Dodaj'}
                  </button>
                  <button
                    onClick={() => {
                      setAddUrl('');
                      setAddNotes('');
                      setAddError(null);
                      setShowAddForm(false);
                    }}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm text-zinc-300 transition-colors"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">
            Brak ofert spełniających filtry.
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(offer => (
              <JobOfferCard
                key={offer.id}
                offer={offer}
                onStatusChange={handleStatusChange}
                onCvSentToggle={handleCvSentToggle}
                onNotesChange={handleNotesChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}