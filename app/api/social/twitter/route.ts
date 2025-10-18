import { NextRequest, NextResponse } from 'next/server'
import { searchMovieTweets, getTrendingMovieTweets } from '@/lib/social/twitter'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const movieTitle = searchParams.get('title')
    const movieYear = searchParams.get('year')
    const limit = parseInt(searchParams.get('limit') || '20')

    let tweets
    
    if (movieTitle) {
      // Search for specific movie
      tweets = await searchMovieTweets(
        movieTitle,
        movieYear ? parseInt(movieYear) : undefined,
        limit
      )
    } else {
      // Get trending movie tweets
      tweets = await getTrendingMovieTweets(limit)
    }

    return NextResponse.json({
      success: true,
      tweets,
      count: tweets.length
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error: any) {
    console.error('Error in Twitter API route:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch tweets',
      tweets: []
    }, { status: 500 })
  }
}
