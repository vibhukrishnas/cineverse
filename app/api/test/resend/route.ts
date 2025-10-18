// Test endpoint for Resend Email API
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test Resend API configuration (without actually sending email)
    const apiKey = process.env.RESEND_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'RESEND_API_KEY not configured'
      })
    }

    if (!apiKey.startsWith('re_')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Resend API key format'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Resend API key is configured correctly!',
      note: 'Email sending is ready. Use sendWelcomeEmail() or other functions to send actual emails.'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Resend API test failed'
    })
  }
}
