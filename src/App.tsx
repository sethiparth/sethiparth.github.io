import { MotionConfig } from 'motion/react'
import CursorTrail from './components/CursorTrail'
import Nav from './components/Nav'
import Hero from './hero/Hero'
import Experience from './components/Experience'
import Projects from './components/Projects'
import Skills from './components/Skills'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#08080b] text-white tracking-[-0.01em]">
        <CursorTrail />
        <Nav />
        <main>
          <Hero />
          <Experience />
          <Projects />
          <Skills />
          <Contact />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  )
}
