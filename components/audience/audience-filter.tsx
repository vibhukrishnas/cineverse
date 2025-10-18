'use client'

import { useState } from 'react'
import { Crown, Users, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export type AudienceTypeFilter = 'high_class' | 'celebration' | 'normal' | null

interface AudienceFilterProps {
  selected: AudienceTypeFilter
  onSelect: (type: AudienceTypeFilter) => void
}

const audienceTypes = [
  {
    id: 'high_class' as const,
    label: 'High Class',
    icon: Crown,
    color: 'text-purple-400 hover:bg-purple-500/20 border-purple-500/50',
    activeColor: 'bg-purple-500/30 border-purple-500 text-purple-300',
    description: 'Premium luxury experience',
  },
  {
    id: 'celebration' as const,
    label: 'Celebration',
    icon: Sparkles,
    color: 'text-yellow-400 hover:bg-yellow-500/20 border-yellow-500/50',
    activeColor: 'bg-yellow-500/30 border-yellow-500 text-yellow-300',
    description: 'Special occasions & events',
  },
  {
    id: 'normal' as const,
    label: 'Normal',
    icon: Users,
    color: 'text-blue-400 hover:bg-blue-500/20 border-blue-500/50',
    activeColor: 'bg-blue-500/30 border-blue-500 text-blue-300',
    description: 'Standard viewing experience',
  },
]

export function AudienceFilter({ selected, onSelect }: AudienceFilterProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Audience Type</h3>
            {selected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelect(null)}
                className="h-6 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {audienceTypes.map((type) => {
              const Icon = type.icon
              const isSelected = selected === type.id

              return (
                <Button
                  key={type.id}
                  variant="outline"
                  onClick={() => onSelect(isSelected ? null : type.id)}
                  className={`justify-start h-auto py-3 ${
                    isSelected ? type.activeColor : type.color
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{type.label}</div>
                    <div className="text-xs opacity-75">{type.description}</div>
                  </div>
                </Button>
              )
            })}
          </div>

          {selected && (
            <div className="pt-2 text-xs text-muted-foreground">
              Showing movies perfect for {audienceTypes.find(t => t.id === selected)?.label.toLowerCase()} audiences
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
