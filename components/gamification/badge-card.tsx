'use client'

import { motion } from 'framer-motion'
import { Lock, Check } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface BadgeCardProps {
  icon: string
  name: string
  description: string
  tier: string
  rarity: string
  progress: number
  required: number
  completed: boolean
  earnedAt?: string
  karmaReward: number
  size?: 'sm' | 'md' | 'lg'
}

const TIER_COLORS = {
  bronze: 'from-orange-800 to-orange-600',
  silver: 'from-gray-400 to-gray-300',
  gold: 'from-yellow-500 to-yellow-400',
  platinum: 'from-gray-300 to-white',
}

const RARITY_COLORS = {
  common: 'border-gray-400',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-500',
}

export function BadgeCard({
  icon,
  name,
  description,
  tier,
  rarity,
  progress,
  required,
  completed,
  earnedAt,
  karmaReward,
  size = 'md',
}: BadgeCardProps) {
  const progressPercentage = (progress / required) * 100
  const tierGradient = TIER_COLORS[tier as keyof typeof TIER_COLORS] || TIER_COLORS.bronze
  const rarityBorder = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common

  const cardSize = {
    sm: { container: 'p-3', icon: 'text-3xl', title: 'text-sm', desc: 'text-xs' },
    md: { container: 'p-4', icon: 'text-4xl', title: 'text-base', desc: 'text-sm' },
    lg: { container: 'p-5', icon: 'text-5xl', title: 'text-lg', desc: 'text-base' },
  }[size]

  return (
    <motion.div
      whileHover={{ scale: completed ? 1.05 : 1.02, y: -4 }}
      className={`relative ${cardSize.container} bg-card border-2 ${rarityBorder} rounded-xl shadow-lg overflow-hidden transition-all ${
        completed ? 'opacity-100' : 'opacity-75'
      }`}
    >
      {/* Background Gradient for Earned Badges */}
      {completed && (
        <div className={`absolute inset-0 bg-gradient-to-br ${tierGradient} opacity-10`} />
      )}

      {/* Lock Overlay for Locked Badges */}
      {!completed && progress === 0 && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
      )}

      <div className="relative space-y-3">
        {/* Badge Icon */}
        <div className="flex items-start justify-between">
          <div className={`${cardSize.icon} flex items-center justify-center w-16 h-16 bg-gradient-to-br ${tierGradient} rounded-xl shadow-md`}>
            {icon}
          </div>
          
          {completed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full"
            >
              <Check className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </div>

        {/* Badge Info */}
        <div className="space-y-1">
          <h3 className={`${cardSize.title} font-bold text-foreground`}>{name}</h3>
          <p className={`${cardSize.desc} text-muted-foreground line-clamp-2`}>
            {description}
          </p>
        </div>

        {/* Progress or Earned Date */}
        {completed && earnedAt ? (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="capitalize">{rarity} • {tier}</span>
            <span>+{karmaReward} Karma</span>
          </div>
        ) : (
          <div className="space-y-1">
            <Progress value={progressPercentage} className="h-1.5" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {progress} / {required}
              </span>
              <span>+{karmaReward} Karma</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
