// Gamification Constants
// These are configuration values used throughout the app

// Karma point values for different actions
export const KARMA_VALUES = {
  REVIEW_CREATED: 10,
  REVIEW_LIKED: 2,
  HELPFUL_VOTE: 3,
  CHANNEL_POST: 5,
  POST_UPVOTE: 1,
  COMMENT_CREATED: 1,
  BADGE_EARNED: 0, // Set dynamically based on badge
  CHALLENGE_COMPLETED: 0, // Set dynamically based on challenge
} as const

// User level thresholds and names
export const USER_LEVELS = [
  { level: 1, name: 'Newbie', minKarma: 0, maxKarma: 100, color: '#9CA3AF' },
  { level: 2, name: 'Critic', minKarma: 101, maxKarma: 500, color: '#3B82F6' },
  { level: 3, name: 'Expert', minKarma: 501, maxKarma: 1500, color: '#8B5CF6' },
  { level: 4, name: 'Legend', minKarma: 1501, maxKarma: 5000, color: '#F59E0B' },
  { level: 5, name: 'Icon', minKarma: 5001, maxKarma: Infinity, color: '#E5E7EB' },
]

// Helper function to calculate level
export function calculateLevelSync(karma: number) {
  return USER_LEVELS.find(
    (level) => karma >= level.minKarma && karma <= level.maxKarma
  ) || USER_LEVELS[0]
}
