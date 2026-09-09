import type { MouseEvent } from 'react'
import { PROJECTS, type Project } from '../data/content'
import { Reveal } from './Reveal'

const pad = (n: number) => String(n).padStart(2, '0')

/* Editorial tile: a cursor-tracking spotlight (radial-gradient positioned by
   --mx/--my) plus a subtle 3D tilt (--rx/--ry), both written straight to style
   on mousemove — no React re-render, just cheap style writes. A faded display
   numeral echoes the Experience chapters so the two sections rhyme. */
function ProjectCard({ project, index }: { project: Project; index: number }) {
  function onMove(e: MouseEvent<HTMLElement>) {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width // 0..1 across the tile
    const py = (e.clientY - r.top) / r.height
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
    el.style.setProperty('--ry', `${(px - 0.5) * 7}deg`) // yaw follows horizontal
    el.style.setProperty('--rx', `${(0.5 - py) * 7}deg`) // pitch follows vertical
  }

  function onLeave(e: MouseEvent<HTMLElement>) {
    const el = e.currentTarget
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <article
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="project-tile spotlight-card group relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0c0c11] p-7 hover:border-accent/40"
    >
      <span aria-hidden="true" className="tile-ghost pointer-events-none absolute right-4 top-2 select-none">
        {pad(index + 1)}
      </span>

      <div className="relative z-10">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-lg font-semibold text-white">{project.title}</h3>
          <span className="label-mono shrink-0 text-accent">{project.metric}</span>
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-white/70">{project.description}</p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {project.tags.map((t) => (
            <li key={t} className="label-mono rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60">
              {t}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

export function Projects() {
  return (
    <section id="work" className="section-shell">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="label-mono text-accent">03 — Selected work</p>
          <h2 className="section-title mt-3">Five systems shipped at scale.</h2>
          <p className="mt-4 max-w-2xl text-white/60">
            A rendering engine carrying a billion-dollar channel, a 10x throughput rewrite, a five-nines
            reliability framework, a platform protecting half a million customers, and an AI-orchestrated
            automation pipeline.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {PROJECTS.map((p, i) => (
            <Reveal key={p.title} delay={(i % 2) * 0.08} className={i === PROJECTS.length - 1 && PROJECTS.length % 2 === 1 ? 'md:col-span-2' : ''}>
              <ProjectCard project={p} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Projects
