'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Award } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface LevelProgressProps {
  currentKarma: number
  currentLevel: number
  currentLevelName: string
  nextLevel?: number
  nextLevelName?: string
  nextLevelKarma?: number
  currentLevelMinKarma: number
  className?: string
}

const LEVEL_COLORS = {
  1: 'text-gray-600 dark:text-gray-400',
  2: 'text-blue-600 dark:text-blue-400',
  3: 'text-purple-600 dark:text-purple-400',
  4: 'text-amber-600 dark:text-amber-400',
  5: 'text-gray-800 dark:text-gray-200',
}

export function LevelProgress({
  currentKarma,
  currentLevel,
  currentLevelName,
  nextLevel,
  nextLevelName,
  nextLevelKarma,
  currentLevelMinKarma,
  className = '',
}: LevelProgressProps) {
  // Calculate progress percentage
  const isMaxLevel = !nextLevel || !nextLevelKarma
  const karmaInCurrentLevel = currentKarma - currentLevelMinKarma
  const karmaNeededForNextLevel = isMaxLevel ? 0 : nextLevelKarma - currentLevelMinKarma
  const progressPercentage = isMaxLevel
    ? 100
    : Math.min((karmaInCurrentLevel / karmaNeededForNextLevel) * 100, 100)

  const karmaUntilNext = isMaxLevel ? 0 : nextLevelKarma - currentKarma

  const levelColor = LEVEL_COLORS[currentLevel as keyof typeof LEVEL_COLORS] || LEVEL_COLORS[1]

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Current Level Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className={`w-5 h-5 ${levelColor}`} />
          <div>
            <p className="text-sm font-medium text-foreground">
              Level {currentLevel}: {currentLevelName}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentKarma.toLocaleString()} Karma Points
            </p>
          </div>
        </div>

        {!isMaxLevel && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Next Level</p>
            <p className="text-sm font-medium text-foreground">{nextLevelName}</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {!isMaxLevel ? (
        <>
          <div className="space-y-1">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{karmaInCurrentLevel.toLocaleString()} / {karmaNeededForNextLevel.toLocaleString()}</span>
              <motion.span
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-1 font-medium text-primary"
              >
                <TrendingUp className="w-3 h-3" />
                {karmaUntilNext.toLocaleString()} to go
              </motion.span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2"
          >
            <Award className="w-5 h-5 text-yellow-500" />
            <span className="font-medium">Max Level Reached! 🎉</span>
          </motion.div>
        </div>
      )}
    </div>
  )
}
