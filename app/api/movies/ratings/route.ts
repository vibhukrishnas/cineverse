import { NextResponse } from 'next/server'

const OMDB_API_KEY = 'YOUR_OMDB_KEY' // Will use free tier or existing key

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const imdbId = searchParams.get('imdbId')
    const title = searchParams.get('title')
    const year = searchParams.get('year')

    if (!imdbId && !title) {
      return NextResponse.json({ error: 'imdbId or title required' }, { status: 400 })
    }

    // Build OMDB API URL
    let omdbUrl = `http://www.omdbapi.com/?apikey=adf1f2d7` // Using public OMDB key
    
    if (imdbId) {
      omdbUrl += `&i=${imdbId}`
    } else {
      omdbUrl += `&t=${encodeURIComponent(title!)}`
      if (year) {
        omdbUrl += `&y=${year}`
      }
    }

    console.log('Fetching OMDB data:', omdbUrl)

    const response = await fetch(omdbUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    const data = await response.json()

    if (data.Response === 'False') {
      return NextResponse.json({ 
        error: data.Error,
        imdbRating: null,
        rottenTomatoes: null,
        metacritic: null
      })
    }

    // Extract ratings
    const imdbRating = data.imdbRating !== 'N/A' ? data.imdbRating : null
    const rottenTomatoes = data.Ratings?.find((r: any) => r.Source === 'Rotten Tomatoes')?.Value || null
    const metacritic = data.Metascore !== 'N/A' ? data.Metascore : null

    return NextResponse.json({
      imdbRating,
      rottenTomatoes,
      metacritic,
      imdbVotes: data.imdbVotes,
      imdbId: data.imdbID,
    })
  } catch (error) {
    console.error('OMDB API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    )
  }
}
