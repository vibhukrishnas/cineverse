'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ActorImage } from '@/types/actor'
import { X, ChevronLeft, ChevronRight, Download, Star } from 'lucide-react'

interface ActorImageGalleryProps {
  images: ActorImage[]
  actorName: string
}

export function ActorImageGallery({ images, actorName }: ActorImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (images.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No photos available.</p>
        </CardContent>
      </Card>
    )
  }

  const openImage = (index: number) => {
    setSelectedIndex(index)
  }

  const closeImage = () => {
    setSelectedIndex(null)
  }

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length)
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length)
    }
  }

  const selectedImage = selectedIndex !== null ? images[selectedIndex] : null

  return (
    <>
      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <ImageCard
            key={image.file_path}
            image={image}
            actorName={actorName}
            onClick={() => openImage(index)}
          />
        ))}
      </div>

      {/* Fullscreen Modal */}
      <Dialog open={selectedIndex !== null} onOpenChange={(open: boolean) => !open && closeImage()}>
        <DialogContent className="max-w-6xl p-0 bg-black/95">
          {selectedImage && selectedIndex !== null && (
            <div className="relative">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
                onClick={closeImage}
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Navigation Buttons */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                    onClick={goToPrevious}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                    onClick={goToNext}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              {/* Image */}
              <div className="relative w-full" style={{ aspectRatio: selectedImage.aspect_ratio }}>
                <Image
                  src={`https://image.tmdb.org/t/p/original${selectedImage.file_path}`}
                  alt={`${actorName} - Photo ${selectedIndex + 1}`}
                  fill
                  className="object-contain"
                  quality={95}
                />
              </div>

              {/* Image Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                <div className="flex items-center justify-between text-white">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Photo {selectedIndex + 1} of {images.length}
                    </p>
                    <p className="text-xs text-white/70">
                      {selectedImage.width} × {selectedImage.height}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {selectedImage.vote_average > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm font-medium">
                          {selectedImage.vote_average.toFixed(1)}
                        </span>
                        <span className="text-xs text-white/70">
                          ({selectedImage.vote_count} votes)
                        </span>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-white/80"
                      asChild
                    >
                      <a
                        href={`https://image.tmdb.org/t/p/original${selectedImage.file_path}`}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function ImageCard({
  image,
  actorName,
  onClick,
}: {
  image: ActorImage
  actorName: string
  onClick: () => void
}) {
  return (
    <Card
      className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] bg-muted">
        <Image
          src={`https://image.tmdb.org/t/p/w500${image.file_path}`}
          alt={actorName}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
        {image.vote_average > 0 && (
          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span className="text-xs font-semibold text-white">
              {image.vote_average.toFixed(1)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </div>
    </Card>
  )
}
