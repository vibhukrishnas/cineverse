import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ActorSocialMedia, getSocialMediaUrl } from '@/types/actor'
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  ExternalLink,
  Globe,
  Share2
} from 'lucide-react'

interface ActorSocialLinksProps {
  social: ActorSocialMedia
  actorName: string
}

export function ActorSocialLinks({ social, actorName }: ActorSocialLinksProps) {
  const socialLinks = [
    {
      platform: 'Instagram',
      id: social.instagram_id,
      icon: Instagram,
      color: 'text-pink-500',
      url: getSocialMediaUrl('instagram_id', social.instagram_id),
    },
    {
      platform: 'Twitter',
      id: social.twitter_id,
      icon: Twitter,
      color: 'text-blue-400',
      url: getSocialMediaUrl('twitter_id', social.twitter_id),
    },
    {
      platform: 'Facebook',
      id: social.facebook_id,
      icon: Facebook,
      color: 'text-blue-600',
      url: getSocialMediaUrl('facebook_id', social.facebook_id),
    },
    {
      platform: 'YouTube',
      id: social.youtube_id,
      icon: Youtube,
      color: 'text-red-600',
      url: getSocialMediaUrl('youtube_id', social.youtube_id),
    },
    {
      platform: 'TikTok',
      id: social.tiktok_id,
      icon: Share2,
      color: 'text-black dark:text-white',
      url: getSocialMediaUrl('tiktok_id', social.tiktok_id),
    },
    {
      platform: 'IMDb',
      id: social.imdb_id,
      icon: Globe,
      color: 'text-yellow-500',
      url: getSocialMediaUrl('imdb_id', social.imdb_id),
    },
  ].filter((link) => link.id && link.url)

  if (socialLinks.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Social Media
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {socialLinks.map((link) => (
          <Button
            key={link.platform}
            variant="outline"
            className="w-full justify-start"
            asChild
          >
            <a href={link.url!} target="_blank" rel="noopener noreferrer">
              <link.icon className={`h-4 w-4 mr-2 ${link.color}`} />
              {link.platform}
              <ExternalLink className="h-3 w-3 ml-auto" />
            </a>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
