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