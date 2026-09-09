/* The five career waypoints, present → past, derived from the single source of
   truth in content.ts. Each waypoint carries either a treated logo (white
   knockout PNG in /public/logos) or an Anton wordmark for the two marks the
   repo has no logo for. `metric` is the one signature stat that rides the
   monolith; `lines` are the dossier bullets (trimmed to keep the panel tight). */
import { EDUCATION, EXPERIENCE } from '../../data/content'

export interface Waypoint {
  id: string
  kind: 'work' | 'edu'
  name: string
  role: string           // job title or degree
  period: string
  location: string
  metric: string         // signature stat on the monolith
  logo?: string          // treated white-knockout asset in /logos
  wordmark?: string      // fallback display text when there is no logo
  lines: string[]        // dossier detail bullets
}

const LOGO = (file: string) => `${import.meta.env.BASE_URL}logos/${file}`

// Map the typed content into waypoints. Order is reverse-chronological so the
// journey opens on the most recent, most relevant chapter and walks backward
// through time — the "walking through my career" narrative, theme-matched.
const [salesforce, aws, om] = EXPERIENCE
const [uf, jaypee] = EDUCATION

export const WAYPOINTS: Waypoint[] = [
  {
    id: 'salesforce',
    kind: 'work',
    name: salesforce.company,
    role: salesforce.title,
    period: salesforce.period,
    location: salesforce.location,
    metric: '10× · 4M→40M/hr',
    logo: LOGO('salesforce.png'),
    lines: [
      'Architected **"Sage"** from scratch — a two-step **gRPC** rendering engine replacing the legacy E360 platform, with **40+ composable helpers** at 100% parity; shipped **two releases early**.',
      'Led a **zero-downtime** migration of **100% of customers** onto Sage — no customer action required — via a custom Compatibility Testing Framework.',
      'Drove a **10× throughput gain** (**4M → 40M emails/hour**) via DynamoDB batch tuning, Redis caching & dedup, and quota-aware bulk sends.',
      'Owned end-to-end the scripting feature for **Headless 360** — an API-first, agentic comms platform — driving **4 partner teams** to a rollback-free launch.',
    ],
  },
  {
    id: 'aws',
    kind: 'work',
    name: aws.company,
    role: aws.title,
    period: aws.period,
    location: aws.location,
    metric: '556K+ protected',
    logo: LOGO('aws.png'),
    lines: [
      "Rearchitected the maintenance service to fire reboot events across **25 public regions**, protecting **556K+ EC2 customers'** data on degraded hardware.",
      'Redesigned EC2 maintenance scheduling with a **best-fit algorithm**, retiring manual scripts and cutting "no time slot" errors by **hundreds per fortnight**.',
      'Automated escalations — removing **4,000 a year** — and gave **10,000+ customers** control of their own maintenance windows.',
    ],
  },
  {
    id: 'om',
    kind: 'work',
    name: om.company,
    role: om.title,
    period: om.period,
    location: om.location,
    metric: 'C++17 · OPAL',
    wordmark: 'OM\nPARTNERS',
    lines: [
      'Designed a **scheduling algorithm** distributing tasks across time buckets to optimize work-execution rate.',
      'Implemented optimization strategies in **C++17** for **"OPAL,"** a custom supply-chain inventory and logistics language.',
    ],
  },
  {
    id: 'uf',
    kind: 'edu',
    name: uf.school,
    role: uf.degree,
    period: uf.period,
    location: uf.location,
    metric: 'M.S. · GPA 3.56',
    logo: LOGO('uf.png'),
    lines: [uf.detail],
  },
  {
    id: 'jaypee',
    kind: 'edu',
    name: jaypee.school,
    role: jaypee.degree,
    period: jaypee.period,
    location: jaypee.location,
    metric: 'B.Tech · GPA 9.1',
    wordmark: 'JAYPEE',
    lines: [jaypee.detail],
  },
]
