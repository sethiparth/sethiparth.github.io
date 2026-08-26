/* Single source of truth for all site copy, lifted verbatim from the v2 site.
   Keeping content as typed data (not JSX) means sections stay presentational
   and the copy can be edited in one place. */

export const IDENTITY = {
  name: 'Parth Sethi',
  role: 'Senior Software Engineer, Salesforce · ex-AWS',
  location: 'Seattle, WA',
  valueProp:
    'I architect and lead high-throughput distributed systems — engines built to scale 10x over and hold five-nines under load.',
} as const

export const CONTACT = {
  email: 'sethiparth.ps@gmail.com',
  phone: '+13527459455',
  phoneDisplay: '+1 (352) 745-9455',
  linkedin: 'https://www.linkedin.com/in/parth-sethi-a24753b7/',
  github: 'https://github.com/sethiparth',
  resume: `${import.meta.env.BASE_URL}sethi_resume.pdf`,
  headline: "Let's talk",
  subhead:
    'Open to conversations about distributed systems, AI infrastructure, and senior backend roles.',
} as const

export interface Role {
  company: string
  title: string
  location: string
  period: string
  bullets: string[]
}

export const EXPERIENCE: Role[] = [
  {
    company: 'Salesforce',
    title: 'Senior Software Engineer (SMTS)',
    location: 'Seattle, WA',
    period: 'May 2022 – Present',
    bullets: [
      'Architected "Sage" from scratch, a two-step gRPC microservices rendering engine replacing the legacy E360 platform. Where the legacy library was a thin, low-level wrapper over Handlebars.js, Sage is a higher-order engine with deep, composable helpers; shipped two releases ahead of schedule.',
      'Owned end-to-end design, development, deployment, and performance testing of the scripting feature for Salesforce Headless 360 — an API-first, agentic communications platform letting customers orchestrate email/SMS sends programmatically with no UI — driving the work across 4 partner teams to a clean, rollback-free launch.',
      'Led and orchestrated the migration of 100% of customers onto Sage with no downtime and no customer action required, reaching 100% functional parity via a custom Compatibility Testing Framework built with Product.',
      'Set the reference architecture now shared across 3 channels (SMS, email, RCS) as one engine — driving the design reviews and standards other teams build against.',
      'Built an agentic automation pipeline (Claude) that replaced a manual ~4-hour-per-org setup — provisioning, test sends, and health checks — reclaiming engineer-weeks each quarter.',
      'Drove a 10x throughput gain, 4M to 40M emails/hour, through DynamoDB batch tuning, Redis caching and deduplication, and quota-aware bulk sends.',
      'Built a pre-deploy validation framework that caught regressions before rollout, sustaining a 99.999% monthly service-availability SLO; on call, cut incident response load and PagerDuty alerts by 10+/week.',
    ],
  },
  {
    company: 'Amazon Web Services',
    title: 'Software Engineer',
    location: 'Seattle, WA',
    period: 'Oct 2019 – May 2022',
    bullets: [
      "Rearchitected the maintenance service to fire reboot events across 25 public regions, protecting 556K+ EC2 customers' instance data on degraded hardware.",
      'Redesigned EC2 maintenance scheduling with a best-fit algorithm, retiring manual scripts and cutting "no time slot" errors by hundreds every two weeks.',
      'Automated maintenance escalations, removing 4,000 escalations and hundreds of engineer-hours a year.',
      'Designed a scheduling algorithm honoring customer-chosen windows, giving 10,000+ customers control of their maintenance schedule.',
    ],
  },
  {
    company: 'OM Partners',
    title: 'Software Engineer',
    location: 'Atlanta, GA',
    period: 'Feb 2019 – Oct 2019',
    bullets: [
      'Designed a scheduling algorithm distributing tasks across time buckets to optimize work-execution rate.',
      'Implemented optimization strategies in C++17 for "OPAL," a custom supply-chain inventory and logistics language.',
    ],
  },
]

export interface Project {
  title: string
  metric: string
  description: string
  tags: string[]
}

