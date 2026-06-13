import { supabaseServer } from '@/lib/supabase-server';
import type { RadarLeadRow } from '@/types';
import { RadarCard } from './RadarCard';

function dateGroupLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Dzisiaj';
  if (sameDay(date, yesterday)) return 'Wczoraj';
  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export async function RadarFeed() {
const { data: leads } = await supabaseServer
  .from('radar_leads')
  .select('*, company:companies(nip)')
  .order('signal_detected_at', { ascending: false })
  .limit(50);

  const leadList = (leads as RadarLeadRow[] ?? []);

  if (leadList.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-bg-panel border border-bg-border rounded-xl p-12 text-center">
          <p className="text-text-muted">
            Brak sygnałów w bazie. Uruchom workflow <code className="text-accent">radar-daily</code> w n8n żeby pobrać pierwsze leady z dzisiejszych newsów.
          </p>
        </div>
      </div>
    );
  }

  // Grupuj po dacie (label)
  const groups = new Map<string, RadarLeadRow[]>();
  for (const lead of leadList) {
    const label = dateGroupLabel(lead.signal_detected_at);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(lead);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light">
          <span className="text-accent">Radar</span> · Sygnały zakupowe
        </h2>
        <p className="text-text-muted text-sm">{leadList.length} {leadList.length === 1 ? 'sygnał' : leadList.length < 5 ? 'sygnały' : 'sygnałów'}</p>
      </div>

      <div className="space-y-8">
        {Array.from(groups.entries()).map(([label, group]) => (
          <section key={label}>
            <h3 className="text-text-muted text-sm uppercase tracking-wider mb-3 pb-2 border-b border-bg-border">
              {label}
            </h3>
            <div className="space-y-3">
              {group.map((lead) => (
                <RadarCard key={lead.id} lead={lead} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}