import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NAV_LINKS } from '../data/content'

function Logo({ size = 22 }: { size?: number }) {
  // Monogram: Parth Sethi's initials. The accent "S" ties the mark to the
  // site's single voltage color without adding any new hue.
  return (
    <span
      aria-hidden="true"
      className="font-mono font-bold leading-none tracking-tight text-white"
      style={{ fontSize: size * 0.82 }}
    >
      P<span className="text-accent">S</span>
    </span>
  )
}

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between md:justify-center p-4 sm:p-5">
      {/* Desktop: one centered pill */}
      <div className="nav-drop hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-black/50 pl-3 pr-2 py-2 backdrop-blur-md">
        <a href="#top" aria-label="Home" className="px-1.5">
          <Logo />
        </a>
        {NAV_LINKS.map((link) => {
          const isCta = link.href === '#contact'
          return (
            <a
              key={link.href}
              href={link.href}
              className={
                isCta
                  ? 'ml-1 rounded-full bg-white px-5 py-1.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100'
                  : 'rounded-full px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white'
              }
            >
              {link.label}
            </a>
          )
        })}
      </div>

      {/* Mobile: logo pill */}
      <a
        href="#top"
        aria-label="Home"
        className="nav-drop relative z-[101] rounded-full border border-white/10 bg-black/50 p-2.5 backdrop-blur-md md:hidden"
      >
        <Logo />
      </a>
      {/* Mobile: hamburger */}
      <button
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        className="nav-drop relative z-[101] rounded-full border border-white/10 bg-black/50 p-2.5 text-white backdrop-blur-md md:hidden"
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="fixed left-0 right-0 top-0 z-[100] bg-[#0b0b0e] px-5 pb-6 pt-16 shadow-2xl md:hidden">
          {NAV_LINKS.map((link) => {
            const isCta = link.href === '#contact'
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={
                  isCta
                    ? 'mt-4 block w-full rounded-full bg-white py-3 text-center text-sm font-semibold text-gray-900'
                    : 'block w-full border-b border-white/10 py-3 text-left text-gray-200'
                }
              >
                {link.label}
              </a>
            )
          })}
        </div>
      )}
    </nav>
  )
}

export default Nav
