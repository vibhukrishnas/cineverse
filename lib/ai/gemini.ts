// Google Gemini AI Client
// Provides: AI recommendations, review summaries, content moderation

import { GoogleGenerativeAI } from '@google/generative-ai'

// Use environment variable with fallback
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''

// Only initialize if API key is available
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null

// Check if Gemini is available
export function isGeminiAvailable(): boolean {
  return genAI !== null && GEMINI_API_KEY.length > 0
}

export interface MovieRecommendation {
  title: string
  tmdbId: number
  reason: string
  similarity: number
}

export interface ReviewSummary {
  summary: string
  sentiment: 'positive' | 'negative' | 'mixed'
  keyPoints: string[]
  averageRating: number
}

// Generate personalized movie recommendations with genre filtering
export async function getAIRecommendations(
  userHistory: { movieId: number; title: string; rating?: number }[],
  preferences?: string,
  genres?: string[]
): Promise<MovieRecommendation[]> {
  try {
    if (!genAI) {
      console.warn('⚠️ Gemini AI not available - API key missing')
      return []
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const genreFilter = genres && genres.length > 0 
      ? `\nPrefer these genres: ${genres.join(', ')}` 
      : ''

    const prompt = `Based on this user's movie history:
${userHistory.map(m => `- ${m.title}${m.rating ? ` (rated ${m.rating}/5)` : ''}`).join('\n')}

${preferences ? `User preferences: ${preferences}` : ''}${genreFilter}

Recommend 5 movies they would enjoy. For each recommendation, provide:
1. Movie title
2. Brief reason why they'd like it (1-2 sentences)
3. Similarity score (0-100)

Format as JSON array with structure: {title, reason, similarity}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Parse AI response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return []
  } catch (error) {
    console.error('Gemini AI recommendation error:', error)
    return []
  }
}

// Summarize multiple reviews into key insights
export async function summarizeReviews(
  reviews: { content: string; rating: number; helpful: number }[]
): Promise<ReviewSummary> {
  try {
    if (!genAI) {
      console.warn('⚠️ Gemini AI not available - API key missing')
      return {
        summary: 'AI summarization unavailable',
        sentiment: 'mixed',
        keyPoints: [],
        averageRating: 3
      }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const reviewsText = reviews.map((r, i) => 
      `Review ${i + 1} (${r.rating}/5, ${r.helpful} helpful): ${r.content}`
    ).join('\n\n')

    const prompt = `Analyze these movie reviews and provide:
1. A concise 2-3 sentence summary of overall opinion
2. Overall sentiment (positive/negative/mixed)
3. 3-5 key points mentioned across reviews
4. Average sentiment-adjusted rating

Reviews:
${reviewsText}

Format as JSON: {summary, sentiment, keyPoints: string[], averageRating: number}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return {
      summary: 'Unable to generate summary',
      sentiment: 'mixed',
      keyPoints: [],
      averageRating: 3
    }
  } catch (error) {
    console.error('Gemini AI summary error:', error)
    return {
      summary: 'Unable to generate summary',
      sentiment: 'mixed',
      keyPoints: [],
      averageRating: 3
    }
  }
}

// Natural language movie search
export async function searchMoviesWithAI(query: string): Promise<string[]> {
  try {
    if (!genAI) {
      console.warn('⚠️ Gemini AI not available - API key missing')
      return []
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `User query: "${query}"

Interpret this natural language query and suggest 5-10 relevant movie titles that match.
For example:
- "Movies like Inception but less confusing" → suggest similar but more straightforward films
- "Funny but not too silly" → suggest smart comedies
- "Good date night movies" → suggest romantic comedies or romantic dramas

Return only a JSON array of movie titles: ["Title 1", "Title 2", ...]`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return []
  } catch (error) {
    console.error('Gemini AI search error:', error)
    return []
  }
}

// Moderate content (detect spam, inappropriate content, spoilers)
export async function moderateContent(
  content: string,
  type: 'review' | 'comment' | 'post'
): Promise<{
  isAppropriate: boolean
  hasSpoilers: boolean
  isSpam: boolean
  reason?: string
}> {
  try {
    if (!genAI) {
      console.warn('⚠️ Gemini AI not available - API key missing')
      return {
        isAppropriate: true,
        hasSpoilers: false,
        isSpam: false
      }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Analyze this ${type} content for:
1. Inappropriate content (hate speech, harassment, explicit content)
2. Spoilers (plot reveals without warning)
3. Spam (promotional, irrelevant, low-quality)

Content: "${content}"

Return JSON: {isAppropriate: boolean, hasSpoilers: boolean, isSpam: boolean, reason?: string}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return {
      isAppropriate: true,
      hasSpoilers: false,
      isSpam: false
    }
  } catch (error) {
    console.error('Gemini AI moderation error:', error)
    return {
      isAppropriate: true,
      hasSpoilers: false,
      isSpam: false
    }
  }
}

// Movie chatbot assistant
export async function chatWithAI(
  message: string,
  context?: string[]
): Promise<string> {
  try {
    if (!genAI) {
      console.warn('⚠️ Gemini AI not available - API key missing')
      return 'AI chat is currently unavailable. Please check your API key configuration.'
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const contextStr = context && context.length > 0 
      ? `Previous conversation:\n${context.join('\n')}\n\n` 
      : ''

    const prompt = `${contextStr}You are a helpful movie recommendation assistant for CineVerse. 
User: ${message}

Provide a helpful, conversational response about movies. Be concise (2-3 sentences) and suggest specific movies when relevant.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Gemini AI chat error:', error)
    return 'Sorry, I encountered an error. Please try again.'
  }
}

// Get personalized movie recommendations based on user preferences
export async function getPersonalizedRecommendations(
  watchHistory: any[],
  preferences?: any,
  limit: number = 12,
  language?: string
) {
  try {
    if (!genAI) {
      console.warn('⚠️ Gemini AI not available - using TMDB fallback')
      return await getTMDBFallbackRecommendations(preferences?.preferred_genres || [], limit, language)
    }

    console.log(`🤖 Gemini AI: Generating ${limit} recommendations for genres: ${preferences?.preferred_genres?.join(', ') || 'all'}, language: ${language || 'all'}`)
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const genreList = preferences?.preferred_genres?.join(', ') || 'all genres'
    const historyText = watchHistory?.length > 0
      ? watchHistory.map(m => `- ${m.movie_title}${m.rating ? ` (rated ${m.rating}/5)` : ''}`).join('\n')
      : 'No watch history yet'

    const languageContext = language && language !== 'en' 
      ? `\n\nIMPORTANT: Focus on ${language.toUpperCase()} language cinema. Include movies with popular actors, actresses, directors, and music directors from ${language.toUpperCase()} film industry. This should be the PRIMARY focus.`
      : ''

    const prompt = `You are an expert movie recommendation system. Based on the user's preferences, recommend ${limit} diverse, high-quality movies.

User's preferred genres: ${genreList}
User's watch history:
${historyText}${languageContext}

Provide a diverse mix of:
- Recent releases (last 2 years)
- Classic films
- Hidden gems
- Critically acclaimed movies
- Popular crowd-pleasers
${language && language !== 'en' ? `- Movies from ${language.toUpperCase()} film industry with renowned actors/directors` : ''}

Ensure variety in:
- Release years (mix of old and new)
- Different sub-genres within selected genres
- ${language && language !== 'en' ? `${language.toUpperCase()} cinema` : 'International and Hollywood films'}
- Different moods and tones

For each recommendation, provide ONLY the exact movie title as it appears in TMDB (The Movie Database).
Format as a simple JSON array of strings: ["Movie Title 1", "Movie Title 2", ...]

IMPORTANT: Use exact titles that will match TMDB search results.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log(`📥 Gemini AI raw response (first 200 chars): ${text.substring(0, 200)}...`)
    
    // Parse AI response
    const jsonMatch = text.match(/\[[\s\S]*?\]/)
    if (!jsonMatch) {
      console.error('❌ Failed to parse AI response - no JSON array found')
      console.error('Full response:', text)
      return []
    }

    const movieTitles = JSON.parse(jsonMatch[0])
    console.log(`📝 Parsed ${movieTitles.length} movie titles from AI:`, movieTitles.slice(0, 3))
    
    // Fetch actual movie data from TMDB
    const TMDB_API_KEY = '9d1a0985764201bee0eb1602d8214ed9'
    const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
    
    console.log(`🎬 Fetching TMDB data for ${movieTitles.length} movies...`)
    
    const moviePromises = movieTitles.map(async (title: string) => {
      try {
        const searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&include_adult=false`
        const searchResponse = await fetch(searchUrl)
        const searchData = await searchResponse.json()
        
        if (searchData.results && searchData.results.length > 0) {
          // Return the best match (first result)
          return searchData.results[0]
        }
        console.warn(`⚠️ No TMDB results for: ${title}`)
        return null
      } catch (error) {
        console.error(`❌ Failed to fetch movie: ${title}`, error)
        return null
      }
    })
    
    const movies = await Promise.all(moviePromises)
    const validMovies = movies.filter(movie => movie !== null)
    
    console.log(`✅ Successfully fetched ${validMovies.length}/${movieTitles.length} movies from TMDB`)
    return validMovies
  } catch (error) {
    console.error('❌ Gemini personalized recommendations error:', error)
    // Fallback to TMDB-based recommendations
    return await getTMDBFallbackRecommendations(preferences?.preferred_genres || [], limit, language)
  }
}

// Fallback: Direct TMDB recommendations when Gemini is unavailable
async function getTMDBFallbackRecommendations(genres: string[], limit: number = 12, language?: string) {
  try {
    console.log(`🎯 Using TMDB fallback for genres: ${genres.join(', ')}, language: ${language || 'all'}`)
    
    const TMDB_API_KEY = '9d1a0985764201bee0eb1602d8214ed9'
    const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
    
    // Map genre names to TMDB IDs
    const genreMap: Record<string, number> = {
      'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35, 'Crime': 80,
      'Documentary': 99, 'Drama': 18, 'Family': 10751, 'Fantasy': 14, 'History': 36,
      'Horror': 27, 'Music': 10402, 'Mystery': 9648, 'Romance': 10749, 
      'Science Fiction': 878, 'TV Movie': 10770, 'Thriller': 53, 'War': 10752, 'Western': 37
    }
    
    const genreIds = genres
      .map(g => genreMap[g])
      .filter(id => id !== undefined)
      .join(',')
    
    // Language mapping for TMDB
    const languageCode = language || 'en'
    
    // Fetch discover movies with language and genre filters
    const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&sort_by=vote_count.desc&with_genres=${genreIds}&with_original_language=${languageCode}&vote_average.gte=6&page=1`
    
    console.log(`📡 Fetching from TMDB: ${url}`)
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.results && data.results.length > 0) {
      const movies = data.results.slice(0, limit)
      console.log(`✅ TMDB fallback returned ${movies.length} movies`)
      return movies
    }
    
    console.warn('⚠️ No TMDB results, returning empty array')
    return []
  } catch (error) {
    console.error('❌ TMDB fallback error:', error)
    return []
  }
}
