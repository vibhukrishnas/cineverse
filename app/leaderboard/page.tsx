import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Trophy, TrendingUp, ThumbsUp, MessageSquare, Award } from 'lucide-react'
import { getKarmaLeaderboard, getHelpfulLeaderboard, getActiveLeaderboard } from '@/app/actions/gamification'
import { KarmaBadge } from '@/components/gamification/karma-badge'
import Link from 'next/link'

export const metadata = {
  title: 'Leaderboard | CineVerse',
  description: 'Top reviewers and contributors on CineVerse',
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get leaderboards
  const karmaLeaderboard = await getKarmaLeaderboard(100)
  const helpfulLeaderboard = await getHelpfulLeaderboard(100)
  const activeLeaderboard = await getActiveLeaderboard(100)

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="w-10 h-10 text-yellow-500" />
          <h1 className="text-4xl font-bold">Leaderboard</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Top contributors and reviewers on CineVerse
        </p>
      </div>

      {/* Leaderboard Tabs */}
      <Tabs defaultValue="karma" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
          <TabsTrigger value="karma" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>Karma</span>
          </TabsTrigger>
          <TabsTrigger value="helpful" className="gap-2">
            <ThumbsUp className="w-4 h-4" />
            <span>Most Helpful</span>
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>Most Active</span>
          </TabsTrigger>
        </TabsList>

        {/* Karma Leaderboard */}
        <TabsContent value="karma" className="mt-8">
          <Card className="p-6">
            <div className="space-y-4">
              {karmaLeaderboard.success && karmaLeaderboard.leaderboard?.map((entry: any, index: number) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-colors hover:bg-accent ${
                    entry.user_id === user?.id ? 'bg-accent/50 border-2 border-primary' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                    {index < 3 ? (
                      <div className={`text-2xl ${
                        index === 0 ? 'text-yellow-500' : 
                        index === 1 ? 'text-gray-400' : 
                        'text-orange-600'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                    ) : (
                      <span className="text-xl font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <Link
                      href={`/profile/${entry.user_id}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {entry.username || 'Anonymous User'}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <KarmaBadge
                        karma={entry.karma_points}
                        level={entry.level}
                        levelName={entry.level_name}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <div className="text-center">
                      <p className="font-bold text-foreground">{entry.reviews_count}</p>
                      <p className="text-xs">Reviews</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-foreground">{entry.followers_count || 0}</p>
                      <p className="text-xs">Followers</p>
                    </div>
                  </div>
                </div>
              ))}

              {(!karmaLeaderboard.success || karmaLeaderboard.leaderboard?.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No leaderboard data available yet</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Most Helpful Leaderboard */}
        <TabsContent value="helpful" className="mt-8">
          <Card className="p-6">
            <div className="space-y-4">
              {helpfulLeaderboard.success && helpfulLeaderboard.leaderboard?.map((entry: any, index: number) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-colors hover:bg-accent ${
                    entry.user_id === user?.id ? 'bg-accent/50 border-2 border-primary' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                    {index < 3 ? (
                      <div className={`text-2xl ${
                        index === 0 ? 'text-yellow-500' : 
                        index === 1 ? 'text-gray-400' : 
                        'text-orange-600'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                    ) : (
                      <span className="text-xl font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <Link
                      href={`/profile/${entry.user_id}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {entry.username || 'Anonymous User'}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <KarmaBadge
                        karma={entry.karma_points}
                        level={entry.level}
                        levelName={entry.level_name}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <div className="text-center">
                      <p className="font-bold text-green-600 dark:text-green-400 text-xl">
                        {entry.helpful_votes_received}
                      </p>
                      <p className="text-xs">Helpful Votes</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-foreground">{entry.reviews_count}</p>
                      <p className="text-xs">Reviews</p>
                    </div>
                  </div>
                </div>
              ))}

              {(!helpfulLeaderboard.success || helpfulLeaderboard.leaderboard?.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <ThumbsUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No leaderboard data available yet</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Most Active Leaderboard */}
        <TabsContent value="active" className="mt-8">
          <Card className="p-6">
            <div className="space-y-4">
              {activeLeaderboard.success && activeLeaderboard.leaderboard?.map((entry: any, index: number) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-colors hover:bg-accent ${
                    entry.user_id === user?.id ? 'bg-accent/50 border-2 border-primary' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                    {index < 3 ? (
                      <div className={`text-2xl ${
                        index === 0 ? 'text-yellow-500' : 
                        index === 1 ? 'text-gray-400' : 
                        'text-orange-600'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                    ) : (
                      <span className="text-xl font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <Link
                      href={`/profile/${entry.user_id}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {entry.username || 'Anonymous User'}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <KarmaBadge
                        karma={entry.karma_points}
                        level={entry.level}
                        levelName={entry.level_name}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <div className="text-center">
                      <p className="font-bold text-blue-600 dark:text-blue-400 text-xl">
                        {entry.reviews_count}
                      </p>
                      <p className="text-xs">Reviews</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-foreground">{entry.channel_posts_count || 0}</p>
                      <p className="text-xs">Posts</p>
                    </div>
                  </div>
                </div>
              ))}

              {(!activeLeaderboard.success || activeLeaderboard.leaderboard?.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No leaderboard data available yet</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      {user && (
        <Card className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2">
          <div className="flex items-center gap-4">
            <Award className="w-12 h-12 text-primary" />
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">Want to climb the leaderboard?</h3>
              <p className="text-sm text-muted-foreground">
                Write more reviews, help others, and engage with the community to earn karma and badges!
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
