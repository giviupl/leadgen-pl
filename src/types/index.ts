export type CompanyData = {
  nip: string;
  regon: string;
  krs: string;
  nazwa: string;
  adres: string;
  wojewodztwo: string;
  pkd: string;
  pkd_opis: string;
  forma_prawna: string;
  data_rejestracji: string;
  kapital_zakladowy: number;
  zarzad: Array<{ imie: string; nazwisko: string; stanowisko: string }>;
  source: string;
  vat_eu_active?: boolean;  // ← NOWE
};

export type IndustryProfile = {
  category: string;
  b2b_b2c: string;
  seasonality: string;
};

export type GiftingOpportunity = {
  type: string;
  reason: string;
};

export type GiftingRecommendation = {
  type: string;
  budget_per_person: string;
  brands: string[];
  brand_justification: string;
  estimated_quantities: string;
};

export type RecommendedContact = {
  role: string;
  department: string;
};

export type AiAnalysis = {
  ai_score: number;
  score_justification: string;
  industry_profile: IndustryProfile;
  estimated_marketing_budget: string;
  estimated_gifting_budget: string;
  gifting_opportunities: GiftingOpportunity[];
  gifting_recommendation: GiftingRecommendation;
  recommended_contacts: RecommendedContact[];
  elevator_pitch: string;
};

export type AnalysisResponse = {
  company: CompanyData;
  analysis: AiAnalysis;
};

export interface BoardMember {
  imie: string;
  nazwisko: string;
  stanowisko: string;
}

export interface CompanyRow {
  id: string;
  nip: string;
  regon: string | null;            // ← brakuje
  name: string | null;
  krs_number: string | null;
  address: string | null;
  pkd: string | null;
  pkd_description: string | null;
  registration_date: string | null;
  share_capital: number | null;
  legal_form: string | null;
  board_members: BoardMember[] | null;
  vat_eu_active: boolean | null;
  krs_fetched_at: string | null;
  vies_fetched_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export type AiReportRow = {
  id: string;
  company_id: string;
  ai_score: number;
  ai_report: string;
  industry_profile: IndustryProfile;
  estimated_marketing_budget: string;
  estimated_gifting_budget: string;
  gifting_opportunities: GiftingOpportunity[];
  gifting_recommendation: GiftingRecommendation;
  recommended_contacts: RecommendedContact[];
  elevator_pitch: string;
  llm_provider: string;
  llm_model: string;
  generated_at: string;
};

export type RadarLeadRow = {
  id: string;
  company_id: string | null;
  company_name_raw: string;
  signal_type: string;
  signal_summary: string | null;
  signal_source_url: string | null;
  signal_source_type: string | null;
  ai_score: number;
  elevator_pitch: string | null;
  signal_detected_at: string;
  is_enriched: boolean;
  created_at: string;
  company?: { nip: string } | null;	
};

// --- Find Contacts ---
export type PersonFunction = 'marketing' | 'hr' | 'comms' | 'office' | 'procurement' | 'other';
export type PersonSeniority = 'director' | 'manager' | 'specialist' | 'other';

export interface Person {
  name: string;
  linkedin_url: string;
  current_role: string;
  current_company: string;
  function: PersonFunction;
  seniority: PersonSeniority;
  is_pl_based: boolean;
  location_city: string | null;
  tenure_months: number | null;
  tenure_text: string | null;
  previous_companies: string[];
  profile_snippet: string;
  confidence: number;
  found_by_query: string;
  found_at: string;
}

export interface QueryAudit {
  query: string;
  role_function: string;
  role_seniority: string;
  results_count: number;
  kept_unique: number;
  executed_at: string;
}

export interface CompanyContactsRow {
  persons: Person[];
  linkedin_search_urls: QueryAudit[];
  scraped_at: string | null;
}