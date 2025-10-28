'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Film, Star, TrendingUp, Bookmark, Sparkles, MessageCircle, Users as UsersIcon, Ticket, MapPin, Trophy, Award, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TMDBMovie, TMDBMovieDetail } from '@/types/tmdb.types'
import { MovieCard } from '@/components/movies/movie-card'
import { MovieCardSkeleton } from '@/components/movies/loading-skeletons'
import { TwitterFeedWidget } from '@/components/social/twitter-feed-widget'
import { MovieUpdatesWidget } from '@/components/movies/movie-updates-widget'
import { RecentActivityWidget } from '@/components/dashboard/recent-activity-widget'
import { LanguageSelector } from '@/components/location/language-selector'
import { LevelProgress } from '@/components/gamification/level-progress'
import { BadgeShowcase } from '@/components/gamification/badge-showcase'
import { KarmaBadge } from '@/components/gamification/karma-badge'
import { analytics } from '@/lib/analytics/posthog'
import { getUserWatchlistWithDetails } from '@/app/actions/watchlist'
import { getUserStats } from '@/app/actions/profile'
import { getChannels } from '@/app/actions/channels'
import { getUserAchievements } from '@/app/actions/achievements'
import { calculateLevel } from '@/app/actions/gamification'
import { createClient } from '@/lib/supabase/client'
import { type LanguagePreference, ALL_LANGUAGES } from '@/lib/location/geolocation'
import Link from 'next/link'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [trendingMovies, setTrendingMovies] = useState<TMDBMovie[]>([])
  const [watchlistMovies, setWatchlistMovies] = useState<TMDBMovieDetail[]>([])
  const [watchlistLoading, setWatchlistLoading] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState<LanguagePreference | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string>('US')
  const [channels, setChannels] = useState<any[]>([])
  const [channelsLoading, setChannelsLoading] = useState(true)
  const [userStats, setUserStats] = useState({
    reviewsCount: 0,
    watchlistCount: 0,
    averageRating: 0,
    followersCount: 0,
    followingCount: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [achievements, setAchievements] = useState<any[]>([])
  const [achievementsLoading, setAchievementsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userLevel, setUserLevel] = useState<any>(null)

  useEffect(() => {
    // Track dashboard visit
    analytics.featureUsed('dashboard')
    
    // Load saved preferences from localStorage
    const savedLanguage = localStorage.getItem('cineverse_language_preference') || 'en'
    const savedRegion = localStorage.getItem('cineverse_region') || 'US'
    
    // Set initial state from saved preferences
    const language = ALL_LANGUAGES.find(l => l.code === savedLanguage)
    if (language) {
      setSelectedLanguage(language)
      setSelectedRegion(savedRegion)
    }
    
    // Load trending movies with saved preferences
    loadTrendingMovies(savedRegion, savedLanguage)
    loadWatchlist()
    loadUserStats()
    loadChannels()
    loadAchievements()
    loadUserProfile()
  }, [])

  const loadUserStats = async () => {
    try {
      setStatsLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const result = await getUserStats(user.id)
        if (result.success) {
          setUserStats(result.stats)
        }
      }
    } catch (error) {
      console.error('Failed to load user stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const loadWatchlist = async () => {
    try {
      setWatchlistLoading(true)
      const result = await getUserWatchlistWithDetails()
      if (result.success) {
        setWatchlistMovies(result.movies)
      }
    } catch (error) {
      console.error('Failed to load watchlist:', error)
    } finally {
      setWatchlistLoading(false)
    }
  }

  const loadChannels = async () => {
    try {
      setChannelsLoading(true)
      const popularChannels = await getChannels({
        sort: 'members',
        limit: 6
      })
      setChannels(popularChannels)
    } catch (error) {
      console.error('Failed to load channels:', error)
    } finally {
      setChannelsLoading(false)
    }
  }

  const loadAchievements = async () => {
    try {
      setAchievementsLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const result = await getUserAchievements(user.id)
        if (result.success) {
          // Get recent achievements (last 5)
          setAchievements(result.achievements.slice(0, 5))
        }
      }
    } catch (error) {
      console.error('Failed to load achievements:', error)
    } finally {
      setAchievementsLoading(false)
    }
  }

  const loadUserProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setUserProfile(profile)
        
        // Calculate level from karma
        if (profile) {
          const level = await calculateLevel(profile.karma || 0)
          setUserLevel(level)
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
    }
  }

  const loadTrendingMovies = async (region: string = 'US', language: string = 'en') => {
    try {
      setLoading(true)
      // Call our API route with region and language parameters
      const response = await fetch(`/api/movies/trending?region=${region}&language=${language}`)
      if (!response.ok) {
        throw new Error('Failed to fetch trending movies')
      }
      const data = await response.json()
      setTrendingMovies(data.results.slice(0, 6))
    } catch (error) {
      console.error('Failed to load trending movies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLanguageChange = (language: LanguagePreference) => {
    console.log(`🎬 Language changed to: ${language.name} (${language.code})`)
    setSelectedLanguage(language)
    setSelectedRegion(language.region)
    loadTrendingMovies(language.region, language.code)
  }

  const handleRegionChange = (region: string) => {
    console.log(`🌍 Region changed to: ${region}`)
    setSelectedRegion(region)
    loadTrendingMovies(region, selectedLanguage?.code || 'en')
  }

  // Remove the main loading state that blocks the entire dashboard
  // Individual sections will show their own loading states

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome to CineVerse</h1>
        <p className="text-muted-foreground">
          Discover, review, and discuss your favorite movies
        </p>
      </div>

      {/* Gamification Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="mb-6"
      >
        <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 border-purple-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-500" />
                <CardTitle>Your Progress</CardTitle>
              </div>
              <Link href="/badges">
                <Button variant="ghost" size="sm">
                  View All <Award className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <CardDescription>Track your achievements and level up!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Level Progress */}
            {userProfile && userLevel && (
              <div className="space-y-2">
                <LevelProgress 
                  currentKarma={userProfile.karma || 0}
                  currentLevel={userLevel.level}
                  currentLevelName={userLevel.name}
                  nextLevel={userLevel.nextLevel}
                  nextLevelName={userLevel.nextLevelName}
                  nextLevelKarma={userLevel.nextLevelKarma}
                  currentLevelMinKarma={userLevel.minKarma}
                />
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-background/50">
                <Zap className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                <div className="text-2xl font-bold">{userProfile?.karma || 0}</div>
                <p className="text-xs text-muted-foreground">Karma Points</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <Trophy className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                <div className="text-2xl font-bold">{achievements.length}</div>
                <p className="text-xs text-muted-foreground">Achievements</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <Award className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <div className="text-2xl font-bold">{userStats.reviewsCount}</div>
                <p className="text-xs text-muted-foreground">Reviews</p>
              </div>
            </div>

            {/* Recent Achievements */}
            {!achievementsLoading && achievements.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  Recent Achievements
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {achievements.slice(0, 5).map((achievement: any) => (
                    <div
                      key={achievement.id}
                      className="p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors text-center"
                      title={achievement.description}
                    >
                      <div className="text-2xl mb-1">{achievement.icon || '🏆'}</div>
                      <p className="text-xs font-medium truncate">{achievement.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Karma Badge */}
            {userProfile && userLevel && (
              <div className="flex justify-center">
                <KarmaBadge 
                  karma={userProfile.karma || 0}
                  level={userLevel.level}
                  levelName={userLevel.name}
                  showDetails={true}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Movies in Watchlist</CardTitle>
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{userStats.watchlistCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {userStats.watchlistCount > 0 ? 'Keep watching!' : 'Start building your watchlist'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reviews Written</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{userStats.reviewsCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {userStats.reviewsCount > 0 ? 'Keep sharing your thoughts!' : 'Write your first review'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{userStats.averageRating || '--'}</div>
                  <p className="text-xs text-muted-foreground">
                    {userStats.reviewsCount > 0 ? 'Out of 10' : 'No reviews yet'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity and AI Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Activity Card */}
          <RecentActivityWidget />

          {/* AI Recommendations - Now Actually Works! */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
                AI Recommendations
              </CardTitle>
              <CardDescription>Personalized movies based on your taste</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Discover Your Perfect Movies</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  AI-powered recommendations using collaborative filtering
                </p>
                <Link href="/for-you">
                  <Button size="lg" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    View AI Recommendations
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* My Watchlist Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5" />
                  My Watchlist
                </CardTitle>
                <CardDescription>Movies you want to watch</CardDescription>
              </div>
              <Link href="/profile">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {watchlistLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <MovieCardSkeleton key={i} />
                ))}
              </div>
            ) : watchlistMovies.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {watchlistMovies.slice(0, 6).map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No movies in watchlist</h3>
                <p className="text-muted-foreground mb-4">
                  Add movies to your watchlist to see them here
                </p>
                <Link href="/explore">
                  <Button>Browse Movies</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Theater Booking Section - NEW! */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.52 }}
      >
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  Theater Bookings
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full ml-2">NEW</span>
                </CardTitle>
                <CardDescription>Find theaters and book your movie tickets</CardDescription>
              </div>
              <Link href="/theaters">
                <Button variant="default" size="sm">
                  <MapPin className="h-4 w-4 mr-2" />
                  Find Theaters
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Quick Action: Search Theaters */}
              <Link href="/theaters" className="group">
                <div className="p-6 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer">
                  <MapPin className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">Find Theaters</h3>
                  <p className="text-sm text-muted-foreground">
                    Search theaters by city and amenities
                  </p>
                </div>
              </Link>

              {/* Quick Action: View Bookings */}
              <Link href="/theaters/bookings" className="group">
                <div className="p-6 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer">
                  <Ticket className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">My Bookings</h3>
                  <p className="text-sm text-muted-foreground">
                    View your upcoming and past bookings
                  </p>
                </div>
              </Link>

              {/* Feature Highlight */}
              <div className="p-6 rounded-lg bg-primary/10 border border-primary/30">
                <Sparkles className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">Premium Features</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ IMAX & Dolby Atmos</li>
                  <li>✓ Seat selection</li>
                  <li>✓ Price comparison</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Popular Channels Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.55 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Popular Channels
                </CardTitle>
                <CardDescription>Join communities and discuss movies</CardDescription>
              </div>
              <Link href="/channels">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {channelsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="p-4 border rounded-lg animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-muted rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : channels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {channels.map((channel) => (
                  <Link
                    key={channel.id}
                    href={`/channel/${channel.slug}`}
                    className="p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {channel.icon && (
                        <div className="text-3xl">{channel.icon}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{channel.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {channel.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <UsersIcon className="w-3 h-3" />
                            {channel.member_count.toLocaleString()} members
                          </span>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            {channel.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No channels found</h3>
                <p className="text-muted-foreground mb-4">
                  Create or join channels to discuss movies with communities
                </p>
                <Link href="/channels">
                  <Button>Explore Channels</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Language & Region Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <LanguageSelector
          onLanguageChange={handleLanguageChange}
          onRegionChange={handleRegionChange}
        />
      </motion.div>

      {/* Recommended for You */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Trending Movies
                  {selectedLanguage && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      in {selectedLanguage.name} ({selectedRegion})
                    </span>
                  )}
                </CardTitle>
                <CardDescription>Popular movies trending in your region</CardDescription>
              </div>
              <Link href="/explore">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <MovieCardSkeleton key={i} />
                ))}
              </div>
            ) : trendingMovies.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {trendingMovies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No movies found</h3>
                <p className="text-muted-foreground mb-4">
                  Unable to load trending movies. Please check your TMDB API key.
                </p>
                <Link href="/explore">
                  <Button>Explore Movies</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Movie Feeds from X */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      >
        <TwitterFeedWidget limit={10} showHeader={true} />
      </motion.div>
    </div>
  )
}
