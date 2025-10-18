'use server'

import { getMovieTrailers, getMovieReviews, getBehindTheScenes } from '@/lib/youtube/client'

export async function fetchMovieTrailers(movieTitle: string, year?: number) {
  try {
    const trailers = await getMovieTrailers(movieTitle, year)
    return {
      success: true,
      trailers
    }
  } catch (error) {
    console.error('Failed to fetch trailers:', error)
    return {
      success: false,
      trailers: []
    }
  }
}

export async function fetchMovieVideoReviews(movieTitle: string, year?: number) {
  try {
    const reviews = await getMovieReviews(movieTitle, year)
    return {
      success: true,
      reviews
    }
  } catch (error) {
    console.error('Failed to fetch video reviews:', error)
    return {
      success: false,
      reviews: []
    }
  }
}

export async function fetchBehindTheScenes(movieTitle: string, year?: number) {
  try {
    const videos = await getBehindTheScenes(movieTitle, year)
    return {
      success: true,
      videos
    }
  } catch (error) {
    console.error('Failed to fetch behind the scenes:', error)
    return {
      success: false,
      videos: []
    }
  }
}
