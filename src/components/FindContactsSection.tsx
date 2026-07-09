'use client';

import { useState, useEffect } from 'react';
import type { Person, CompanyContactsRow, PersonFunction, QueryAudit, RejectedPerson } from '@/types';

interface Props {
  nip: string;
  companyName: string;
  initialContacts: CompanyContactsRow | null;
}

const LOADING_MESSAGES = [
  'Szukam Marketing Directors w LinkedIn...',
  'Szukam Employer Branding...',
  'Szukam PR / Communications...',
  'Szukam Procurement...',
  'Analizuję profile (Gemini AI)...',
  'Filtruję ex-pracowników i konsultantów...',
  'Sortuję według seniority...',
];

const FUNCTION_LABELS: Record<PersonFunction, string> = {
  marketing: 'Marketing',
  hr: 'HR / EB',
  comms: 'Comms / PR',
  office: 'Office',
  procurement: 'Procurement',
  other: 'Inne',
};

const FUNCTION_STYLES: Record<PersonFunction, string> = {
  marketing: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  hr: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  comms: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  office: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  procurement: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  other: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export function FindContactsSection({ nip, companyName, initialContacts }: Props) {
  const [contacts, setContacts] = useState<CompanyContactsRow | null>(initialContacts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [showManagers, setShowManagers] = useState(false);
  const [showSpecialists, setShowSpecialists] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const persons = contacts?.persons ?? [];
  const scrapedAt = contacts?.scraped_at;

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    setLoadingMessage(LOADING_MESSAGES[0]);
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[i]);
    }, 12000);
    return () => clearInterval(interval);
  }, [loading]);

  async function handleFind(forceRefresh: boolean = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/find-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip, force_refresh: forceRefresh }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Wystąpił błąd');
      setContacts({
        persons: data.persons ?? [],
        linkedin_search_urls: data.linkedin_search_urls ?? data.queries_audit ?? [],
        rejected: data.rejected ?? [],
        scraped_at: data.scraped_at ?? new Date().toISOString(),
      });
      setHasSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nieznany błąd');
    } finally {
      setLoading(false);
    }
  }

  const directors = persons.filter(p => p.seniority === 'director');
  const managers = persons.filter(p => p.seniority === 'manager');
  const specialists = persons.filter(p => p.seniority === 'specialist');
  const others = persons.filter(p => p.seniority === 'other');

  return (
    <section className="mt-12 bg-bg-panel border border-bg-border rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-text-muted text-sm uppercase tracking-wider">
          Kontakty z LinkedIn {persons.length > 0 && `(${persons.length})`}
        </h3>
        <div className="flex items-center gap-3">
          {scrapedAt && (
            <span className="text-text-muted text-xs">
              Aktualizacja: {new Date(scrapedAt).toLocaleDateString('pl-PL')}
            </span>
          )}
          {persons.length > 0 && !loading && (
            <button
              onClick={() => handleFind(true)}
              className="text-text-muted hover:text-text-main text-xs px-3 py-1 border border-bg-border rounded-md transition-colors"
            >
              Odśwież
            </button>
          )}
        </div>
      </div>

      {/* Empty state — różne warianty zależnie od historii */}
      {persons.length === 0 && !loading && (
        <EmptyState
          companyName={companyName}
          scrapedAt={scrapedAt}
          queries={contacts?.linkedin_search_urls ?? []}
          rejected={contacts?.rejected ?? []}
          hasSearched={hasSearched}
          onFind={() => handleFind(false)}
        />
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-10">
          <div className="inline-block w-8 h-8 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mb-4" />
          <p className="text-text-main text-sm font-medium animate-pulse">{loadingMessage}</p>
          <p className="text-text-muted text-xs mt-2">
            Może to potrwać do minuty · {companyName}
          </p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Loaded — persons grouped */}
      {!loading && persons.length > 0 && (
        <div className="space-y-6">
          {directors.length > 0 && (
            <PersonGroup
              title="Decision makers"
              subtitle={`${directors.length} osób · poziom Director`}
              persons={directors}
            />
          )}

          {managers.length > 0 && (
            <CollapsibleGroup
              title="Managers / Leads"
              count={managers.length}
              isOpen={showManagers}
              onToggle={() => setShowManagers(!showManagers)}
              persons={managers}
            />
          )}

          {specialists.length > 0 && (
            <CollapsibleGroup
              title="Specialists"
              count={specialists.length}
              isOpen={showSpecialists}
              onToggle={() => setShowSpecialists(!showSpecialists)}
              persons={specialists}
            />
          )}

          {others.length > 0 && (
            <CollapsibleGroup
              title="Inne / nieskategoryzowane"
              count={others.length}
              isOpen={showOthers}
              onToggle={() => setShowOthers(!showOthers)}
              persons={others}
            />
          )}
        </div>
      )}
    </section>
  );
}

