import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { UserReviews } from '@/components/reviews/user-reviews'
import { MessageSquare, Bookmark, Heart, Star } from 'lucide-react'
import { getUserReviewStats } from '@/app/actions/reviews'
import { getUserStats, getLevelProgress } from '@/app/actions/gamification'
import { getUserBadges } from '@/app/actions/achievements'
import { KarmaBadge } from '@/components/gamification/karma-badge'
import { LevelProgress } from '@/components/gamification/level-progress'
import { BadgeShowcase } from '@/components/gamification/badge-showcase'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile - create if doesn't exist
  let { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // If profile doesn't exist, create it
  if (!profile) {
    const { data: newProfile, error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email!,
        username: user.email?.split('@')[0] || 'user',
      })
      .select()
      .single()
    
    if (!error && newProfile) {
      profile = newProfile
    }
  }

  // Get review stats
  const stats = await getUserReviewStats(user.id)

  // Get gamification stats
  const { stats: userStats } = await getUserStats(user.id)
  const badgesResult = await getUserBadges(user.id)
  const badges = badgesResult.success ? badgesResult.badges : []
  const levelProgressResult = await getLevelProgress(user.id)
  const levelProgress = levelProgressResult.success ? levelProgressResult : null

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Profile Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
            {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
          </div>

          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                {profile?.username || 'User Profile'}
              </h1>
              {userStats && (
                <KarmaBadge
                  karma={userStats.karma_points}
                  level={userStats.level}
                  levelName={userStats.level_name}
                  showDetails={false}
                  size="md"
                />
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {user.email}
            </p>
          </div>
        </div>

        {profile?.bio && (
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {profile.bio}
          </p>
        )}

        {/* Level Progress */}
        {userStats && levelProgress && levelProgress.nextLevel && (
          <Card className="p-6 mb-6">
            <LevelProgress
              currentKarma={userStats.karma_points}
              currentLevel={userStats.level}
              currentLevelName={userStats.level_name}
              nextLevel={levelProgress.nextLevel.level}
              nextLevelName={levelProgress.nextLevel.name}
              nextLevelKarma={levelProgress.nextLevel.minKarma}
              currentLevelMinKarma={levelProgress.currentLevel?.minKarma || 0}
            />
          </Card>
        )}

        {/* Badge Showcase */}
        {badges && badges.length > 0 && (
          <Card className="p-6 mb-6">
            <BadgeShowcase badges={badges.map((b: any) => ({
              id: b.id,
              icon: b.icon,
              name: b.name,
              tier: b.tier,
              rarity: b.rarity,
              earnedAt: b.earned_at
            }))} totalBadges={16} userId={user.id} />
          </Card>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalReviews || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Reviews Written</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.averageRating || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Bookmark className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Watchlist Items</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-6">
          <UserReviews userId={user.id} />
        </TabsContent>

        <TabsContent value="watchlist" className="mt-6">
          <Card className="p-8 text-center">
            <Bookmark className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              Your watchlist is empty
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          <Card className="p-8 text-center">
            <Heart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              You haven't favorited any movies yet
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
