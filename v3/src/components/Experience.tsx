import { EDUCATION, EXPERIENCE } from '../data/content'
import { Reveal } from './Reveal'

const pad = (n: number) => String(n).padStart(2, '0')

export function Experience() {
  return (
    <section id="experience" className="section-shell">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="label-mono text-accent">02 — Experience</p>
          <h2 className="section-title mt-3">Five chapters, one throughline: systems that hold under load.</h2>
        </Reveal>

        {/* One chapter per screen: oversized company name anchors each role,
            a faded numeral echoes behind it, bullets read as a tight column. */}
        <div className="mt-20 space-y-24 md:space-y-32">
          {EXPERIENCE.map((role, i) => (
            <Reveal key={role.company} delay={i * 0.05}>
              <article className="exp-chapter">
                <span aria-hidden="true" className="exp-ghost pointer-events-none absolute right-0 top-0 -z-0 hidden select-none lg:block">
                  {pad(i + 1)}
                </span>

                <div className="relative z-10">
                  <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                    <span className="label-mono text-accent">{pad(i + 1)}</span>
                    <span className="label-mono text-white/45">{role.period}</span>
                    <span className="label-mono text-white/30">{role.location}</span>
                  </div>

                  <h3 className="exp-display mt-4 text-white">{role.company}</h3>
                  <p className="mt-3 text-lg text-white/70">{role.title}</p>

                  <ul className="mt-8 max-w-2xl space-y-4 border-l border-white/10 pl-6">
                    {role.bullets.map((b, j) => (
                      <li key={j} className="text-[15px] leading-relaxed text-white/75">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}

          {EDUCATION.map((ed, i) => (
            <Reveal key={ed.school} delay={(EXPERIENCE.length + i) * 0.05}>
              <article className="exp-chapter">
                <span aria-hidden="true" className="exp-ghost pointer-events-none absolute right-0 top-0 -z-0 hidden select-none lg:block">
                  {pad(EXPERIENCE.length + i + 1)}
                </span>

                <div className="relative z-10">
                  <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                    <span className="label-mono text-accent">{i === 0 ? 'Education' : pad(EXPERIENCE.length + i + 1)}</span>
                    <span className="label-mono text-white/45">{ed.period}</span>
                    <span className="label-mono text-white/30">{ed.location}</span>
                  </div>

                  <h3 className="exp-display mt-4 text-white">{ed.school}</h3>
                  <p className="mt-3 text-lg text-white/70">{ed.degree}</p>

                  <ul className="mt-8 max-w-2xl space-y-4 border-l border-white/10 pl-6">
                    <li className="text-[15px] leading-relaxed text-white/75">{ed.detail}</li>
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Experience
