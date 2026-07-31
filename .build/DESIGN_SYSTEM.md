# Parth Sethi — Portfolio Design System (SHARED — DO NOT DEVIATE)

Aesthetic: **Modern Dark + Neon**. Senior FAANG-level SWE portfolio. Confident, high-tech, clean.

## Tech constraints
- Single self-contained `portfolio.html`. **Tailwind via CDN** (`https://cdn.tailwindcss.com`) + a small custom `<style>` block for tokens/keyframes.
- Vanilla JS only (no framework build). Optional: `particles.js` is already vendored in `js/` if useful, but prefer lightweight CSS/canvas.
- Must work offline-ish (CDN allowed), deploy instantly on GitHub Pages, no build step.
- Each agent writes ONE fragment file into `.build/sections/<name>.html` containing ONLY that section's markup (a `<section>...</section>`) plus any section-specific `<style>`/`<script>` it needs, clearly commented. The assembler merges them.

## Color tokens (CSS variables — assembler puts these in :root)
```
--bg:          #0a0e1a;   /* near-black navy base */
--bg-elev:     #111726;   /* elevated cards */
--bg-elev-2:   #161d30;   /* hover / nested */
--border:      #1f2a44;   /* subtle borders */
--text:        #e6edf7;   /* primary text */
--text-dim:    #9fb0cc;   /* secondary text */
--text-faint:  #5f708c;   /* faint labels */
--accent:      #22d3ee;   /* cyan — primary neon */
--accent-2:    #a78bfa;   /* violet — secondary neon */
--accent-3:    #34d399;   /* emerald — success/metrics */
--glow-cyan:   0 0 24px rgba(34,211,238,.45);
--glow-violet: 0 0 24px rgba(167,139,250,.40);
```
Gradient accent: `linear-gradient(135deg,#22d3ee 0%,#a78bfa 100%)`.

## Typography
- Font: Inter (Google Fonts) for body/UI; `JetBrains Mono` for code/metrics/labels.
- Headings: bold, tight tracking (`letter-spacing:-0.02em`). Hero name ~clamp(2.5rem,7vw,5.5rem).
- Body: `--text-dim`, line-height 1.6.

## Motion
- Subtle. Fade-up on scroll (IntersectionObserver, stagger 60ms). Hover: lift + glow.
- Respect `@media (prefers-reduced-motion: reduce)` — disable transforms/animations.
- Accent underlines/borders animate in with gradient.

## Spacing & layout
- Max content width 1100px, centered, generous padding (px-6 md:px-8).
- Section vertical rhythm: py-24. Section eyebrow label in mono, uppercase, cyan, letter-spaced.
- Cards: bg --bg-elev, 1px --border, rounded-2xl, hover border→accent + soft glow.

## Accessibility (MANDATORY)
- Contrast ≥ 4.5:1 for body text on bg. Focus-visible outlines (accent, 2px).
- Semantic HTML (section, h1-h3, nav, ul/li). Alt text. aria-labels on icon-only controls.
- Fully keyboard navigable. Reduced-motion honored.

## Responsive
- Mobile-first. Breakpoints: base / sm 640 / md 768 / lg 1024.
- Timeline collapses to single column on mobile. Skills grid reflows. No horizontal scroll.

## Section eyebrow pattern (use consistently)
```html
<p class="eyebrow"><span>01</span> Section Name</p>
```
Numbered 01..04 in order: Hero(no number), Experience(01), Skills(02), Projects(03).

## RESUME CONTENT (source of truth — use verbatim facts)

### Identity
Parth Sethi ("Seth") · Software Development Engineer (SMTS) @ Salesforce
Email: sethiparth.ps@gmail.com · Phone: +1 (352) 745 9455
GitHub: https://github.com/sethiparth · Site: https://sethiparth.github.io

