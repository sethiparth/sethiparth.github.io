import { motion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

/* Shared scroll-into-view primitives. `whileInView` is IntersectionObserver
   under the hood, so it composes with Lenis for free (visibility-driven, not
   scroll-position-driven). One expo-out easing keeps every section coherent. */

const EASE = [0.16, 1, 0.3, 1] as const

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}

export function Reveal({ children, className, delay = 0, y = 32 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}
