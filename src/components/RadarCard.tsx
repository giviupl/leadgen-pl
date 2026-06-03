import Link from 'next/link';
import type { RadarLeadRow } from '@/types';

const SIGNAL_LABELS: Record<string, { label: string; icon: string }> = {
  new_market_entry: { label: 'Wejście na rynek', icon: '🌍' },
  big_contract: { label: 'Duży kontrakt', icon: '📋' },
  revenue_record: { label: 'Rekord przychodów', icon: '📈' },
  expansion: { label: 'Ekspansja', icon: '🚀' },
  ipo: { label: 'Debiut giełdowy', icon: '💎' },
  merger: { label: 'Fuzja / Przejęcie', icon: '🤝' },
  funding_round: { label: 'Finansowanie', icon: '💰' },
  industry_trend: { label: 'Trend branżowy', icon: '📊' },
};

const scoreColor = (score: number) => {
  if (score >= 7) return 'text-success';
  if (score >= 5) return 'text-warning';
  return 'text-danger';
};

export function RadarCard({ lead }: { lead: RadarLeadRow }) {
  const signal = SIGNAL_LABELS[lead.signal_type] ?? { label: lead.signal_type, icon: '🔔' };

  return (
    <div className="bg-bg-panel border border-bg-border rounded-xl p-6 hover:border-accent/30 transition">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="text-2xl shrink-0" aria-hidden>{signal.icon}</span>
          <div className="min-w-0">
            <h3 className="text-lg font-light truncate">{lead.company_name_raw}</h3>
            <span className="inline-block mt-1 text-xs bg-bg-dark border border-bg-border rounded-full px-2.5 py-0.5 text-text-muted">
              {signal.label}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-3xl font-light ${scoreColor(lead.ai_score)}`}>
            {lead.ai_score}
          </div>
          <p className="text-text-muted text-xs">/ 10</p>
        </div>
      </div>

      {lead.signal_summary && (
        <p className="text-sm text-text-main mb-3 leading-relaxed">{lead.signal_summary}</p>
      )}

      {lead.elevator_pitch && (
        <div className="bg-bg-dark border-l-2 border-accent rounded-r-md px-3 py-2 mb-3">
          <p className="text-xs text-text-muted mb-1">Elevator pitch</p>
          <p className="text-sm leading-relaxed">{lead.elevator_pitch}</p>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-text-muted">
{lead.signal_source_url ? <a href={lead.signal_source_url} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition">Źródło →</a> : null}
        {lead.company_id && (
          <Link
            href={`/firma/${lead.company_id}`}
            className="hover:text-accent transition"
          >
            Pełna analiza →
          </Link>
        )}
        <span className="ml-auto">
          {new Date(lead.signal_detected_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}