export const PROJECTS: Project[] = [
  {
    title: 'Sage Rendering Engine',
    metric: '>$1B channel powered',
    description:
      "Architected a high-performance Handlebars scripting engine from scratch, leading the end-to-end replacement of Salesforce's legacy E360 platform. Designed the two-step gRPC API and a generic helper framework — 40+ helpers reaching 100% functional parity — and set the reference architecture now shared across SMS, email, and RCS. Critical functionality delivered two releases early.",
    tags: ['Java', 'gRPC', 'Architecture', 'Lead'],
  },
  {
    title: 'Email Service 10x Throughput',
    metric: '4M → 40M / hr',
    description:
      'Drove a full redesign of email delivery, taking throughput from 4M to 40M emails per hour by optimizing DynamoDB batch loads and streamlining step execution. Introduced Redis dedup to eliminate redundant sends at scale.',
    tags: ['AWS', 'DynamoDB', 'Redis', 'Performance'],
  },
  {
    title: 'Five-Nines Availability Framework',
    metric: '99.999% SLO',
    description:
      'Architected a pre-deploy validation framework that sustains a 99.999% monthly availability SLO, cut PagerDuty alerts by 10+ per week, and turned future fixes into low-risk changes — the source of truth for on-call reliability.',
    tags: ['Reliability', 'Validation', 'On-call'],
  },
  {
    title: 'EC2 Reboot-on-Degrade',
    metric: '556K+ protected',
    description:
      'Rearchitected the customer maintenance service so EC2 could send reboot events across 25 public regions when hardware degraded, safeguarding instance data for 556,000+ customers. Part of a scheduler overhaul that removed manual daily scripts.',
    tags: ['AWS', 'EC2', 'Distributed Systems'],
  },
  {
    title: 'AI-Orchestrated Org Provisioning & Test Automation',
    metric: '~4 hrs/org automated',
    description:
      'Built an agentic automation pipeline using Claude and AI agents to replace a manual ~4-hour-per-org workflow: provisioning an org, running preview and real sends, and standing up integration and daily health tests. Reclaimed multiple weeks of aggregate team effort.',
    tags: ['Claude', 'AI Agents', 'Automation', 'Test Infra'],
  },
]

export interface Skill {
  name: string
  level: number
  levelLabel: string
}

export const LANGUAGES: Skill[] = [
  { name: 'Java', level: 5, levelLabel: 'Expert' },
  { name: 'C++', level: 4, levelLabel: 'Strong' },
  { name: 'SQL', level: 4, levelLabel: 'Strong' },
  { name: 'NoSQL', level: 4, levelLabel: 'Strong' },
  { name: 'C#', level: 3, levelLabel: 'Working' },
  { name: 'Python', level: 3, levelLabel: 'Working' },
  { name: 'Scala', level: 2, levelLabel: 'Familiar' },
  { name: 'Ruby', level: 2, levelLabel: 'Familiar' },
]

export const AWS_STACK: string[] = [
  'DynamoDB', 'Redshift', 'RDS', 'S3', 'Lambda', 'Kinesis', 'QuickSight',
  'EC2', 'CloudWatch', 'CloudFormation', 'IAM', 'KMS', 'SNS', 'SQS',
]

export const TOOLS: string[] = ['Git', 'Docker', 'Kubernetes', 'Agile', 'Kanban', 'Claude', 'Cursor']

export interface Education {
  degree: string
  school: string
  location: string
  period: string
  detail: string
}

export const EDUCATION: Education[] = [
  {
    degree: 'M.S., Computer Science',
    school: 'University of Florida',
    location: 'Gainesville, FL',
    period: 'Aug 2017 – Dec 2018',
    detail: 'GPA 3.56/4 — traded hardware and signals for distributed systems, the turn that set the rest of the map.',
  },
  {
    degree: 'B.Tech, Electronics & Communication',
    school: 'Jaypee University of Information & Technology',
    location: 'Solan, India',
    period: 'Aug 2013 – May 2017',
    detail: 'GPA 9.1/10.',
  },
]

export const NAV_LINKS = [
  { label: 'Experience', href: '#experience' },
  { label: 'Work', href: '#work' },
  { label: 'Skills', href: '#skills' },
  { label: 'Contact', href: '#contact' },
] as const
