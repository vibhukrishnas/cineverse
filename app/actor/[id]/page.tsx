import { notFound } from 'next/navigation'
import { getActorProfile, isFollowingActor, getActorFollowerCount } from '@/app/actions/actors'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActorProfileHeader } from '@/components/actors/actor-profile-header'
import { ActorFilmography } from '@/components/actors/actor-filmography'
import { ActorSocialLinks } from '@/components/actors/actor-social-links'
import { ActorImageGallery } from '@/components/actors/actor-image-gallery'
import { calculateAge, getGenderLabel } from '@/types/actor'
import { Calendar, MapPin, Award, User, Cake } from 'lucide-react'

interface PageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PageProps) {
  const actorId = parseInt(params.id)
  if (isNaN(actorId)) return { title: 'Actor Not Found' }

  const result = await getActorProfile(actorId)
  if (!result.success || !result.data) {
    return { title: 'Actor Not Found' }
  }

  const actor = result.data
  return {
    title: `${actor.name} - CineVerse`,
    description: actor.biography?.substring(0, 160) || `View ${actor.name}'s profile, filmography, and more on CineVerse.`,
  }
}

export default async function ActorPage({ params }: PageProps) {
  const actorId = parseInt(params.id)
  if (isNaN(actorId)) {
    notFound()
  }

  const [profileResult, followResult, followerCountResult] = await Promise.all([
    getActorProfile(actorId),
    isFollowingActor(actorId),
    getActorFollowerCount(actorId),
  ])

  if (!profileResult.success || !profileResult.data) {
    notFound()
  }

  const actor = profileResult.data
  const isFollowing = followResult.success ? (followResult.isFollowing || false) : false
  const followerCount = followerCountResult.success ? followerCountResult.count : 0

  const age = calculateAge(actor.birthday, actor.deathday)
  const genderLabel = getGenderLabel(actor.gender)

  // Sort movies by release date (most recent first)
  const sortedCastCredits = [...(actor.credits?.cast || [])].sort((a, b) => {
    const dateA = new Date(a.release_date || 0)
    const dateB = new Date(b.release_date || 0)
    return dateB.getTime() - dateA.getTime()
  })

  const sortedCrewCredits = [...(actor.credits?.crew || [])].sort((a, b) => {
    const dateA = new Date(a.release_date || 0)
    const dateB = new Date(b.release_date || 0)
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <div className="min-h-screen pb-12">
      {/* Actor Profile Header */}
      <ActorProfileHeader
        actor={actor}
        isFollowing={isFollowing}
        followerCount={followerCount}
      />

      {/* Back Button */}
      <div className="container mx-auto px-4 mt-4">
        <BackButton fallbackUrl="/explore" />
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Personal Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Personal Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Known For */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Known For</p>
                  <Badge variant="secondary">
                    {actor.known_for_department}
                  </Badge>
                </div>

                {/* Gender */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Gender</p>
                  <p className="font-medium">{genderLabel}</p>
                </div>

                {/* Birthday */}
                {actor.birthday && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <Cake className="h-4 w-4" />
                      Birthday
                    </p>
                    <p className="font-medium">
                      {new Date(actor.birthday).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      {age && !actor.deathday && (
                        <span className="text-muted-foreground ml-2">({age} years old)</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Death Day */}
                {actor.deathday && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Death</p>
                    <p className="font-medium">
                      {new Date(actor.deathday).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      {age && (
                        <span className="text-muted-foreground ml-2">(aged {age})</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Place of Birth */}
                {actor.place_of_birth && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Place of Birth
                    </p>
                    <p className="font-medium">{actor.place_of_birth}</p>
                  </div>
                )}

                {/* Also Known As */}
                {actor.also_known_as && actor.also_known_as.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Also Known As</p>
                    <div className="space-y-1">
                      {actor.also_known_as.slice(0, 5).map((name, index) => (
                        <p key={index} className="text-sm">{name}</p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Media Links */}
            {actor.social && (
              <ActorSocialLinks social={actor.social} actorName={actor.name} />
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="biography" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="biography">Biography</TabsTrigger>
                <TabsTrigger value="movies">Movies ({sortedCastCredits.length})</TabsTrigger>
                <TabsTrigger value="crew">As Crew ({sortedCrewCredits.length})</TabsTrigger>
                <TabsTrigger value="photos">Photos ({actor.images?.length || 0})</TabsTrigger>
              </TabsList>

              {/* Biography Tab */}
              <TabsContent value="biography" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Biography</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {actor.biography ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        {actor.biography.split('\n\n').map((paragraph, index) => (
                          <p key={index} className="mb-4 leading-relaxed">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No biography available.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Career Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Career Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-primary">
                          {sortedCastCredits.length}
                        </p>
                        <p className="text-sm text-muted-foreground">Acting Roles</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-primary">
                          {sortedCrewCredits.length}
                        </p>
                        <p className="text-sm text-muted-foreground">Crew Credits</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-primary">
                          {followerCount}
                        </p>
                        <p className="text-sm text-muted-foreground">Followers</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-primary">
                          {actor.popularity.toFixed(1)}
                        </p>
                        <p className="text-sm text-muted-foreground">Popularity</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Movies Tab */}
              <TabsContent value="movies">
                <ActorFilmography 
                  credits={sortedCastCredits} 
                  type="cast"
                  actorName={actor.name}
                />
              </TabsContent>

              {/* Crew Tab */}
              <TabsContent value="crew">
                <ActorFilmography 
                  credits={sortedCrewCredits} 
                  type="crew"
                  actorName={actor.name}
                />
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos">
                <ActorImageGallery 
                  images={actor.images || []} 
                  actorName={actor.name}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
