import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Award, Lock, Trophy } from 'lucide-react'
import { getUserAchievements } from '@/app/actions/achievements'
import { BadgeCard } from '@/components/gamification/badge-card'

export const metadata = {
  title: 'Achievements | CineVerse',
  description: 'Your achievements and badges on CineVerse',
}

export default async function BadgesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user achievements
  const achievementsResult = await getUserAchievements(user.id)
  const achievements = achievementsResult.success ? achievementsResult.achievements : []

  // Calculate stats
  const totalBadges = achievements.length
  const earnedBadges = achievements.filter((a: any) => a.completed).length
  const inProgress = achievements.filter((a: any) => !a.completed && a.progress > 0).length

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-10 h-10 text-yellow-500" />
          <h1 className="text-4xl font-bold">Your Achievements</h1>
        </div>
        <p className="text-lg text-muted-foreground mb-6">
          Track your progress and unlock badges by engaging with CineVerse
        </p>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{earnedBadges}</p>
                <p className="text-sm text-muted-foreground">Badges Earned</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Lock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalBadges - earnedBadges}</p>
                <p className="text-sm text-muted-foreground">Locked</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Achievement Categories */}
      <div className="space-y-8">
        {/* Earned Badges */}
        {earnedBadges > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Earned Badges ({earnedBadges})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {achievements
                .filter((a: any) => a.completed)
                .map((achievement: any) => (
                  <BadgeCard
                    key={achievement.badge_id}
                    icon={achievement.icon}
                    name={achievement.name}
                    description={achievement.description}
                    tier={achievement.tier}
                    rarity={achievement.rarity}
                    progress={achievement.progress}
                    required={achievement.required}
                    completed={achievement.completed}
                    earnedAt={achievement.earned_at}
                    karmaReward={achievement.karma_reward}
                    size="md"
                  />
                ))}
            </div>
          </div>
        )}

        {/* In Progress */}
        {inProgress > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-blue-500" />
              In Progress ({inProgress})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {achievements
                .filter((a: any) => !a.completed && a.progress > 0)
                .map((achievement: any) => (
                  <BadgeCard
                    key={achievement.badge_id}
                    icon={achievement.icon}
                    name={achievement.name}
                    description={achievement.description}
                    tier={achievement.tier}
                    rarity={achievement.rarity}
                    progress={achievement.progress}
                    required={achievement.required}
                    completed={achievement.completed}
                    earnedAt={achievement.earned_at}
                    karmaReward={achievement.karma_reward}
                    size="md"
                  />
                ))}
            </div>
          </div>
        )}

        {/* Locked */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Lock className="w-6 h-6 text-gray-500" />
            Locked Badges ({totalBadges - earnedBadges - inProgress})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {achievements
              .filter((a: any) => !a.completed && a.progress === 0)
              .map((achievement: any) => (
                <BadgeCard
                  key={achievement.badge_id}
                  icon={achievement.icon}
                  name={achievement.name}
                  description={achievement.description}
                  tier={achievement.tier}
                  rarity={achievement.rarity}
                  progress={achievement.progress}
                  required={achievement.required}
                  completed={achievement.completed}
                  earnedAt={achievement.earned_at}
                  karmaReward={achievement.karma_reward}
                  size="md"
                />
              ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <Card className="mt-12 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-2">
        <div className="flex items-center gap-4">
          <Trophy className="w-12 h-12 text-yellow-500" />
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">Keep Going!</h3>
            <p className="text-sm text-muted-foreground">
              Unlock more badges by writing reviews, helping others, and exploring different genres. Each badge earns you karma points!
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
