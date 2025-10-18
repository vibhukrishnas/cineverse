'use client'

import { ExternalLink, Music, Play } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Song {
  name: string
  artist: string
  duration?: string
  spotify?: string
  youtubeMusic?: string
  appleMusic?: string
  gaana?: string
  jiosaavn?: string
}

interface MovieSongsProps {
  movieTitle: string
  movieId: number
  songs?: Song[]
}

export function MovieSongs({ movieTitle, movieId, songs }: MovieSongsProps) {
  // For now, we'll generate search links
  // In a real implementation, you'd fetch actual soundtrack data
  const searchLinks = {
    spotify: `https://open.spotify.com/search/${encodeURIComponent(movieTitle + ' soundtrack')}`,
    youtubeMusic: `https://music.youtube.com/search?q=${encodeURIComponent(movieTitle + ' songs')}`,
    appleMusic: `https://music.apple.com/search?term=${encodeURIComponent(movieTitle + ' soundtrack')}`,
    gaana: `https://gaana.com/search/${encodeURIComponent(movieTitle)}`,
    jiosaavn: `https://www.jiosaavn.com/search/${encodeURIComponent(movieTitle)}`,
    amazonMusic: `https://music.amazon.com/search/${encodeURIComponent(movieTitle)}`,
  }

  const platforms = [
    {
      name: 'Spotify',
      url: searchLinks.spotify,
      icon: '/logos/spotify.svg',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      name: 'YouTube Music',
      url: searchLinks.youtubeMusic,
      icon: '/logos/youtube-music.svg',
      color: 'bg-red-600 hover:bg-red-700',
    },
    {
      name: 'Apple Music',
      url: searchLinks.appleMusic,
      icon: '/logos/apple-music.svg',
      color: 'bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700',
    },
    {
      name: 'Gaana',
      url: searchLinks.gaana,
      icon: '/logos/gaana.svg',
      color: 'bg-red-500 hover:bg-red-600',
    },
    {
      name: 'JioSaavn',
      url: searchLinks.jiosaavn,
      icon: '/logos/jiosaavn.svg',
      color: 'bg-teal-600 hover:bg-teal-700',
    },
    {
      name: 'Amazon Music',
      url: searchLinks.amazonMusic,
      icon: '/logos/amazon-music.svg',
      color: 'bg-blue-600 hover:bg-blue-700',
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
          Listen to the movie's soundtrack on your favorite streaming platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {platforms.map((platform) => (
            <Link
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                className={`w-full h-auto py-4 flex flex-col items-center gap-2 transition-all hover:scale-105 ${platform.color} text-white border-none`}
              >
                <Music className="h-5 w-5" />
                <span className="text-sm font-semibold">{platform.name}</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </Button>
            </Link>
          ))}
        </div>

        {songs && songs.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Track List
            </h4>
            {songs.map((song, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{song.name}</p>
                    <p className="text-sm text-muted-foreground">{song.artist}</p>
                  </div>
                </div>
                {song.duration && (
                  <span className="text-sm text-muted-foreground">{song.duration}</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-dashed">
          <p className="text-xs text-muted-foreground text-center">
            <Music className="inline h-3 w-3 mr-1" />
            Streaming links will open the platform's search for this movie's soundtrack
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
