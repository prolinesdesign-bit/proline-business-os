import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
}

export default function PageTransition({ children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
    >
      {children}
    </motion.div>
  )
}
