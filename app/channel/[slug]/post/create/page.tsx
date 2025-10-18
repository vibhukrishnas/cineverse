'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createPost, getChannel } from '@/app/actions/channels'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

const FLAIRS = ['Discussion', 'Review', 'Question', 'News', 'Meme', 'Meta']

export default function CreatePostPage({
  params
}: {
  params: { slug: string }
}) {
  const [channelId, setChannelId] = useState<string | null>(null)
  const [channelName, setChannelName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [flair, setFlair] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [isSpoiler, setIsSpoiler] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Fetch channel data on mount
  useEffect(() => {
    async function loadChannel() {
      try {
        const channel = await getChannel(params.slug)
        setChannelId(channel.id)
        setChannelName(channel.name)
      } catch (err) {
        console.error('Failed to load channel:', err)
        setError('Failed to load channel. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    loadChannel()
  }, [params.slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!channelId) {
      setError('Channel not found')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const post = await createPost({
        channel_id: channelId,
        title: title.trim(),
        content: content.trim() || undefined,
        flair: flair || undefined,
        thumbnail_url: thumbnailUrl || undefined,
        is_spoiler: isSpoiler
      })

      router.push(`/post/${post.id}`)
    } catch (err) {
      console.error('Failed to create post:', err)
      setError('Failed to create post. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <Link
        href={`/channel/${params.slug}`}
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {channelName || 'channel'}
      </Link>

      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-2">Create a Post</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Share your thoughts with {channelName}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="An interesting title for your post"
              maxLength={300}
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-gray-500">
              {title.length}/300 characters
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content (optional)</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, opinions, or questions..."
              className="min-h-[200px]"
              disabled={isSubmitting}
            />
          </div>

          {/* Flair */}
          <div className="space-y-2">
            <Label htmlFor="flair">Post Flair</Label>
            <select
              id="flair"
              value={flair}
              onChange={(e) => setFlair(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
              disabled={isSubmitting}
            >
              <option value="">No flair</option>
              {FLAIRS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail URL (optional)</Label>
            <Input
              id="thumbnail"
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              Add an image to make your post stand out
            </p>
          </div>

          {/* Spoiler toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="spoiler"
              checked={isSpoiler}
              onCheckedChange={(checked) => setIsSpoiler(checked as boolean)}
              disabled={isSubmitting}
            />
            <Label
              htmlFor="spoiler"
              className="text-sm font-normal cursor-pointer"
            >
              Mark as spoiler
            </Label>
          </div>

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit button */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </Button>
            <Link href={`/channel/${params.slug}`}>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
