# Research Findings: Portfolio Optimization for AI/ATS Screening + Human Recruiters

Research date: 2026-07-30. Sources: Jobscan, Indeed career advice, schema.org, Google Search Central docs, OGP.me, web.dev, MDPI (Resume2Vec paper), arXiv (LLM hiring papers), industry blogs on senior/staff engineer positioning.

---

## 1. What ATS / AI screeners parse and rank on

**Legacy keyword-based ATS (still ~majority of enterprise systems):**
- Scan for exact/near-exact keyword matches against the job description (skills, tools, titles).
- Require **standard section headings** ("Experience," "Skills," "Education") to correctly bucket content — nonstandard or creative headings can cause parsing failures.
- **Cannot reliably read:** tables, multi-column layouts, text embedded in images/graphics/headers/footers, icons-as-content. Content inside these gets scattered, mis-ordered, or dropped entirely.
- Prefer plain semantic text flow — one column, standard headings, no critical info in decorative elements.
- Penalize resumes/pages that rely on graphics or photos to convey information (not accessibility images, but content-bearing images).

**Modern AI/semantic screeners (Eightfold, LinkedIn Recruiter AI, HireVue, custom LLM pipelines — increasingly common in 2025-2026):**
- Convert resume/profile text into **vector embeddings** (BERT/RoBERTa/Sentence-BERT style) and rank by **cosine similarity** to the job description embedding — this is *semantic* matching, not literal string matching. A candidate who writes "reduced P99 latency" can match "performance optimization" even without the exact phrase — but explicit terms still help precision.
- Because these systems ingest **raw crawlable text**, anything that is only in an image, canvas animation, or JS-rendered-without-fallback is invisible to them unless the crawler executes JS.
- LLM-based hiring pipelines (RAG-enhanced) also incorporate **external context** — they will follow links (GitHub, LinkedIn) and cross-reference claims, so consistency across resume/portfolio/LinkedIn matters.
- Structured data (JSON-LD, meta tags) is not typically consumed by resume-matching models directly, but **is** consumed by Google/Bing crawlers and by recruiter tools that scrape via search engines — this is where a portfolio site gets *discovered* in the first place.

**What makes a site "AI-legible":**
- All key facts (name, title, company, dates, metrics, tech stack) exist as **plain, crawlable HTML text** — not only inside `<canvas>`, SVG-as-image, or JS-only rendered widgets without a text fallback.
- Semantic HTML (`<header>`, `<nav>`, `<main>`, `<section>`, proper `h1`-`h3` hierarchy) — gives both crawlers and AI parsers structural signal about what's a title vs. body vs. nav.
- A single dense, keyword-rich but human-readable page beats a flashy JS-heavy SPA with client-side-only rendering.
- `role`/ARIA landmarks and correct heading nesting double as both accessibility and machine-legibility signals.

## 2. What human recruiters/hiring managers scan for in ~6–10 seconds

Consistent across all sources (eye-tracking studies, recruiter-advice blogs):
- **First fixation points:** name, current job title, most recent company + tenure, formatting clarity.
- Recruiters follow a predictable scan pattern (top-down, left-aligned) — bold headings and bullet points guide the eye; dense paragraphs get skipped.
- They are hunting for: **seniority signal** (title, years, scope of company), **recency** (what are you doing *now*), and **one or two standout numbers** that anchor credibility.
- A "wall of text" or generic mission-statement-style intro burns the 6-second window with zero signal — the hero/top section must front-load title + impact, not personality copy.
- For engineers specifically: company name recognition (Salesforce, AWS) + quantified scale ("$1B revenue," "556K customers," "10x throughput") registers faster than prose descriptions of responsibilities.

## 3. Elevating "mid" to "senior/staff" in portfolio presentation

