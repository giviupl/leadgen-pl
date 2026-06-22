export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseServer } from '@/lib/supabase-server';
import type { DiscoveredCompany } from '@/types';
import OdkryciaClient from './OdkryciaClient';

export default async function OdkryciaPage() {
  const { data } = await supabaseServer
    .from('discovered_companies')
    .select('id, raw_name, linkedin_url, employees_range, industry_raw, hq_country, has_pl_registration, discovered_at, company_id')
    .order('discovered_at', { ascending: false });

  const initial: DiscoveredCompany[] = (data ?? []).map((c) => ({
    id: c.id,
    raw_name: c.raw_name,
    linkedin_url: c.linkedin_url,
    employees_range: c.employees_range,
    industry_raw: c.industry_raw,
    hq_country: c.hq_country,
    has_pl_registration: c.has_pl_registration,
    discovered_at: c.discovered_at,
  }));

  return <OdkryciaClient initialCompanies={initial} />;
}