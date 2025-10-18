import { NextResponse } from 'next/server'

/**
 * Get user location from IP address
 * Uses ip-api.com (free, no key required, 45 requests/minute)
 */
export async function GET(request: Request) {
  try {
    // Get user's IP from headers
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip')

    // Use ip-api.com for geolocation
    const response = await fetch(`http://ip-api.com/json/${ip || ''}?fields=status,message,country,countryCode,region,city,lat,lon,proxy,hosting`)
    
    if (!response.ok) {
      throw new Error('IP geolocation failed')
    }

    const data = await response.json()

    if (data.status === 'fail') {
      return NextResponse.json(
        { error: data.message || 'Failed to get location' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      city: data.city,
      region: data.region,
      country: data.country,
      countryCode: data.countryCode,
      lat: data.lat,
      lon: data.lon,
      proxy: data.proxy,
      hosting: data.hosting,
    })
  } catch (error) {
    console.error('IP location error:', error)
    return NextResponse.json(
      { error: 'Failed to determine location' },
      { status: 500 }
    )
  }
}
