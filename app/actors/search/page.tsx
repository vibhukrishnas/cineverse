'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { searchActors } from '@/app/actions/actors'
import { ActorCard } from '@/components/actors/actor-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ActorSearchResult } from '@/types/actor'
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

export default function ActorSearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialPage = parseInt(searchParams.get('page') || '1')

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<ActorSearchResult[]>([])
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(!!initialQuery)

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery, initialPage)
    }
  }, [])

  const handleSearch = async (searchQuery: string = query, page: number = 1) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setHasSearched(true)

    try {
      const result = await searchActors(searchQuery, page)
      if (result.success && result.data) {
        setResults(result.data.results)
        setCurrentPage(result.data.page)
        setTotalPages(result.data.total_pages)

        // Update URL
        const params = new URLSearchParams()
        params.set('q', searchQuery)
        if (page > 1) {
          params.set('page', page.toString())
        }
        router.push(`/actors/search?${params.toString()}`, { scroll: false })
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query, 1)
  }

  const goToPage = (page: number) => {
    handleSearch(query, page)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Search Actors</h1>
        <p className="text-muted-foreground">
          Find your favorite actors and actresses.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for actors..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={isLoading || !query.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </Button>
        </div>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Results */}
      {!isLoading && hasSearched && (
        <>
          {results.length > 0 ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Found results for <strong>&quot;{initialQuery}&quot;</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
                {results.map((actor) => (
                  <ActorCard key={actor.id} actor={actor} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => goToPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No actors found for <strong>&quot;{initialQuery}&quot;</strong>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try searching with a different name or spelling.
              </p>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!hasSearched && !isLoading && (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Enter a name to search for actors and actresses.
          </p>
        </div>
      )}
    </div>
  )
}
