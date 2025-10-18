'use client'

import { useState, useEffect } from 'react'
import { Play, Volume2, VolumeX, Maximize, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Video {
  id: string
  key: string
  name: string
  type: string
  site: string
  official: boolean
}

interface VideoHeroProps {
  videos: Video[]
  movieTitle: string
}

export function VideoHero({ videos, movieTitle }: VideoHeroProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)

  // Filter for trailers and teasers, prioritize official content
  const relevantVideos = videos
    .filter(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser' || v.type === 'Clip'))
    .sort((a, b) => {
      if (a.official && !b.official) return -1
      if (!a.official && b.official) return 1
      if (a.type === 'Trailer' && b.type !== 'Trailer') return -1
      if (a.type !== 'Trailer' && b.type === 'Trailer') return 1
      return 0
    })

  const currentVideo = relevantVideos[currentVideoIndex]

  const nextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % relevantVideos.length)
  }

  const previousVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + relevantVideos.length) % relevantVideos.length)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const playVideo = () => {
    setIsPlaying(true)
    setIsMuted(false)
  }

  if (!currentVideo) {
    return null
  }

  return (
    <div className="relative w-full h-[80vh] min-h-[600px] bg-black">
      {/* Video Player */}
      <div className="absolute inset-0">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${currentVideo.key}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&rel=0&showinfo=0&modestbranding=1&loop=1&playlist=${currentVideo.key}`}
          title={currentVideo.name}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-transparent pointer-events-none" />

      {/* Video Info Overlay - Bottom Left */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
        <div className="max-w-3xl space-y-4">
          <Badge variant="secondary" className="mb-2">
            {currentVideo.type} {currentVideo.official && '• Official'}
          </Badge>
          <h2 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg">
            {movieTitle}
          </h2>
          <p className="text-lg text-white/90 drop-shadow-md">
            {currentVideo.name}
          </p>

          {/* Play Button */}
          {!isPlaying && (
            <Button
              size="lg"
              onClick={playVideo}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <Play className="h-5 w-5 fill-current" />
              Play {currentVideo.type}
            </Button>
          )}
        </div>
      </div>

      {/* Video Controls - Top Right */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <Button
          size="icon"
          variant="secondary"
          className="bg-black/50 hover:bg-black/70 backdrop-blur"
          onClick={toggleMute}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5 text-white" />
          ) : (
            <Volume2 className="h-5 w-5 text-white" />
          )}
        </Button>

        <Button
          size="icon"
          variant="secondary"
          className="bg-black/50 hover:bg-black/70 backdrop-blur"
          onClick={() => window.open(`https://www.youtube.com/watch?v=${currentVideo.key}`, '_blank')}
        >
          <Maximize className="h-5 w-5 text-white" />
        </Button>
      </div>

      {/* Video Navigation */}
      {relevantVideos.length > 1 && (
        <>
          <Button
            size="icon"
            variant="secondary"
            className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur"
            onClick={previousVideo}
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </Button>

          <Button
            size="icon"
            variant="secondary"
            className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur"
            onClick={nextVideo}
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </Button>

          {/* Video Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {relevantVideos.map((_, index) => (
              <button
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentVideoIndex
                    ? 'w-8 bg-white'
                    : 'w-1.5 bg-white/50 hover:bg-white/75'
                }`}
                onClick={() => setCurrentVideoIndex(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
