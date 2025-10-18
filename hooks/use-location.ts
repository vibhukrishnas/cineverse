import { useState, useEffect } from 'react'
import {
  getLocation,
  getBrowserLocation,
  getIPLocation,
  saveLocation,
  LocationData,
  GeolocationError,
} from '@/lib/location/geolocation'

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<GeolocationError | null>(null)

  useEffect(() => {
    loadLocation()
  }, [])

  const loadLocation = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const loc = await getLocation()
      setLocation(loc)
    } catch (err) {
      console.error('Error loading location:', err)
    } finally {
      setLoading(false)
    }
  }

  const requestBrowserLocation = async () => {
    setLoading(true)
    setError(null)
    
    const result = await getBrowserLocation()
    
    if ('lat' in result) {
      setLocation(result)
      saveLocation(result)
    } else {
      setError(result)
    }
    
    setLoading(false)
  }

  const useIPLocation = async () => {
    setLoading(true)
    setError(null)
    
    const result = await getIPLocation()
    setLocation(result)
    saveLocation(result)
    
    setLoading(false)
  }

  const setManualLocation = (newLocation: LocationData) => {
    setLocation(newLocation)
    saveLocation(newLocation)
    setError(null)
  }

  const refresh = () => {
    loadLocation()
  }

  return {
    location,
    loading,
    error,
    requestBrowserLocation,
    useIPLocation,
    setManualLocation,
    refresh,
  }
}
