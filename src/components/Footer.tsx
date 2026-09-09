import { IDENTITY } from '../data/content'

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-center sm:flex-row sm:px-8 sm:text-left">
        <p className="label-mono text-white/40">© 2026 {IDENTITY.name}, Senior Software Engineer</p>
        <a href="#top" className="label-mono text-white/40 transition-colors hover:text-white">Back to top ↑</a>
      </div>
    </footer>
  )
}

export default Footer
