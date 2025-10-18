'use client'

import { useEffect, useState } from 'react'
import { Play, ThumbsUp, Eye, Loader2, Youtube } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchMovieTrailers, fetchMovieVideoReviews, fetchBehindTheScenes } from '@/app/actions/youtube'
import { analytics } from '@/lib/analytics/posthog'

interface YouTubeVideo {
  videoId: string
  title: string
  description: string
  thumbnail: string
  channelTitle: string
  publishedAt: string
  viewCount: number
  likeCount: number
  duration: string
}

interface TrailerSectionProps {
  movieTitle: string
  movieId: number
  releaseYear?: number
}

export function TrailerSection({ movieTitle, movieId, releaseYear }: TrailerSectionProps) {
  const [activeTab, setActiveTab] = useState('trailers')
  const [trailers, setTrailers] = useState<YouTubeVideo[]>([])
  const [reviews, setReviews] = useState<YouTubeVideo[]>([])
  const [behindScenes, setBehindScenes] = useState<YouTubeVideo[]>([])
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadContent()
  }, [movieTitle])

  const loadContent = async () => {
    try {
      setLoading(true)
      
      // Load trailers by default
      const trailersResult = await fetchMovieTrailers(movieTitle, releaseYear)
      if (trailersResult.success) {
        setTrailers(trailersResult.trailers)
        if (trailersResult.trailers.length > 0) {
          setSelectedVideo(trailersResult.trailers[0])
        }
      }
    } catch (error) {
      console.error('Failed to load content:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    if (reviews.length > 0) return
    
    try {
      const result = await fetchMovieVideoReviews(movieTitle, releaseYear)
      if (result.success) {
        setReviews(result.reviews)
      }
    } catch (error) {
      console.error('Failed to load reviews:', error)
    }
  }

  const loadBehindScenes = async () => {
    if (behindScenes.length > 0) return
    
    try {
      const result = await fetchBehindTheScenes(movieTitle, releaseYear)
      if (result.success) {
        setBehindScenes(result.videos)
      }
    } catch (error) {
      console.error('Failed to load behind the scenes:', error)
    }
  }

  const handleVideoClick = (video: YouTubeVideo) => {
    setSelectedVideo(video)
    analytics.trailerPlayed(movieId, video.videoId)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            Videos & Trailers
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (trailers.length === 0) {
    return null // Don't show section if no trailers available
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-500" />
          Videos & Trailers
        </CardTitle>
        <CardDescription>Watch trailers, reviews, and behind-the-scenes content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Video Player */}
        {selectedVideo && (
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${selectedVideo.videoId}`}
              title={selectedVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        )}

        {/* Tabs for different content types */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="trailers" className="flex-1">
              Trailers ({trailers.length})
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="flex-1"
              onClick={loadReviews}
            >
              Video Reviews
            </TabsTrigger>
            <TabsTrigger 
              value="behind" 
              className="flex-1"
              onClick={loadBehindScenes}
            >
              Behind the Scenes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trailers" className="space-y-2 mt-4">
            {trailers.map((video) => (
              <VideoCard
                key={video.videoId}
                video={video}
                isSelected={selectedVideo?.videoId === video.videoId}
                onClick={() => handleVideoClick(video)}
                formatNumber={formatNumber}
              />
            ))}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-2 mt-4">
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading reviews...
              </div>
            ) : (
              reviews.map((video) => (
                <VideoCard
                  key={video.videoId}
                  video={video}
                  isSelected={selectedVideo?.videoId === video.videoId}
                  onClick={() => handleVideoClick(video)}
                  formatNumber={formatNumber}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="behind" className="space-y-2 mt-4">
            {behindScenes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading content...
              </div>
            ) : (
              behindScenes.map((video) => (
                <VideoCard
                  key={video.videoId}
                  video={video}
                  isSelected={selectedVideo?.videoId === video.videoId}
                  onClick={() => handleVideoClick(video)}
                  formatNumber={formatNumber}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function VideoCard({ 
  video, 
  isSelected, 
  onClick, 
  formatNumber 
}: { 
  video: YouTubeVideo
  isSelected: boolean
  onClick: () => void
  formatNumber: (num: number) => string
}) {
  return (
    <div
      onClick={onClick}
      className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-primary/10 border-2 border-primary' 
          : 'bg-muted/50 hover:bg-muted border-2 border-transparent'
      }`}
    >
      <div className="relative flex-shrink-0 w-32 h-20 rounded overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
          <Play className="h-6 w-6 text-white" fill="white" />
        </div>
        <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-xs rounded">
          {video.duration}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm line-clamp-2 mb-1">{video.title}</h4>
        <p className="text-xs text-muted-foreground mb-2">{video.channelTitle}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatNumber(video.viewCount)}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            {formatNumber(video.likeCount)}
          </span>
        </div>
      </div>
    </div>
  )
}
