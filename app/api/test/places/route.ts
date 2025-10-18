// Test endpoint for Google Places API
import { NextResponse } from 'next/server'
import { searchCinemas } from '@/lib/maps/places'

export async function GET() {
  try {
    // Test Places API with a general search
    const cinemas = await searchCinemas('AMC Theatres')
    
    if (cinemas && cinemas.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Google Places API is working!',
        cinemaCount: cinemas.length,
        firstCinema: {
          name: cinemas[0].name,
          address: cinemas[0].address,
          rating: cinemas[0].rating
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'No cinemas found'
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Google Places API test failed'
    })
  }
}
