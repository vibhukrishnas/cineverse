'use client'

import { motion } from 'framer-motion'
import { Award, Lock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Badge {
  id: string
  icon: string
  name: string
  tier: string
  rarity: string
  earnedAt?: string
}

interface BadgeShowcaseProps {
  badges: Badge[]
  totalBadges: number
  userId: string
}

const TIER_GRADIENTS = {
  bronze: 'from-orange-800 to-orange-600',
  silver: 'from-gray-400 to-gray-300',
  gold: 'from-yellow-500 to-yellow-400',
  platinum: 'from-gray-300 to-white',
}

export function BadgeShowcase({ badges, totalBadges, userId }: BadgeShowcaseProps) {
  // Show top 6 badges
  const displayBadges = badges.slice(0, 6)
  const emptySlots = Math.max(0, 6 - displayBadges.length)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Achievements</h3>
          <span className="text-sm text-muted-foreground">
            {badges.length} / {totalBadges}
          </span>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/profile/${userId}/badges`}>View All</Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {/* Earned Badges */}
        {displayBadges.map((badge, index) => {
          const tierGradient = TIER_GRADIENTS[badge.tier as keyof typeof TIER_GRADIENTS] || TIER_GRADIENTS.bronze
          
          return (
            <motion.div
              key={badge.id}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.1, type: 'spring' }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="group relative"
            >
              <div className={`aspect-square bg-gradient-to-br ${tierGradient} rounded-xl shadow-lg flex items-center justify-center text-4xl cursor-pointer`}>
                {badge.icon}
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <p className="text-sm font-medium text-popover-foreground">{badge.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{badge.tier}</p>
              </div>
            </motion.div>
          )
        })}

        {/* Empty Slots */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <motion.div
            key={`empty-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: (displayBadges.length + index) * 0.1 }}
            className="aspect-square bg-muted border-2 border-dashed border-muted-foreground/30 rounded-xl flex items-center justify-center"
          >
            <Lock className="w-6 h-6 text-muted-foreground/50" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