Cross-referencing senior/staff-specific portfolio guides and leveling advice:
- **Ownership language > task language.** "Architected," "led," "drove," "owned end-to-end" outperforms "worked on," "helped with," "responsible for." Passive/team-diffused phrasing reads as mid-level even when the work was senior.
- **Quantify impact, not just activity.** Senior portfolios lead with *business/system outcome* (revenue enabled, latency reduced, incidents prevented, people/teams affected) rather than a feature list. Every project should answer: so what happened because of this?
- **Show scope and blast radius**, not just LOC or repo count: how many customers/regions/teams/services were affected. ("25 public regions," "556,000+ EC2 customers," ">$1B annual revenue" are exactly this kind of signal — use them prominently.)
- **System design over code snippets.** Senior/staff portfolios show architecture diagrams, tradeoff reasoning, and "why," not raw code dumps — junior portfolios show code, senior portfolios show judgment.
- **Cross-team/organizational leadership signals**: "partnered with Product," "led team to 10x improvement," "de-risked the migration" — these phrases explicitly claim influence beyond one's own IC keyboard time and should be preserved/emphasized, not buried in sub-bullets.
- **Fewer, deeper case studies beat many shallow ones.** 3–4 flagship projects with full context (problem → approach → architecture → outcome) outperform a long list of minor projects.
- **Depth signal:** staff-level portfolios often include one section on a technical decision/tradeoff you made and why — this is the single strongest differentiator vs. senior.

## 4. SEO / discoverability essentials

- **Title tag:** unique, front-loaded with name + role/keyword. E.g. `Parth Sethi — Senior Software Engineer (Salesforce, ex-AWS)`. Currently the site's `<title>` is just `Parth Sethi` — weak.
- **Meta description:** ~150–160 characters, front-load value prop + primary keywords, written for humans (shows in search snippets/social previews) — currently empty (`content=""`).
- **Open Graph tags (required 4):** `og:title`, `og:type` (`profile` fits a personal site better than `website`), `og:image` (1200×630, absolute URL), `og:url`. Recommended: `og:description`, `og:site_name`, `og:locale`. Currently all empty in `index.html`.
- **Twitter Card tags:** `twitter:card` (use `summary_large_image`), `twitter:title`, `twitter:description`, `twitter:image`. Currently empty.
- **JSON-LD `Person` schema** in a `<script type="application/ld+json">` block in `<head>` — this is what lets Google show a Knowledge-Panel-style entity and is the most direct "structured data for AI legibility" lever available. Key properties: `name`, `jobTitle`, `worksFor`, `alumniOf`, `url`, `sameAs` (LinkedIn/GitHub), `image`, `description`, `knowsAbout` (skills array). None currently present in the codebase (confirmed by search — no `ld+json` found in `index.html`, `about.html`, `projects.html`, `skills.html`).
- **Semantic HTML** — proper landmark elements and one `<h1>` per page, logical `h2`/`h3` nesting for sections — helps both SEO crawlers and AI text-extraction pipelines.
- **`lang` attribute** on `<html>`, canonical `<link rel="canonical">` per page, and a `favicon`/`apple-touch-icon` (favicon already referenced, good).
- **Sitemap.xml + robots.txt** — not required for a 4-page static site but trivial to add and helps crawl completeness.

## 5. Common mistakes that hurt senior candidates' portfolios

