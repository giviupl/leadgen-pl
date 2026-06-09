# LeadGen — AI Lead Intelligence dla polskiego B2B

> System wykrywania sygnałów zakupowych i kwalifikacji leadów dla polskiego rynku B2B. Codzienny radar newsów + analiza firm po NIP + wyszukiwanie decydentów. Sygnał zakupowy → kwalifikacja firmy → kontakty — w jednym pipeline.

[Live Demo](https://leadgen-pl.vercel.app/) · [GitHub](https://github.com/giviupl/leadgen-pl)


---

## Idea projektu

LeadGen automatyzuje to co w typowym dziale sprzedaży B2B robi się ręcznie: śledzenie newsów, weryfikacja firm w rejestrach, szukanie decydentów na LinkedIn.

Codziennie rano system skanuje polskie portale biznesowe i komunikaty regulacyjne GPW, AI wyciąga konkretne sygnały zakupowe (nowe kontrakty, ekspansja, IPO, fuzje), scoring 1-10 określa wartość leada. Z poziomu UI sprzedawca może jednym NIP-em pobrać pełną analizę firmy z BIR/VIES + AI rekomendację i wygenerować listę decydentów do kontaktu.

---

## Jak to działa

System składa się z trzech niezależnych flow w n8n, podpiętych pod aplikację Next.js. Każdy flow ma osobny webhook i można go uruchomić niezależnie.

### Flow 1 — Radar (codzienny)

```
Schedule 7:00 (codzienny cron, uruchamia workflow rano)
  → 3× RSS (pobranie najnowszych artykułów z Bankier ESPI, Bankier News, Puls Biznesu)
  → Merge + Dedup (połączenie wyników z 3 źródeł i odsianie artykułów które już były w bazie z ostatnich 14 dni — porównanie po skróconym hashu URL)
  → Filtr daty (tylko artykuły z ostatnich 48h, odsiewa stare wpisy które feed czasem podaje powtórnie)
  → Gemini 2.5 Flash (AI czyta tytuł + lead artykułu, wyciąga nazwę firmy, typ sygnału i ocenia wartość 1-10)
  → Supabase (zapis sygnału do tabeli radar_leads — firma, typ sygnału, score, link do źródła)
  → wyświetlenie na stronie głównej (lista pogrupowana po dacie, posortowana po score)
```

### Flow 2 — Analyzer (na żądanie)

```
NIP (wpisany przez użytkownika w formularzu)
  → Cache check (sprawdzenie czy firma była już analizowana w ostatnich 30 dniach — jeśli tak, zwracamy gotowy raport)
  → BIR REGON SOAP (pobranie oficjalnych danych firmy z rejestru GUS: nazwa, adres, PKD, kapitał, zarząd)
  → VIES (weryfikacja czy firma ma aktywny VAT EU)
  → Gemini (analiza branży, oszacowanie budżetu marketingowego i giftingowego, scoring 1-10, rekomendacje konkretnych okazji do giftingu, elevator pitch dla sprzedawcy)
  → Supabase (zapis: dane firmy w tabeli companies, raport AI w tabeli company_ai_reports)
  → karta firmy /firma/[nip] (pełna analiza z scoringiem, kontekstem branżowym i rekomendacjami)
```

### Flow 3 — Find Contacts (na żądanie)

```
NIP firmy (uruchomiane z karty firmy po wcześniejszej analizie)
  → Cache check (jeśli kontakty były szukane w ostatnich 30 dniach — zwracamy z bazy)
  → Lista ról decydentów (system generuje listę stanowisk istotnych dla giftingu: HR Director, Marketing Director, Office Manager, CEO etc.)
  → Serper.dev (Google API — odpytanie wyszukiwarki o `site:linkedin.com/in "rola" "firma"`, zwraca publiczne profile LinkedIn)
  → Gemini Cleanup (AI weryfikuje czy osoba nadal pracuje w firmie, usuwa duplikaty, ocenia pewność dopasowania 0-1)
  → Supabase (zapis listy zweryfikowanych kontaktów do tabeli company_contacts)
```

### Zabezpieczenia

- Rate limiting na Upstash Redis — maksymalnie 10 zapytań z jednego IP dziennie, łącznie 500 dziennie. Chroni przed nadużyciem darmowego limitu Gemini
- Header Auth na webhookach n8n — bez tajnego nagłówka z aplikacji webhook zwraca błąd. Nikt z zewnątrz nie odpali workflow
- Dostęp do bazy tylko z serwera — Next.js Server Components używają service_role key, klient w przeglądarce nigdy nie widzi danych Supabase bezpośrednio
- Retry Gemini API — jeśli Gemini zwróci błąd, n8n próbuje automatycznie do 10 razy co 60 sekund. Większość spike'ów po stronie Google trwa kilka minut
- Bezpieczne ponowne uruchomienia — gdy ten sam NIP wchodzi do bazy drugi raz, system aktualizuje istniejący rekord zamiast tworzyć duplikat (UPSERT po unikalnym NIP-ie)

---

## Stack i decyzje techniczne

| Warstwa | Technologia | Dlaczego |
|---|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind v4 | Znałem już Next.js z budowy [Giviu](https://giviu.pl) — wykorzystałem znajomość App Router, Server Components i Server Actions, dzięki czemu mogłem skupić się na warstwie AI/workflow |
| Workflow automation | n8n (self-hosted na Railway) | Chciałem nauczyć się n8n bo to standard w branży Sales Automation. Visual workflow działa jako dokumentacja, retry i obsługa błędów są wbudowane. Self-hosting na Railway daje pełną kontrolę za $5/miesiąc |
| Baza danych | Supabase (PostgreSQL) | Service role key + Row Level Security, REST API out-of-the-box, free tier wystarcza dla MVP |
| LLM | Gemini 2.5 Flash | Najtańszy model który dobrze radzi sobie z polskim. JSON mode dla strukturalnego outputu. Koszt ~$0.0001/zapytanie w paid tier |
| Search | Serper.dev (Google API) | Tańsze i prostsze niż własny scraping LinkedIn. Akceptowalne ToS dla zapytań typu site:linkedin.com/in |
| Cache i rate limiting | Upstash Redis | Serverless, free tier do 10k zapytań/dzień, integracja z Vercel jednym env varem |
| Hosting | Vercel + Railway | Vercel dla Next.js (edge functions, auto-deploy z GitHuba), Railway dla self-hosted n8n |

---

## Roadmapa

Projekt jest w fazie MVP — działający end-to-end pipeline, ale z jednym rynkiem (Polska), trzema źródłami sygnałów i pojedynczym LLM. Kolejne fazy mają konkretną wartość biznesową, nie są feature creep.

**Faza 2 — Więcej źródeł sygnałów**
- Tier 1: dodanie Wnp.pl (przemysł), MamStartup (rundy finansowania)
- Tier 2 branżowe: Wirtualne Media (sygnały dla Marketing Directors), PulsHR (sygnały dla HR Directors) — dokładnie targety mojej buyer persony
- Tier 3 portale pracy (Pracuj.pl, NoFluffJobs): masowa rekrutacja = ekspansja = sygnał zakupowy. Łapie firmy prywatne których nie ma na giełdzie
- Tier 4 publicznoprawne: UOKiK (decyzje koncentracyjne = wczesny sygnał M&A), Biuletyn Zamówień Publicznych (kto wygrywa duże kontrakty)

**Faza 3 — AI-powered NIP extraction w Radarze**
Obecnie Radar pokazuje sygnał o firmie, ale operator musi sam znaleźć NIP. Faza 3: Gemini wyciąga NIP z artykułu (lub szuka via REGON), workflow od razu uruchamia Analyzer. Pełny pipeline od sygnału do listy kontaktów w jednym kliknięciu.

**Faza 4 — Wzbogacanie danych finansowych**
Biznesradar (spółki GPW) + eKRS RDF (spółki prywatne). Przychody, dynamika YoY, kapitał — pozwala filtrować firmy o realnym budżecie.

**Faza 5 — Drugi tryb wyszukiwarki: Industry Discovery**
Obecnie: NIP → analiza. Faza 5: branża + region → lista firm spełniających kryteria + scoring. Filtr jakości: wykluczenie JDG i mikrofirm, minimum kapitał zakładowy.

**Faza 6 — Observability i eval**
Mierzenie jakości AI, monitoring kosztów i czasów odpowiedzi LLM (Langfuse). Pozwoli iteratywnie ulepszać prompty z konkretnymi liczbami zamiast intuicji.

---

## Świadomie odrzucone decyzje

- **LinkedIn API** — antyscraping, ToS-blocker. Wybrałem Serper z site:linkedin.com/in — wolniejsze, ale legalne
- **OpenAI GPT-4** — 10× droższe od Gemini Flash przy podobnej jakości dla polskiego. Demo musi być tanie
- **Forsal jako źródło RSS** — feed jest w formacie Atom (nie standardowe RSS), parsuje się inaczej, plus 80% contentu to makro/polityka, niskie signal-to-noise. Wyłączyłem po pierwszych testach

---

*Stan: czerwiec 2026. Projekt portfolio do roli AI Builder.*
