// YouTube Data API Client for CineVerse
// Provides: Trailers, video reviews, behind-the-scenes content

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

export interface YouTubeVideo {
  videoId: string
  title: string
  description: string
  thumbnail: string
  channelTitle: string
  publishedAt: string
  viewCount: number
  likeCount: number
  duration: string
}

// Search for movie trailers
export async function getMovieTrailers(
  movieTitle: string,
  year?: number
): Promise<YouTubeVideo[]> {
  try {
    const query = `${movieTitle}${year ? ` ${year}` : ''} official trailer`
    
    const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&videoCategoryId=1&key=${YOUTUBE_API_KEY}`
    
    const response = await fetch(searchUrl)
    const data = await response.json()
    
    if (!data.items) return []
    
    // Get video details (views, likes, duration)
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',')
    const detailsUrl = `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    
    const detailsResponse = await fetch(detailsUrl)
    const detailsData = await detailsResponse.json()
    
    return detailsData.items.map((item: any) => ({
      videoId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      viewCount: parseInt(item.statistics.viewCount || '0'),
      likeCount: parseInt(item.statistics.likeCount || '0'),
      duration: parseDuration(item.contentDetails.duration)
    }))
  } catch (error) {
    console.error('YouTube API error:', error)
    return []
  }
}

// Get video reviews for a movie
export async function getMovieReviews(
  movieTitle: string,
  year?: number
): Promise<YouTubeVideo[]> {
  try {
    const query = `${movieTitle}${year ? ` ${year}` : ''} movie review`
    
    const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&videoCategoryId=1&order=relevance&key=${YOUTUBE_API_KEY}`
    
    const response = await fetch(searchUrl)
    const data = await response.json()
    
    if (!data.items) return []
    
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',')
    const detailsUrl = `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    
    const detailsResponse = await fetch(detailsUrl)
    const detailsData = await detailsResponse.json()
    
    return detailsData.items.map((item: any) => ({
      videoId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      viewCount: parseInt(item.statistics.viewCount || '0'),
      likeCount: parseInt(item.statistics.likeCount || '0'),
      duration: parseDuration(item.contentDetails.duration)
    }))
  } catch (error) {
    console.error('YouTube API error:', error)
    return []
  }
}

// Get behind-the-scenes content
export async function getBehindTheScenes(
  movieTitle: string,
  year?: number
): Promise<YouTubeVideo[]> {
  try {
    const query = `${movieTitle}${year ? ` ${year}` : ''} behind the scenes making of`
    
    const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&videoCategoryId=1&key=${YOUTUBE_API_KEY}`
    
    const response = await fetch(searchUrl)
    const data = await response.json()
    
    if (!data.items) return []
    
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',')
    const detailsUrl = `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    
    const detailsResponse = await fetch(detailsUrl)
    const detailsData = await detailsResponse.json()
    
    return detailsData.items.map((item: any) => ({
      videoId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      viewCount: parseInt(item.statistics.viewCount || '0'),
      likeCount: parseInt(item.statistics.likeCount || '0'),
      duration: parseDuration(item.contentDetails.duration)
    }))
  } catch (error) {
    console.error('YouTube API error:', error)
    return []
  }
}

// Parse ISO 8601 duration to readable format
function parseDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return '0:00'
  
  const hours = (match[1] || '').replace('H', '')
  const minutes = (match[2] || '0M').replace('M', '')
  const seconds = (match[3] || '0S').replace('S', '')
  
  if (hours) {
    return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
  }
  return `${minutes}:${seconds.padStart(2, '0')}`
}

// Get trending movie videos
export async function getTrendingMovieVideos(): Promise<YouTubeVideo[]> {
  try {
    const searchUrl = `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails&chart=mostPopular&videoCategoryId=1&maxResults=10&regionCode=US&key=${YOUTUBE_API_KEY}`
    
    const response = await fetch(searchUrl)
    const data = await response.json()
    
    if (!data.items) return []
    
    return data.items.map((item: any) => ({
      videoId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      viewCount: parseInt(item.statistics.viewCount || '0'),
      likeCount: parseInt(item.statistics.likeCount || '0'),
      duration: parseDuration(item.contentDetails.duration)
    }))
  } catch (error) {
    console.error('YouTube API error:', error)
    return []
  }
}
