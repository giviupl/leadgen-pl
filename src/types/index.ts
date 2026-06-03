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

export type CompanyRow = {
  id: string;
  nip: string;
  name: string | null;
  krs_number: string | null;
  address: string | null;
  pkd: string | null;
  pkd_description: string | null;
  registration_date: string | null;
  share_capital: number | null;
  legal_form: string | null;
  board_members: Array<{ imie: string; nazwisko: string; stanowisko: string }> | null;
  website: string | null;
  created_at: string;
  updated_at: string;
};

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
};