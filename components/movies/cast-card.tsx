'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getTMDBImageUrl } from '@/lib/tmdb/client'
import { TMDBCastMember } from '@/types/tmdb.types'
import { Card, CardContent } from '@/components/ui/card'

interface CastCardProps {
  cast: TMDBCastMember
}

export function CastCard({ cast }: CastCardProps) {
  const profileUrl = getTMDBImageUrl(cast.profile_path, 'w185')

  return (
    <Link href={`/actor/${cast.id}`}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
          <div className="relative aspect-[2/3]">
            <Image
              src={profileUrl}
              alt={cast.name}
              fill
              className="object-cover"
              sizes="150px"
            />
          </div>
          <CardContent className="p-3">
            <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">{cast.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{cast.character}</p>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  )
}
