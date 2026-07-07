'use client';

import { useState } from 'react';
import type { JobOffer, JobOfferStatus, JobOfferType } from '@/types';

interface Props {
  offer: JobOffer;
  onStatusChange: (id: string, status: JobOfferStatus) => void;
  onCvSentToggle?: (id: string, cvSent: boolean) => void;
  onNotesChange?: (id: string, notes: string) => void;
}

function scoreColor(score: number | null): string {
  if (score === null) return 'bg-zinc-700 text-zinc-300';
  if (score >= 9) return 'bg-emerald-600 text-white';
  if (score >= 7) return 'bg-emerald-700 text-emerald-100';
  if (score >= 5) return 'bg-amber-700 text-amber-100';
  return 'bg-zinc-700 text-zinc-300';
}

function statusBadge(status: JobOfferStatus): { className: string; label: string } {
  switch (status) {
    case 'applied':
      return { className: 'bg-blue-900 text-blue-200 border-blue-800', label: 'aplikowano' };
    case 'dismissed':
      return { className: 'bg-zinc-800 text-zinc-500 border-zinc-700', label: 'odrzucone' };
    case 'expired':
      return { className: 'bg-orange-900 text-orange-200 border-orange-800', label: 'wygasła' };
    default:
      return { className: 'bg-zinc-800 text-zinc-300 border-zinc-700', label: 'nowa' };
  }
}

function offerTypeBadge(type: JobOfferType): string {
  switch (type) {
    case 'job_board': return 'Portal';
    case 'directory': return 'Listing';
    case 'company_site': return 'Strona firmowa';
  }
}

export default function JobOfferCard({ offer, onStatusChange, onCvSentToggle, onNotesChange }: Props) {
  const isDimmed = offer.status === 'dismissed';
  const isExpired = offer.status === 'expired';
  const isDirectory = offer.offer_type === 'directory';
  const isApplied = offer.status === 'applied';
  const badge = statusBadge(offer.status);

  const [showNotes, setShowNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(offer.notes || '');

  function handleNotesSave() {
    if (notesValue !== (offer.notes || '')) {
      onNotesChange?.(offer.id, notesValue);
    }
  }

  return (
    <div
      className={`border rounded-lg p-4 bg-zinc-900/50 transition-opacity ${
        isDimmed ? 'opacity-50 border-zinc-800' : 'border-zinc-800'
      } ${isExpired ? 'border-orange-900/50' : ''}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`shrink-0 w-12 h-12 rounded flex items-center justify-center font-bold text-lg ${scoreColor(
            offer.fit_score
          )}`}
        >
          {offer.fit_score ?? '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <a
              href={offer.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-100 font-medium hover:underline truncate block"
            >
              {offer.title || offer.url}
            </a>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded border ${badge.className}`}>
              {badge.label}
            </span>
          </div>

          <div className="text-xs text-zinc-500 mb-2 flex flex-wrap gap-x-3 gap-y-1">
            {offer.company_name && <span>{offer.company_name}</span>}
            {offer.location && <span>· {offer.location}</span>}
            <span>· {offer.domain}</span>
            <span>· {offerTypeBadge(offer.offer_type)}</span>
            <span>· {offer.language}</span>
          </div>

          {isExpired && (
            <div className="mb-2 px-2 py-1 bg-orange-950/40 border border-orange-900/50 rounded text-xs text-orange-200">
              ⏳ Oferta wygasła — możesz wysłać CV w ciemno do tej firmy (mają temat AI)
            </div>
          )}
          {isDirectory && !isExpired && (
            <div className="mb-2 px-2 py-1 bg-purple-950/40 border border-purple-900/50 rounded text-xs text-purple-200">
              📋 Listing — strona ze spisem ofert. Otwórz i sprawdź indywidualne pozycje.
            </div>
          )}

          {offer.fit_reasoning && (
            <p className="text-sm text-zinc-300 mb-2">{offer.fit_reasoning}</p>
          )}

          {offer.key_skills && offer.key_skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {offer.key_skills.map((skill, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-emerald-900/40 text-emerald-200 rounded">
                  {skill}
                </span>
              ))}
            </div>
          )}

          {offer.red_flags && offer.red_flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {offer.red_flags.map((flag, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-red-900/40 text-red-200 rounded">
                  ⚠ {flag}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-3 flex-wrap items-center">
            {isApplied && (
              <button
                onClick={() => onCvSentToggle?.(offer.id, !offer.cv_sent)}
                className={`text-xs px-3 py-1 rounded transition-colors ${
                  offer.cv_sent
                    ? 'bg-emerald-700 hover:bg-emerald-600 text-emerald-100'
                    : 'bg-red-700 hover:bg-red-600 text-red-100'
                }`}
              >
                {offer.cv_sent ? '✓ CV wysłane' : '○ CV niewysłane'}
              </button>
            )}
            {!isApplied && (
              <button
                onClick={() => onStatusChange(offer.id, 'applied')}
                className="text-xs px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded transition-colors"
              >
                ✓ Aplikuję
              </button>
            )}
            {offer.status !== 'dismissed' && (
              <button
                onClick={() => onStatusChange(offer.id, 'dismissed')}
                className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
              >
                ✗ Odrzuć
              </button>
            )}
            {offer.status !== 'expired' && (
              <button
                onClick={() => onStatusChange(offer.id, 'expired')}
                className="text-xs px-3 py-1 bg-orange-900/60 hover:bg-orange-800 rounded transition-colors"
              >
                ⏳ Wygasła
              </button>
            )}
            {offer.status !== 'new' && (
              <button
                onClick={() => onStatusChange(offer.id, 'new')}
                className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
              >
                ↺ Przywróć
              </button>
            )}

            {/* Notatki — tylko dla applied */}
            {isApplied && onNotesChange && (
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
              >
                {offer.notes ? '📝 Notatka' : '+ Notatka'}
              </button>
            )}
          </div>

          {/* Inline notes editor */}
          {isApplied && showNotes && onNotesChange && (
            <div className="mt-3 pt-3 border-t border-zinc-800">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                onBlur={handleNotesSave}
                placeholder="Notatki do oferty: kontakt, deadline, status rekrutacji, czego się dowiedziałem..."
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => {
                    handleNotesSave();
                    setShowNotes(false);
                  }}
                  className="text-xs px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded transition-colors"
                >
                  Zapisz i zwiń
                </button>
              </div>
            </div>
          )}

          {/* Display notes if exist and editor closed */}
          {isApplied && !showNotes && offer.notes && (
            <div className="mt-3 pt-3 border-t border-zinc-800 text-sm text-zinc-300 whitespace-pre-wrap">
              {offer.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}