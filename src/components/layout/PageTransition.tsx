import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
}

export default function PageTransition({ children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
