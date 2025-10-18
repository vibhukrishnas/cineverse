import { Card, CardContent } from '@/components/ui/card'

export function MovieCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[2/3] bg-muted animate-pulse" />
      <CardContent className="p-4 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-3 bg-muted rounded w-16 animate-pulse" />
      </CardContent>
    </Card>
  )
}

export function MovieDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero Skeleton */}
      <div className="relative h-96 bg-muted animate-pulse" />
      
      {/* Content Skeleton */}
      <div className="container mx-auto px-4 space-y-6">
        <div className="h-8 bg-muted rounded w-1/2 animate-pulse" />
        <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export function CastCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[2/3] bg-muted animate-pulse" />
      <CardContent className="p-3 space-y-2">
        <div className="h-3 bg-muted rounded animate-pulse" />
        <div className="h-2 bg-muted rounded w-2/3 animate-pulse" />
      </CardContent>
    </Card>
  )
}
