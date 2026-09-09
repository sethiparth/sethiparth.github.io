import { motion } from 'motion/react'
import { LANGUAGES, AWS_STACK, TOOLS } from '../data/content'
import { Reveal, staggerContainer, staggerItem } from './Reveal'
import { SkillsBackground } from '../skills/SkillsBackground'

function Chips({ items }: { items: string[] }) {
  return (
    <motion.ul
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className="flex flex-wrap gap-2"
    >
      {items.map((item) => (
        <motion.li
          key={item}
          variants={staggerItem}
          className="label-mono rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-white/70"
        >
          {item}
        </motion.li>
      ))}
    </motion.ul>
  )
}

export function Skills() {
  return (
    <section id="skills" className="skills-shell section-shell relative isolate overflow-hidden">
      {/* Smoke stack: warm tint + WebGL flow field + hero-echo grid, all wrapped
          in one mask that feathers the top/bottom edges so the haze leaks into
          the page as a single uniform cloud (no hard band). */}
      <div className="skills-atmosphere pointer-events-none absolute inset-0 -z-0" aria-hidden="true">
        <div className="skills-tint absolute inset-0" />
        <SkillsBackground />
        <div className="skills-grid absolute inset-0" />
      </div>
      {/* Legibility scrim (stays crisp — helps text contrast in the middle). */}
      <div className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-b from-transparent via-[#08080b]/25 to-transparent" />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="label-mono text-accent">04 — Skills</p>
          <h2 className="section-title mt-3">The stack behind the systems.</h2>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Languages with skill meters */}
          <Reveal className="glass-panel">
            <h3 className="label-mono text-white/50">Languages</h3>
            <ul className="mt-5 space-y-4">
              {LANGUAGES.map((lang) => (
                <li key={lang.name}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[15px] font-medium text-white/85">{lang.name}</span>
                    <span className="label-mono text-white/40">{lang.levelLabel}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-accent/50"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(lang.level / 5) * 100}%` }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* AWS + tools */}
          <div className="space-y-6">
            <Reveal delay={0.05} className="glass-panel">
              <h3 className="label-mono text-white/50">AWS Stack</h3>
              <div className="mt-5">
                <Chips items={AWS_STACK} />
              </div>
            </Reveal>
            <Reveal delay={0.1} className="glass-panel">
              <h3 className="label-mono text-white/50">Tools & Process</h3>
              <div className="mt-5">
                <Chips items={TOOLS} />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Skills
