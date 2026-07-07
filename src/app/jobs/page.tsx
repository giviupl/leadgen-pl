import { supabaseServer } from '@/lib/supabase-server';
import type { JobOffer } from '@/types';
import JobsClient from './JobsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Jobs — LeadGen',
  robots: { index: false, follow: false },
};

export default async function JobsPage() {
  const { data, error } = await supabaseServer
    .from('job_offers')
    .select('*')
    .gte('fit_score', 4)
    .order('fit_score', { ascending: false, nullsFirst: false })
    .order('discovered_at', { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
        <h1 className="text-2xl font-bold mb-4">Jobs — błąd ładowania</h1>
        <pre className="text-red-400 text-sm whitespace-pre-wrap">
          {error.message}
        </pre>
      </div>
    );
  }

  const offers: JobOffer[] = (data ?? []) as JobOffer[];

  return <JobsClient initialOffers={offers} />;
}