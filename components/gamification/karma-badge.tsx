'use client'

import { motion } from 'framer-motion'
import { Sparkles, TrendingUp } from 'lucide-react'

interface KarmaBadgeProps {
  karma: number
  level: number
  levelName: string
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const LEVEL_COLORS = {
  1: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-300 dark:border-gray-600' },
  2: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-600' },
  3: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-600' },
  4: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-600' },
  5: { bg: 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600', text: 'text-gray-900 dark:text-gray-100', border: 'border-gray-400 dark:border-gray-500' },
}

const SIZE_CLASSES = {
  sm: {
    container: 'px-2 py-1 text-xs',
    icon: 'w-3 h-3',
    gap: 'gap-1',
  },
  md: {
    container: 'px-3 py-1.5 text-sm',
    icon: 'w-4 h-4',
    gap: 'gap-1.5',
  },
  lg: {
    container: 'px-4 py-2 text-base',
    icon: 'w-5 h-5',
    gap: 'gap-2',
  },
}

export function KarmaBadge({
  karma,
  level,
  levelName,
  showDetails = false,
  size = 'md',
  className = '',
}: KarmaBadgeProps) {
  const colors = LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS[1]
  const sizeClass = SIZE_CLASSES[size]

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center ${sizeClass.gap} ${sizeClass.container} ${colors.bg} ${colors.text} ${colors.border} border-2 rounded-full font-semibold shadow-sm ${className}`}
    >
      <Sparkles className={sizeClass.icon} />
      
      {showDetails ? (
        <div className="flex items-center gap-2">
          <span className="font-bold">{levelName}</span>
          <span className="opacity-75">•</span>
          <div className="flex items-center gap-1">
            <TrendingUp className={sizeClass.icon} />
            <span>{karma.toLocaleString()}</span>
          </div>
        </div>
      ) : (
        <>
          <span>{levelName}</span>
          <span className="opacity-75">•</span>
          <span>{karma.toLocaleString()}</span>
        </>
      )}
    </motion.div>
  )
}