- Generic "passionate developer" / mission-statement hero copy that wastes the 6-second scan window with zero seniority or impact signal.
- Task-list bullet points ("worked on X," "responsible for Y") instead of outcome-owning language — reads as mid-level regardless of actual seniority.
- No quantification — activities without numbers (%, $, scale, count) are unranked signal to both humans and AI semantic matchers.
- Content-critical information trapped in images, animated canvases, or JS-only widgets with no text fallback — invisible to ATS/AI parsers and bad for SEO.
- Missing/empty meta tags and structured data — makes the site nearly invisible to search and social sharing (exactly the current state of this site).
- Too many shallow projects instead of 3–4 deep case studies with problem→approach→architecture→outcome structure.
- No architecture/system-design artifacts — an all-code portfolio signals IC/junior; senior/staff portfolios show design judgment and tradeoffs.
- Inconsistent facts/claims between resume, LinkedIn, and portfolio — increasingly checked by RAG-based AI hiring pipelines that cross-reference sources.
- Overly decorative/animation-heavy design that buries the actual content signal (relevant given this site's "Modern Dark + Neon" design system — motion must stay subtle per the existing DESIGN_SYSTEM.md, which already correctly specifies `prefers-reduced-motion` handling).

## 6. Concrete must-have elements & ideal information hierarchy

**Above the fold / Hero:**
1. Name + current title + company (e.g., "Parth Sethi — Senior Software Engineer (SMTS) @ Salesforce, ex-AWS")
2. One-line positioning statement with a keyword-rich but human phrase (not generic "I build things")
3. 3–5 headline impact metrics as visual stat chips (this site's DESIGN_SYSTEM.md already plans this — good, make sure the numbers are in real text, not canvas/image)
4. Primary CTA (resume PDF, contact/email, LinkedIn, GitHub)

**Section order (matches what's already planned in `.build/sections/`):**
1. Experience — reverse chronological, each role: company/title/dates header, then 3–5 ownership-language + quantified bullets
2. Skills — grouped by category, avoid raw unstructured tag soup; group semantically (languages, cloud infra, tools) so both humans and embedding-based matchers get coherent phrase chunks
3. Projects — 3–4 deep case studies: Problem → Approach/Architecture → Outcome (quantified) → Tags/stack
4. Contact/footer — email, LinkedIn, GitHub, resume download link, all as real anchor text (not icon-only without aria-label)

**Meta/technical layer (invisible but critical):**
- Title tag, meta description, OG tags, Twitter Card tags, JSON-LD Person schema, semantic landmarks, canonical link, lang attribute — all currently missing/empty and should be added to `index.html` `<head>` (and ideally `about.html`, `projects.html`, `skills.html` too).

---

## APPLY THIS — Directly actionable checklist

### A. Meta tags for `index.html` `<head>` (replace the empty placeholders at lines ~8-21)

```html
<title>Parth Sethi — Senior Software Engineer | Salesforce, ex-AWS</title>
<meta name="description" content="Parth Sethi is a Senior Software Engineer (SMTS) at Salesforce and ex-AWS SDE. Architected systems powering $1B+ annual revenue, 10x email throughput, and five-nines availability. Java, gRPC, AWS, distributed systems." />
<meta name="keywords" content="Parth Sethi, Senior Software Engineer, Staff Engineer, Salesforce, AWS, Software Development Engineer, Java, gRPC, distributed systems, DynamoDB, backend engineer" />
<meta name="author" content="Parth Sethi" />
<link rel="canonical" href="https://sethiparth.github.io/" />
<html lang="en">

<!-- Open Graph -->
<meta property="og:type" content="profile" />
<meta property="og:title" content="Parth Sethi — Senior Software Engineer | Salesforce, ex-AWS" />
<meta property="og:description" content="Senior Software Engineer at Salesforce, ex-AWS. Architected systems powering $1B+ revenue, 10x throughput gains, and five-nines availability." />
<meta property="og:image" content="https://sethiparth.github.io/images/og-preview.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Parth Sethi — Senior Software Engineer" />
<meta property="og:url" content="https://sethiparth.github.io/" />
<meta property="og:site_name" content="Parth Sethi" />
<meta property="og:locale" content="en_US" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Parth Sethi — Senior Software Engineer" />
<meta name="twitter:description" content="Senior Software Engineer at Salesforce, ex-AWS. $1B+ revenue systems, 10x throughput, five-nines availability." />
<meta name="twitter:image" content="https://sethiparth.github.io/images/og-preview.jpg" />
```
Note: an `images/og-preview.jpg` (1200×630) needs to be created/exported — none exists yet.

### B. JSON-LD Person schema (paste into `<head>`, ready to use with real data from DESIGN_SYSTEM.md)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Parth Sethi",
  "alternateName": "Seth",
  "jobTitle": "Senior Software Engineer (SMTS)",
  "url": "https://sethiparth.github.io/",
  "image": "https://sethiparth.github.io/images/profile.jpg",
  "email": "mailto:sethiparth.ps@gmail.com",
  "sameAs": [
    "https://github.com/sethiparth",
    "https://www.linkedin.com/in/YOUR-LINKEDIN-HANDLE"
  ],
  "worksFor": {
    "@type": "Organization",
    "name": "Salesforce"
  },
  "alumniOf": [
    {
      "@type": "CollegeOrUniversity",
      "name": "University of Florida"
    },
    {
      "@type": "CollegeOrUniversity",
      "name": "Jaypee University of Information & Technology"
    }
  ],
  "description": "Senior Software Engineer (SMTS) at Salesforce and ex-AWS SDE. Architected high-performance distributed systems powering $1B+ in annual revenue, 10x throughput improvements, and five-nines availability.",
  "knowsAbout": [
    "Java", "C++", "SQL", "NoSQL", "gRPC", "Distributed Systems",
    "AWS DynamoDB", "AWS Lambda", "AWS EC2", "System Architecture",
    "Performance Optimization", "High Availability Systems"
  ]
}
</script>
```
Fill in the real LinkedIn URL and a real `profile.jpg` path before shipping.

### C. Semantic HTML / structure fixes
- Ensure exactly one `<h1>` per page (should be the name in Hero), then `<h2>` for each major section (Experience, Skills, Projects), `<h3>` for sub-items (each job/project title).
- Wrap the top nav in `<nav aria-label="Primary">`, main content in `<main>`, and ensure the existing `<section>` fragments in `.build/sections/*.html` each carry one clear heading level.
- Add `aria-label` to any icon-only links (GitHub/LinkedIn/email icons) — required for both accessibility and AI-legibility scoring.
- Add `<html lang="en">` (currently missing).

### D. Keyword strategy for body copy (semantic + literal, for both legacy ATS and embedding-based matchers)
- Ensure these literal terms appear as real text somewhere on the page (not just in tags): "Senior Software Engineer", "Staff Engineer" (aspirational target keyword even if current title is SMTS — recruiters and AI search for the level they're hiring, so use both current title and level-appropriate synonyms in body copy, e.g. "operating at senior/staff scope"), "distributed systems", "system architecture", "AWS", "Java", "gRPC", "high availability", "scalability", "performance optimization".
- Use exact numbers as plain text (not inside canvas/SVG): "$1B+", "10x", "99.999%", "556,000+", "25 regions" — these are exactly the kind of scale signals that both 6-second human scanners and AI ranking systems latch onto.
- Group skills semantically in the Skills section (e.g., "Backend & Distributed Systems: Java, gRPC, ...", "Cloud/AWS: DynamoDB, Lambda, ...") rather than a flat tag cloud — semantic grouping helps embedding models capture coherent skill clusters.

### E. Content/structure fixes (from DESIGN_SYSTEM.md content already drafted)
- Rewrite any remaining task-language bullets to lead with ownership verbs: "Architected," "Led," "Drove," "Designed," "Owned" — the current resume content in DESIGN_SYSTEM.md already does this well (e.g., "Architected a validation framework raising availability from 98% → 99.999%") — preserve this pattern across all sections and don't let it regress to passive phrasing during implementation.
- Hero section must front-load title + 3-5 stat metrics as real text within the first viewport — confirm the `01-hero.html` fragment renders these as actual DOM text nodes, not canvas-drawn or image-based numbers.
- Add one "System Design / Architecture" artifact (diagram or written tradeoff discussion) to at least the flagship "Sage Rendering Engine" project case study — this is the single highest-leverage addition to signal staff-level scope beyond what's already planned.
- Create `og-preview.jpg` (1200x630) and a `profile.jpg` for the JSON-LD `image` field — currently absent from `images/`.

### F. Robots/sitemap (low effort, add before launch)
- Add a minimal `robots.txt` (`User-agent: *\nAllow: /`) and `sitemap.xml` listing `index.html`, `about.html`, `projects.html`, `skills.html` at the repo root for crawl completeness.
