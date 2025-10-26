'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { City } from '@/types/theater'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { X } from 'lucide-react'

interface TheaterFiltersProps {
  cities: City[]
}

export function TheaterFilters({ cities }: TheaterFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string | boolean | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value === null || value === '' || value === false) {
      params.delete(key)
    } else {
      params.set(key, value.toString())
    }
    
    router.push(`/theaters?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/theaters')
  }

  const hasFilters = searchParams.toString().length > 0

  return (
    <div className="space-y-6">
      {/* City Filter */}
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Select
          value={searchParams.get('city_id') || 'all'}
          onValueChange={(value) => updateFilter('city_id', value === 'all' ? null : value)}
        >
          <SelectTrigger id="city">
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}, {city.state || city.country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Audience Type Filter */}
      <div className="space-y-2">
        <Label htmlFor="audience">Theater Type</Label>
        <Select
          value={searchParams.get('audience_type') || 'all'}
          onValueChange={(value) => updateFilter('audience_type', value === 'all' ? null : value)}
        >
          <SelectTrigger id="audience">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="high_class">Premium</SelectItem>
            <SelectItem value="celebration">Special Events</SelectItem>
            <SelectItem value="normal">Standard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Amenities Filters */}
      <div className="space-y-3">
        <Label>Amenities</Label>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="imax"
              checked={searchParams.get('has_imax') === 'true'}
              onCheckedChange={(checked) => updateFilter('has_imax', checked)}
            />
            <label
              htmlFor="imax"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              IMAX
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="dolby"
              checked={searchParams.get('has_dolby_atmos') === 'true'}
              onCheckedChange={(checked) => updateFilter('has_dolby_atmos', checked)}
            />
            <label
              htmlFor="dolby"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Dolby Atmos
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="recliners"
              checked={searchParams.get('has_recliners') === 'true'}
              onCheckedChange={(checked) => updateFilter('has_recliners', checked)}
            />
            <label
              htmlFor="recliners"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Recliners
            </label>
          </div>
        </div>
      </div>

      {hasFilters && (
        <>
          <Separator />
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </>
      )}
    </div>
  )
}
