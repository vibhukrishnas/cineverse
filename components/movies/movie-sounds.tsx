'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Music, Play, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'

interface Song {
  id: string
  title: string
  thumbnail: string
  channelTitle: string
  youtubeUrl: string
}

interface MovieSoundsProps {
  movieTitle: string
  movieId: number
}

export function MovieSounds({ movieTitle, movieId }: MovieSoundsProps) {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch(`/api/movies/soundtrack?title=${encodeURIComponent(movieTitle)}&id=${movieId}`)
        const data = await response.json()
        
        if (data.songs) {
          setSongs(data.songs)
        }
      } catch (err) {
        console.error('Failed to fetch soundtrack:', err)
        setError('Failed to load soundtrack')
      } finally {
        setLoading(false)
      }
    }

    fetchSongs()
  }, [movieTitle, movieId])

  const streamingPlatforms = [
    {
      name: 'Spotify',
      url: `https://open.spotify.com/search/${encodeURIComponent(movieTitle + ' soundtrack')}`,
      color: 'bg-green-600 hover:bg-green-700',
      icon: '🎵'
    },
    {
      name: 'YouTube Music',
      url: `https://music.youtube.com/search?q=${encodeURIComponent(movieTitle + ' songs')}`,
      color: 'bg-red-600 hover:bg-red-700',
      icon: '▶️'
    },
    {
      name: 'Apple Music',
      url: `https://music.apple.com/search?term=${encodeURIComponent(movieTitle + ' soundtrack')}`,
      color: 'bg-pink-600 hover:bg-pink-700',
      icon: '🎧'
    },
    {
      name: 'Gaana',
      url: `https://gaana.com/search/${encodeURIComponent(movieTitle)}`,
      color: 'bg-red-500 hover:bg-red-600',
      icon: '🎶'
    },
    {
      name: 'JioSaavn',
      url: `https://www.jiosaavn.com/search/${encodeURIComponent(movieTitle)}`,
      color: 'bg-teal-600 hover:bg-teal-700',
      icon: '🎼'
    },
    {
      name: 'Amazon Music',
      url: `https://music.amazon.com/search/${encodeURIComponent(movieTitle)}`,
      color: 'bg-blue-600 hover:bg-blue-700',
      icon: '🎵'
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Soundtrack & Songs
        </CardTitle>
        <CardDescription>
          Listen to the movie's soundtrack on your favorite platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Streaming Platform Links */}
        <div>
          <h3 className="text-sm font-medium mb-3">Listen on</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {streamingPlatforms.map((platform) => (
              <Link
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  className={`w-full ${platform.color} text-white border-none hover:scale-105 transition-transform`}
                  size="sm"
                >
                  <span className="mr-1">{platform.icon}</span>
                  {platform.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* YouTube Soundtrack Results */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading soundtrack...</span>
          </div>
        ) : songs.length > 0 ? (
          <div>
            <h3 className="text-sm font-medium mb-3">Popular Songs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {songs.slice(0, 6).map((song) => (
                <Link
                  key={song.id}
                  href={song.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={song.thumbnail}
                      alt={song.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                      <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="white" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {song.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {song.channelTitle}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No soundtrack available</p>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground mt-4">
          🎵 Streaming links will open the platform's search for this movie's soundtrack
        </p>
      </CardContent>
    </Card>
  )
}
