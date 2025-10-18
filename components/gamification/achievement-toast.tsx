'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Trophy } from 'lucide-react'
import Confetti from 'react-confetti'
import { useWindowSize } from '@/hooks/use-window-size'

interface Achievement {
  id: string
  badgeName: string
  badgeIcon: string
  badgeTier: string
  karmaReward: number
}

interface AchievementToastProps {
  achievement: Achievement | null
  onClose: () => void
}

const TIER_COLORS = {
  bronze: 'from-orange-800 to-orange-600',
  silver: 'from-gray-400 to-gray-300',
  gold: 'from-yellow-500 to-yellow-400',
  platinum: 'from-gray-300 to-white',
}

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const { width, height } = useWindowSize()

  useEffect(() => {
    if (achievement) {
      setShowConfetti(true)
      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, 5000)

      const autoCloseTimer = setTimeout(() => {
        onClose()
      }, 8000)

      return () => {
        clearTimeout(timer)
        clearTimeout(autoCloseTimer)
      }
    }
  }, [achievement, onClose])

  if (!achievement) return null

  const tierGradient = TIER_COLORS[achievement.badgeTier as keyof typeof TIER_COLORS] || TIER_COLORS.bronze

  return (
    <>
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      {/* Toast */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className="bg-card border-2 border-yellow-500 rounded-xl shadow-2xl overflow-hidden">
            {/* Animated Background */}
            <motion.div
              animate={{
                background: [
                  'linear-gradient(45deg, rgba(234,179,8,0.1) 0%, rgba(234,179,8,0) 100%)',
                  'linear-gradient(45deg, rgba(234,179,8,0) 0%, rgba(234,179,8,0.1) 100%)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
              className="absolute inset-0"
            />

            <div className="relative p-6">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-2 right-2 p-1 hover:bg-accent rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="flex items-start gap-4">
                {/* Badge Icon */}
                <motion.div
                  animate={{
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 1, repeat: 2 }}
                  className={`flex-shrink-0 w-20 h-20 bg-gradient-to-br ${tierGradient} rounded-xl shadow-lg flex items-center justify-center text-4xl`}
                >
                  {achievement.badgeIcon}
                </motion.div>

                {/* Text */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-bold text-foreground">Achievement Unlocked!</h3>
                  </div>

                  <p className="text-xl font-bold text-primary">{achievement.badgeName}</p>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium text-yellow-600 dark:text-yellow-400">
                      +{achievement.karmaReward} Karma
                    </span>
                    <span>•</span>
                    <span className="capitalize">{achievement.badgeTier} Badge</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

// Hook for managing achievement toasts
export function useAchievementToast() {
  const [achievement, setAchievement] = useState<Achievement | null>(null)

  const showAchievement = (newAchievement: Achievement) => {
    setAchievement(newAchievement)
  }

  const closeAchievement = () => {
    setAchievement(null)
  }

  return {
    achievement,
    showAchievement,
    closeAchievement,
  }
}