### Headline impact metrics (for Hero stats)
- $1B+ annual revenue enabled (email channel via Sage engine)
- 10M → 40M emails/hour (10x throughput)
- 98% → 99.999% availability (five nines)
- 556,000+ EC2 customers protected (reboot-on-degrade)
- Delivered 2 releases ahead of schedule

### Experience
**Salesforce — SDE (SMTS), May 2022–Present**
- *OMM Handlebars Engine Architecture (Lead):* Extreme ownership of the "Sage" rendering service; architected a high-performance scripting engine from scratch to replace the legacy E360 platform. Designed a two-step gRPC API and generic helper framework for the critical email channel (>$1B annual revenue), enabling high-scale B2C marketing and delivering critical functionality two releases ahead of schedule.
- *Legacy Migration & Functional Parity:* Partnered with Product to design/implement 40+ scripting helpers ensuring 100% functional parity with legacy systems. Built a custom automated Compatibility Testing Framework as a source of truth that de-risked the migration.
- *Email Service Load Optimization:* Increased throughput from 10M → 40M emails/hour by optimizing AWS DynamoDB batch loads, introducing Redis for deduplication, and streamlining intermediate step execution. Led team to a 10x improvement.
- *Email Service Availability:* Architected a validation framework raising availability from 98% → 99.999%. Reduced PagerDuty alerts by 10+/week; streamlined future bug fixes to minor code changes.
- *Email Bulk Entitlements Optimization:* Overhauled email processing from one-at-a-time to bulk operations with a real-time entitlement system; enabled partial sends based on quotas, reduced system load, improved resilience.

**Amazon Web Services (AWS), Seattle WA — SDE, Oct 2019–May 2022**
- *Reboot Migration on Degrade:* Rearchitected customer maintenance service enabling EC2 to send 'reboot' instance events across 25 public regions on degraded hardware, protecting 556,000+ EC2 customers' instance data.
- *Scheduler Service:* Redesigned scheduling for all EC2 maintenance events using a best-fit approach to pick future time slots; removed manual daily scripts and cut "no time slot" errors by 100s every two weeks.
- *Self-Maintenance:* Automated manual escalations for maintenance on internal EC2 instances, reducing 4,000 manual escalations and hundreds of developer hours/year.
- *Event Windows:* Designed scheduling algorithm honoring customer-chosen time windows; enabled 10,000+ customers to choose maintenance windows.

**OM Partners, Atlanta GA — Software Engineer, Feb 2019–Oct 2019**
- Designed a scheduling algorithm distributing tasks over time buckets based on user input while optimizing work-execution rate.
- Implemented optimization strategies in C++17 for "OPAL," a custom supply-chain inventory/logistics language.

### Skills
- Languages: [proficient] Java, C++, SQL, NoSQL · [familiar] Scala, Python, Ruby
- Tools & Processes: Agile, Kanban, Git
- AWS stack: DynamoDB, Redshift, RDS, S3, Lambda, Kinesis, QuickSight, EC2, CloudWatch, CloudFormation, IAM, KMS, SNS, SQS

### Education
- M.S. Computer Science — University of Florida, Gainesville FL (Aug 2017–Dec 2018), GPA 3.56/4
- B.Tech Electronics & Communication — Jaypee University of Information & Technology, Solan, India (Aug 2013–May 2017), GPA 9.1/10

### Featured projects / case studies (for Projects section)
1. **Sage Rendering Engine** — from-scratch high-performance Handlebars scripting engine replacing E360; two-step gRPC API, 40+ helpers, powers >$1B email channel. Tags: Java, gRPC, Architecture, Lead.
2. **Email Service 10x Throughput** — 10M→40M emails/hr via DynamoDB batch tuning + Redis dedup. Tags: AWS, DynamoDB, Redis, Performance.
3. **Five-Nines Availability Framework** — validator framework 98%→99.999%, −10 PagerDuty alerts/wk. Tags: Reliability, Validation, On-call.
4. **EC2 Reboot-on-Degrade** — maintenance service across 25 regions protecting 556K+ customers. Tags: AWS, EC2, Distributed Systems.
