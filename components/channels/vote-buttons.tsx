'use client'

import { useState } from 'react'
import { ArrowBigUp, ArrowBigDown } from 'lucide-react'
import { vote } from '@/app/actions/channels'
import { cn } from '@/lib/utils'

interface VoteButtonsProps {
  votableId: string
  votableType: 'post' | 'comment'
  upvotes: number
  downvotes: number
  score: number
  userVote?: 'up' | 'down' | null
  className?: string
  vertical?: boolean
}

export function VoteButtons({
  votableId,
  votableType,
  upvotes,
  downvotes,
  score,
  userVote,
  className,
  vertical = true
}: VoteButtonsProps) {
  const [currentVote, setCurrentVote] = useState(userVote)
  const [currentScore, setCurrentScore] = useState(score)
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async (voteType: 'up' | 'down') => {
    if (isVoting) return

    setIsVoting(true)
    const previousVote = currentVote
    const previousScore = currentScore

    // Optimistic update
    let newScore = currentScore
    
    if (currentVote === voteType) {
      // Removing vote
      setCurrentVote(null)
      newScore = currentScore + (voteType === 'up' ? -1 : 1)
    } else if (currentVote) {
      // Changing vote
      setCurrentVote(voteType)
      newScore = currentScore + (voteType === 'up' ? 2 : -2)
    } else {
      // New vote
      setCurrentVote(voteType)
      newScore = currentScore + (voteType === 'up' ? 1 : -1)
    }

    setCurrentScore(newScore)

    try {
      await vote(votableId, votableType, voteType)
    } catch (error) {
      // Revert on error
      setCurrentVote(previousVote)
      setCurrentScore(previousScore)
      console.error('Vote failed:', error)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        vertical ? 'flex-col' : 'flex-row',
        className
      )}
    >
      <button
        onClick={() => handleVote('up')}
        disabled={isVoting}
        className={cn(
          'p-1 rounded transition-colors disabled:opacity-50',
          currentVote === 'up'
            ? 'text-orange-500 hover:text-orange-600'
            : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950'
        )}
        aria-label="Upvote"
      >
        <ArrowBigUp
          className={cn(
            'w-6 h-6',
            currentVote === 'up' && 'fill-current'
          )}
        />
      </button>

      <span
        className={cn(
          'text-sm font-bold min-w-[2ch] text-center',
          currentVote === 'up' && 'text-orange-500',
          currentVote === 'down' && 'text-blue-500',
          !currentVote && 'text-gray-600 dark:text-gray-400'
        )}
      >
        {currentScore > 0 ? '+' : ''}{currentScore}
      </span>

      <button
        onClick={() => handleVote('down')}
        disabled={isVoting}
        className={cn(
          'p-1 rounded transition-colors disabled:opacity-50',
          currentVote === 'down'
            ? 'text-blue-500 hover:text-blue-600'
            : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950'
        )}
        aria-label="Downvote"
      >
        <ArrowBigDown
          className={cn(
            'w-6 h-6',
            currentVote === 'down' && 'fill-current'
          )}
        />
      </button>
    </div>
  )
}
