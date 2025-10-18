// Test endpoint for Gemini AI API
import { NextResponse } from 'next/server'
import { chatWithAI } from '@/lib/ai/gemini'

export async function GET() {
  try {
    // Test simple AI chat
    const response = await chatWithAI('Recommend a good sci-fi movie')
    
    if (response) {
      return NextResponse.json({
        success: true,
        message: 'Gemini AI is working!',
        response: response
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'No response from Gemini AI'
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Gemini AI test failed'
    })
  }
}
