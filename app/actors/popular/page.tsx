import { getPopularActors } from '@/app/actions/actors'
import { ActorCard } from '@/components/actors/actor-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PageProps {
  searchParams: {
    page?: string
  }
}

export const metadata = {
  title: 'Popular Actors - CineVerse',
  description: 'Discover the most popular actors and actresses in cinema.',
}

export default async function PopularActorsPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page || '1')
  const result = await getPopularActors(page)

  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground">Failed to load popular actors.</p>
        </div>
      </div>
    )
  }

  const { results, total_pages, page: currentPage } = result.data

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Popular Actors</h1>
        <p className="text-muted-foreground">
          Discover the most popular actors and actresses in cinema.
        </p>
      </div>

      {/* Actor Grid */}
      {results.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
            {results.map((actor) => (
              <ActorCard key={actor.id} actor={actor} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4">
            {currentPage > 1 ? (
              <Button variant="outline" asChild>
                <Link href={`/actors/popular?page=${currentPage - 1}`}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}

            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {total_pages}
            </span>

            {currentPage < total_pages ? (
              <Button variant="outline" asChild>
                <Link href={`/actors/popular?page=${currentPage + 1}`}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No actors found.</p>
        </div>
      )}
    </div>
  )
}
