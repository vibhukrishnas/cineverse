// Test endpoint for YouTube API
import { NextResponse } from 'next/server'
import { getMovieTrailers } from '@/lib/youtube/client'

export async function GET() {
  try {
    // Test YouTube API with a popular movie
    const trailers = await getMovieTrailers('Inception', 2010)
    
    if (trailers && trailers.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'YouTube API is working!',
        trailerCount: trailers.length,
        firstTrailer: {
          title: trailers[0].title,
          videoId: trailers[0].videoId,
          views: trailers[0].viewCount
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'No trailers found'
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'YouTube API test failed'
    })
  }
}
