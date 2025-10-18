import { NextRequest, NextResponse } from 'next/server'
import { getMovieWatchProviders } from '@/lib/ott/watch-providers'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const movieId = searchParams.get('movieId')
  const region = searchParams.get('region') || 'US'

  if (!movieId) {
    return NextResponse.json(
      { error: 'Movie ID is required' },
      { status: 400 }
    )
  }

  try {
    const providers = await getMovieWatchProviders(parseInt(movieId), region)
    
    if (!providers) {
      return NextResponse.json(
        { error: 'No providers found' },
        { status: 404 }
      )
    }

    return NextResponse.json(providers)
  } catch (error) {
    console.error('Error in watch providers API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch watch providers' },
      { status: 500 }
    )
  }
}