function EmptyState({
  companyName,
  scrapedAt,
  queries,
  rejected,
  hasSearched,
  onFind,
}: {
  companyName: string;
  scrapedAt: string | null | undefined;
  queries: QueryAudit[];
  rejected: RejectedPerson[];
  hasSearched: boolean;
  onFind: () => void;
}) {
  const wasSearched = hasSearched || (scrapedAt != null && queries.length > 0);
  const cleanCompanyName = companyName
    .replace(/\s+(SPÓŁKA AKCYJNA|S\.A\.|SP\. Z O\.O\.|SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ|SP\. Z OO|SP Z OO)$/i, '')
    .trim();

  const linkedinSearchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(cleanCompanyName)}`;

  // Wariant 1: nigdy nie szukano
  if (!wasSearched) {
    return (
      <div className="text-center py-8">
        <p className="text-text-muted text-sm mb-4">
          Brak zapisanych kontaktów dla tej firmy.
        </p>
        <button
          onClick={onFind}
          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Znajdź kontakty
        </button>
        <p className="text-text-muted text-xs mt-3">
          Wyszukiwanie zajmuje ~30 sekund · 5 zapytań do LinkedIn + analiza AI
        </p>
      </div>
    );
  }

  // Wariant 2: szukano, ale 0 wyników po filtrowaniu
  const queriesWithResults = queries.filter(q => q.results_count > 0);

  return (
    <div className="space-y-5">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
        <p className="text-amber-200 text-sm font-medium mb-1">
          Nie znaleziono aktywnych kontaktów
        </p>
        <p className="text-text-muted text-xs">
          AI sprawdziła {queries.length} ról, znaleziono {queriesWithResults.length} {queriesWithResults.length === 1 ? 'profil' : 'profili'} — {queriesWithResults.length === 0 ? 'wyniki są puste' : 'wszystkie odrzucone (byli pracownicy lub osoby z innych firm)'}.
          Możliwe że firma nie ma publicznych profili na LinkedIn.
        </p>
      </div>

      {/* Audit queries */}
      {queries.length > 0 && (
        <div>
          <h4 className="text-text-muted text-xs uppercase tracking-wider mb-2">
            Sprawdzone role
          </h4>
          <ul className="space-y-1 text-xs">
            {queries.map((q, i) => (
              <li key={i} className="flex items-center gap-2 text-text-muted">
                <span className={q.results_count > 0 ? 'text-amber-400' : 'text-text-muted/50'}>
                  {q.results_count > 0 ? '✓' : '–'}
                </span>
                <span className="capitalize">{q.role_function}</span>
                {q.results_count > 0 ? (
                  <span className="text-text-muted/70">
                    ({q.results_count} {q.results_count === 1 ? 'wynik' : 'wyniki'}, odrzucone)
                  </span>
                ) : (
                  <span className="text-text-muted/50">brak wyników</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rejected details */}
      {rejected.length > 0 && (
        <div>
          <h4 className="text-text-muted text-xs uppercase tracking-wider mb-2">
            Odrzucone profile ({rejected.length})
          </h4>
          <ul className="space-y-1 text-xs text-text-muted">
            {rejected.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-text-muted/50">×</span>
                <span>
                  <span className="text-text-main">{r.name}</span>
                  <span className="text-text-muted/70"> — {r.reason}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-bg-border">
        <a
          href={linkedinSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-lg transition-colors text-center"
        >
          Szukaj ręcznie na LinkedIn ↗
        </a>
        <button
          onClick={onFind}
          className="text-sm px-4 py-2 bg-bg-panel hover:bg-bg-border text-text-muted hover:text-text-main border border-bg-border rounded-lg transition-colors"
        >
          Spróbuj jeszcze raz
        </button>
      </div>
    </div>
  );
}

function PersonGroup({ title, subtitle, persons }: { title: string; subtitle?: string; persons: Person[] }) {
  return (
    <div>
      <div className="mb-3">
        <h4 className="text-text-main font-medium">{title}</h4>
        {subtitle && <p className="text-text-muted text-xs">{subtitle}</p>}
      </div>
      <div className="space-y-3">
        {persons.map((p) => (
          <PersonCard key={p.linkedin_url} person={p} />
        ))}
      </div>
    </div>
  );
}

function CollapsibleGroup({
  title,
  count,
  isOpen,
  onToggle,
  persons,
}: {
  title: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  persons: Person[];
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left py-2 border-b border-bg-border hover:border-text-muted transition-colors"
      >
        <span className="text-text-main font-medium">
          {title} <span className="text-text-muted font-normal">({count})</span>
        </span>
        <span className="text-text-muted text-sm">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="space-y-3 mt-3">
          {persons.map((p) => (
            <PersonCard key={p.linkedin_url} person={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PersonCard({ person }: { person: Person }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(person.profile_snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <article className="bg-bg-main/40 border border-bg-border rounded-lg p-4 hover:border-text-muted/40 transition-colors">
      {/* Header: name + function badge */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h5 className="text-text-main font-medium">{person.name}</h5>
          <p className="text-text-muted text-sm">{person.current_role}</p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded border ${FUNCTION_STYLES[person.function]} whitespace-nowrap`}
        >
          {FUNCTION_LABELS[person.function]}
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 text-xs text-text-muted mb-3">
        {person.location_city && <span>📍 {person.location_city}</span>}
        {person.tenure_text && <span>⏱ {person.tenure_text}</span>}
        {!person.is_pl_based && <span title="Profil spoza Polski">🌍</span>}
        {person.confidence < 1 && (
          <span title="Niższa pewność dopasowania">
            ⚠️ pewność {Math.round(person.confidence * 100)}%
          </span>
        )}
      </div>

      {person.profile_snippet && (
        <p className="text-text-muted text-xs italic mb-3 line-clamp-2">
          {person.profile_snippet}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <a
          href={`https://${person.linkedin_url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded transition-colors"
        >
          Otwórz LinkedIn ↗
        </a>
        <button
          onClick={handleCopy}
          className="text-xs px-3 py-1 bg-bg-panel hover:bg-bg-border text-text-muted hover:text-text-main border border-bg-border rounded transition-colors"
        >
          {copied ? '✓ Skopiowano' : 'Kopiuj snippet'}
        </button>
      </div>
    </article>
  );
}