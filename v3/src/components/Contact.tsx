import { useState, type MouseEvent } from 'react'
import { Phone, Mail, Link, GitBranch, FileText } from 'lucide-react'
import { CONTACT } from '../data/content'
import { Reveal } from './Reveal'

const NAMED_LINKS = [
  { label: 'LinkedIn', href: CONTACT.linkedin, icon: Link },
  { label: 'GitHub', href: CONTACT.github, icon: GitBranch },
  { label: 'Résumé (PDF)', href: CONTACT.resume, icon: FileText },
]

const PILL =
  'group inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white/85 transition-colors hover:border-accent/60 hover:bg-accent/10 hover:text-white'

/* Email and phone show an icon plus their short label ("Email" / "Phone"). The
   first click reveals the actual value in place (and copies it to the clipboard);
   once revealed, a second click follows the mailto:/tel: link as usual. Keeps the
   raw address/number tidy until the visitor asks for it. */
function IconReveal({
  icon: Icon,
  value,
  href,
  label,
}: {
  icon: typeof Mail
  value: string
  href: string
  label: string
}) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  const handle = async (e: MouseEvent<HTMLAnchorElement>) => {
    if (revealed) return // already shown — let the link do its thing
    e.preventDefault()
    setRevealed(true)
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard blocked — the value is now visible for manual copy.
    }
  }

  return (
    <a href={href} onClick={handle} aria-label={label} title={label} className={PILL}>
      <Icon size={17} className="text-white/60 transition-colors group-hover:text-accent" />
      {revealed ? (
        <span className="tabular-nums">
          {value}
          {copied && <span className="ml-2 text-accent">copied</span>}
        </span>
      ) : (
        <span>{label}</span>
      )}
    </a>
  )
}

export function Contact() {
  return (
    <section id="contact" className="section-shell pb-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* Contact */}
        <Reveal>
          <p className="label-mono text-accent">05 — Contact</p>
          <h2 className="section-title mt-3">{CONTACT.headline}</h2>
          <p className="mt-4 max-w-xl text-white/60">{CONTACT.subhead}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <IconReveal icon={Mail} value={CONTACT.email} href={`mailto:${CONTACT.email}`} label="Email" />
            <IconReveal icon={Phone} value={CONTACT.phoneDisplay} href={`tel:${CONTACT.phone}`} label="Phone" />
            {NAMED_LINKS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={PILL}
              >
                <Icon size={17} className="text-white/60 transition-colors group-hover:text-accent" />
                {label}
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default Contact
