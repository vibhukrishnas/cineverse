'use client'

import { Users, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'
import Link from 'next/link'

interface CastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

interface CrewMember {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
}

interface MovieCastCrewProps {
  cast: CastMember[]
  crew: CrewMember[]
}

export function MovieCastCrew({ cast, crew }: MovieCastCrewProps) {
  // Group crew by department
  const directors = crew.filter(c => c.job === 'Director')
  const writers = crew.filter(c => c.department === 'Writing')
  const producers = crew.filter(c => c.department === 'Production')
  const cinematographers = crew.filter(c => c.job === 'Director of Photography')
  const composers = crew.filter(c => c.department === 'Sound' && c.job.includes('Music'))

  const topCast = cast.slice(0, 12) // Show top 12 cast members

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Cast & Crew
        </CardTitle>
        <CardDescription>
          Meet the talented people behind this movie
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cast" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cast">Cast</TabsTrigger>
            <TabsTrigger value="crew">Crew</TabsTrigger>
          </TabsList>

          <TabsContent value="cast" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {topCast.map((member) => (
                <Link
                  key={member.id}
                  href={`/actor/${member.id}`}
                  className="group"
                >
                  <div className="space-y-2">
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                      {member.profile_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w300${member.profile_path}`}
                          alt={member.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {member.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {member.character}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {cast.length > 12 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Showing {topCast.length} of {cast.length} cast members
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="crew" className="mt-6 space-y-6">
            {/* Directors */}
            {directors.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Director{directors.length > 1 ? 's' : ''}</Badge>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {directors.map((member) => (
                    <CrewCard key={`dir-${member.id}`} member={member} />
                  ))}
                </div>
              </div>
            )}

            {/* Writers */}
            {writers.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Writer{writers.length > 1 ? 's' : ''}</Badge>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {writers.slice(0, 4).map((member) => (
                    <CrewCard key={`wri-${member.id}-${member.job}`} member={member} />
                  ))}
                </div>
              </div>
            )}

            {/* Producers */}
            {producers.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Producer{producers.length > 1 ? 's' : ''}</Badge>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {producers.slice(0, 4).map((member) => (
                    <CrewCard key={`prod-${member.id}-${member.job}`} member={member} />
                  ))}
                </div>
              </div>
            )}

            {/* Cinematographers */}
            {cinematographers.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Cinematography</Badge>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {cinematographers.map((member) => (
                    <CrewCard key={`cin-${member.id}`} member={member} />
                  ))}
                </div>
              </div>
            )}

            {/* Music Composers */}
            {composers.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Music</Badge>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {composers.map((member) => (
                    <CrewCard key={`mus-${member.id}`} member={member} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function CrewCard({ member }: { member: CrewMember }) {
  return (
    <Link href={`/actor/${member.id}`} className="group">
      <div className="space-y-2">
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
          {member.profile_path ? (
            <Image
              src={`https://image.tmdb.org/t/p/w300${member.profile_path}`}
              alt={member.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold text-sm group-hover:text-primary transition-colors">
            {member.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {member.job}
          </p>
        </div>
      </div>
    </Link>
  )
}
