# LeadGen — AI Lead Intelligence for Polish B2B

> On-demand company analysis by NIP + daily radar of buying signals from Polish business news. AI-scored for B2B corporate gifting potential.

**[Live Demo](https://leadgen-pl.vercel.app/)** · Built by [@giviupl](https://github.com/giviupl)

![LeadGen analyzer screenshot](./public/screenshot.png)

## Two modes

**🔍 Analyzer** — enter a NIP → registry data, AI scoring 1-10, budget estimates, gift brand recommendations, and a sales elevator pitch. ~6s end-to-end.

**📡 Radar** *(in progress)* — daily cron scans Bankier, Money, Strefa Biznesu for buying triggers (new contracts, expansion, IPO, hiring sprees, revenue records). Each hot company runs through the analyzer pipeline. Morning brief: 5–15 ranked leads with signal context and elevator pitch.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · **n8n** on Railway · **Supabase** PostgreSQL · **Gemini 2.5 Flash** (JSON mode) · Vercel + Railway

## Architecture

[User form]  OR  [Vercel cron]
↓               ↓
└→ [n8n webhook] ←┘
↓
Fetch data → Gemini → Supabase → Response
↓
[Analyzer UI]  OR  [Radar feed]

Adapter pattern isolates the data source — swapping placeholder for REGON BIR SOAP touches one node, the rest stays untouched. Both modes share the same enrichment pipeline.

## Key decisions

- **n8n over code** — visual workflow as documentation; retries + persistence + telemetry built-in
- **Server Components only for DB access** — service_role key never reaches the client
- **Idempotent writes** — PostgREST merge-duplicates handles re-analysis safely
- **Gemini Flash** — free tier covers production demo, JSON mode for structured output

## Roadmap

- [x] Phase 1 — Analyzer end-to-end + history + per-company detail
- [ ] Phase 2 — REGON BIR SOAP (awaiting GUS production key)
- [ ] Phase 3 — Financial data (Biznesradar GPW + eKRS RDF private companies)
- [ ] Phase 4 — Smart contact discovery (Google → real LinkedIn profiles, not search URLs)
- [ ] **Phase 5 — Radar: daily news scanning + signal detection + morning brief**
- [ ] Phase 6 — Industry discovery (search by PKD/region)

---

*Portfolio piece demonstrating AI Builder workflow — leveraging Claude Opus 4.7 to deliver production-grade AI systems.*