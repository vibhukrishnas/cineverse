import { NextRequest, NextResponse } from 'next/server'
import { syncAllChannels, syncChannelTweets } from '@/app/actions/twitter-sync'

// API route to trigger Twitter sync
// Can be called by cron jobs or manually

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (for security)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { channelSlug, maxTweets } = body

    let result
    if (channelSlug) {
      // Sync specific channel
      result = await syncChannelTweets(channelSlug, maxTweets || 5)
    } else {
      // Sync all channels
      result = await syncAllChannels(maxTweets || 3)
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('❌ Twitter sync API error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint for status check
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      status: 'ok',
      service: 'Twitter Auto-Sync',
      message: 'Ready to sync tweets'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
