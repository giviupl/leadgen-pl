'use client';

import { useState, useEffect } from 'react';
import type { Person, CompanyContactsRow, PersonFunction } from '@/types';

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
        linkedin_search_urls: [],
        scraped_at: data.scraped_at,
      });
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

      {/* Empty state */}
      {persons.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-text-muted text-sm mb-4">
            Brak zapisanych kontaktów dla tej firmy.
          </p>
          <button
            onClick={() => handleFind(false)}
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Znajdź kontakty
          </button>
          <p className="text-text-muted text-xs mt-3">
            Wyszukiwanie zajmuje ~30 sekund · 5 zapytań do LinkedIn + analiza AI
          </p>
        </div>
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