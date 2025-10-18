'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { MovieAudienceScore } from '@/types/audience.types'

interface AudienceBadgeProps {
  classification: MovieAudienceScore
  showScore?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function AudienceBadge({ classification, showScore = false, size = 'md' }: AudienceBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  const badgeStyle = {
    backgroundColor: classification.color || '#4A90E2',
    borderColor: classification.color || '#4A90E2',
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${sizeClasses[size]} font-medium`}
            style={badgeStyle}
          >
            <span className="mr-1">{classification.icon}</span>
            <span>{classification.display_name}</span>
            {showScore && (
              <span className="ml-1 opacity-75">
                {Math.round(classification.score * 100)}%
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <p className="font-semibold mb-1">{classification.display_name}</p>
            {classification.reasoning && (
              <p className="text-sm text-muted-foreground">{classification.reasoning}</p>
            )}
            {showScore && (
              <p className="text-xs text-muted-foreground mt-1">
                Match Score: {Math.round(classification.score * 100)}%
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface AudienceBadgesProps {
  classifications: MovieAudienceScore[]
  showScores?: boolean
  maxDisplay?: number
  size?: 'sm' | 'md' | 'lg'
}

export function AudienceBadges({
  classifications,
  showScores = false,
  maxDisplay = 3,
  size = 'md',
}: AudienceBadgesProps) {
  // Sort by score descending and take top classifications
  const sortedClassifications = [...classifications]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxDisplay)
    .filter((c) => c.score >= 0.5) // Only show if score >= 50%

  if (sortedClassifications.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sortedClassifications.map((classification) => (
        <AudienceBadge
          key={classification.audience_type}
          classification={classification}
          showScore={showScores}
          size={size}
        />
      ))}
    </div>
  )
}
