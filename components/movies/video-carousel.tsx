'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Video {
  id: string
  key: string
  name: string
  type: string
  site: string
  official: boolean
}

interface VideoCarouselProps {
  videos: Video[]
  onVideoSelect?: (video: Video) => void
}

export function VideoCarousel({ videos, onVideoSelect }: VideoCarouselProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video)
    if (onVideoSelect) {
      onVideoSelect(video)
    }
  }

  const closePlayer = () => {
    setSelectedVideo(null)
  }

  // Filter YouTube videos only
  const youtubeVideos = videos.filter(v => v.site === 'YouTube')

  if (youtubeVideos.length === 0) {
    return null
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">All Videos ({youtubeVideos.length})</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {youtubeVideos.map((video) => (
            <Card
              key={video.id}
              className="group cursor-pointer overflow-hidden hover:ring-2 hover:ring-primary transition-all"
              onClick={() => handleVideoClick(video)}
            >
              <div className="relative aspect-video">
                <Image
                  src={`https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`}
                  alt={video.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    // Fallback to medium quality thumbnail
                    const target = e.target as HTMLImageElement
                    target.src = `https://img.youtube.com/vi/${video.key}/mqdefault.jpg`
                  }}
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-red-600 rounded-full p-3">
                    <Play className="h-6 w-6 text-white fill-current" />
                  </div>
                </div>

                {/* Video Type Badge */}
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 left-2 text-xs"
                >
                  {video.type}
                </Badge>

                {/* Official Badge */}
                {video.official && (
                  <Badge 
                    variant="default" 
                    className="absolute top-2 right-2 text-xs bg-blue-600"
                  >
                    Official
                  </Badge>
                )}
              </div>

              <div className="p-3">
                <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {video.name}
                </h4>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closePlayer}
        >
          <div 
            className="relative w-full max-w-6xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              className="w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${selectedVideo.key}?autoplay=1`}
              title={selectedVideo.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            
            <Button
              variant="secondary"
              size="icon"
              className="absolute -top-12 right-0"
              onClick={closePlayer}
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
