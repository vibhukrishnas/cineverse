import { NextResponse } from 'next/server'

const YOUTUBE_API_KEY = 'AIzaSyDTrzX4J3k8jUGJD0GQIU4dTttT5aEXU9I'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const movieTitle = searchParams.get('title')
    const movieId = searchParams.get('id')

    if (!movieTitle) {
      return NextResponse.json({ error: 'Movie title required' }, { status: 400 })
    }

    // Fetch soundtrack videos from YouTube
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(movieTitle + ' soundtrack audio songs')}&type=video&videoCategoryId=10&maxResults=10&key=${YOUTUBE_API_KEY}`
    
    console.log('Fetching soundtrack from YouTube...')
    
    const response = await fetch(youtubeUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    const data = await response.json()

    if (!data.items) {
      return NextResponse.json({ songs: [] })
    }

    // Format songs data
    const songs = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }))

    return NextResponse.json({ songs })
  } catch (error) {
    console.error('Soundtrack API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch soundtrack', songs: [] },
      { status: 500 }
    )
  }
}
