'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TrailerHeroProps {
  trailerKey?: string
  movieTitle: string
  backdropUrl?: string
}

export function TrailerHero({ trailerKey, movieTitle, backdropUrl }: TrailerHeroProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [opacity, setOpacity] = useState(1)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)

  useEffect(() => {
    // Load YouTube IFrame API
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    // Initialize player when API is ready
    ;(window as any).onYouTubeIframeAPIReady = () => {
      if (trailerKey) {
        playerRef.current = new (window as any).YT.Player('trailer-player', {
          videoId: trailerKey,
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            showinfo: 0,
            modestbranding: 1,
            loop: 1,
            playlist: trailerKey,
            rel: 0,
          },
          events: {
            onReady: (event: any) => {
              event.target.playVideo()
            },
          },
        })
      }
    }

    // Handle scroll to pause/fade video
    const handleScroll = () => {
      if (!videoContainerRef.current) return

      const rect = videoContainerRef.current.getBoundingClientRect()
      const scrolled = window.scrollY
      const windowHeight = window.innerHeight

      // Calculate fade effect based on scroll
      if (scrolled > 100) {
        const fadeAmount = Math.min(scrolled / 500, 1)
        setOpacity(1 - fadeAmount)

        // Pause video when mostly scrolled
        if (fadeAmount > 0.7 && playerRef.current && isPlaying) {
          playerRef.current.pauseVideo()
          setIsPlaying(false)
        }
      } else {
        setOpacity(1)
        // Resume playing when scrolled back to top
        if (playerRef.current && !isPlaying) {
          playerRef.current.playVideo()
          setIsPlaying(true)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (playerRef.current) {
        playerRef.current.destroy()
      }
    }
  }, [trailerKey, isPlaying])

  const togglePlay = () => {
    if (!playerRef.current) return

    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    if (!playerRef.current) return

    if (isMuted) {
      playerRef.current.unMute()
    } else {
      playerRef.current.mute()
    }
    setIsMuted(!isMuted)
  }

  const goFullscreen = () => {
    const iframe = document.getElementById('trailer-player')
    if (iframe) {
      const requestFullscreen = iframe.requestFullscreen || (iframe as any).webkitRequestFullscreen
      requestFullscreen.call(iframe)
    }
  }

  if (!trailerKey) {
    return (
      <div
        className="relative w-full h-[70vh] bg-cover bg-center"
        style={{ backgroundImage: `url(${backdropUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>
    )
  }

  return (
    <div ref={videoContainerRef} className="relative w-full h-[70vh] overflow-hidden bg-black">
      {/* YouTube Player */}
      <div
        className="absolute inset-0 w-full h-full transition-opacity duration-300"
        style={{ opacity }}
      >
        <div
          id="trailer-player"
          className="w-full h-full"
          style={{
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80 pointer-events-none" />

      {/* Video Controls */}
      <div className="absolute bottom-8 right-8 flex items-center gap-2 z-10">
        <Button
          size="icon"
          variant="secondary"
          onClick={togglePlay}
          className="bg-black/60 hover:bg-black/80 backdrop-blur-sm"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <Button
          size="icon"
          variant="secondary"
          onClick={toggleMute}
          className="bg-black/60 hover:bg-black/80 backdrop-blur-sm"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>

        <Button
          size="icon"
          variant="secondary"
          onClick={goFullscreen}
          className="bg-black/60 hover:bg-black/80 backdrop-blur-sm"
        >
          <Maximize className="h-4 w-4" />
        </Button>
      </div>

      {/* Movie Title Overlay */}
      <div className="absolute bottom-8 left-8 z-10">
        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl">
          {movieTitle}
        </h1>
        <p className="text-sm text-white/80 mt-2">Official Trailer</p>
      </div>

      {/* Scroll Indicator */}
      {opacity > 0.5 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-xs animate-bounce">
          Scroll down to explore
        </div>
      )}
    </div>
  )
}
