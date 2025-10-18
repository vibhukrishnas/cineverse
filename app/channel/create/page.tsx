'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createChannel } from '@/app/actions/channels'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Loader2, Plus, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function CreateChannelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'genre' | 'regional' | 'topic' | 'custom'>('custom')
  const [icon, setIcon] = useState('')
  const [rules, setRules] = useState<string[]>([''])

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value)
    // Auto-generate slug (lowercase, replace spaces with hyphens)
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setSlug(generatedSlug)
  }

  const addRule = () => {
    setRules([...rules, ''])
  }

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index))
  }

  const updateRule = (index: number, value: string) => {
    const newRules = [...rules]
    newRules[index] = value
    setRules(newRules)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!name.trim()) {
      setError('Channel name is required')
      return
    }

    if (!slug.trim()) {
      setError('Channel slug is required')
      return
    }

    if (slug.length < 3) {
      setError('Slug must be at least 3 characters')
      return
    }

    setLoading(true)

    try {
      const filteredRules = rules.filter(r => r.trim() !== '')

      const channel = await createChannel({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        type,
        icon: icon.trim() || undefined,
        rules: filteredRules.length > 0 ? filteredRules : undefined
      })

      console.log('✅ Channel created:', channel)
      router.push(`/channel/${channel.slug}`)
    } catch (err) {
      console.error('❌ Error creating channel:', err)
      setError(err instanceof Error ? err.message : 'Failed to create channel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create a Channel</h1>
        <p className="text-muted-foreground mt-1">
          Build a community around movies, genres, or topics you love
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Channel Details</CardTitle>
            <CardDescription>
              Basic information about your channel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Channel Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Action Movies Hub, Tamil Cinema Fans"
                maxLength={50}
                required
              />
              <p className="text-xs text-muted-foreground">
                {name.length}/50 characters
              </p>
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Channel URL (Slug) *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/channel/</span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="action-movies-hub"
                  maxLength={30}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only. Min 3 characters.
              </p>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Channel Type *</Label>
              <Select value={type} onValueChange={(value: any) => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="genre">Genre (Action, Comedy, Horror, etc.)</SelectItem>
                  <SelectItem value="regional">Regional (Bollywood, Hollywood, Kollywood, etc.)</SelectItem>
                  <SelectItem value="topic">Topic (Reviews, News, Discussions, etc.)</SelectItem>
                  <SelectItem value="custom">Custom (Your own category)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label htmlFor="icon">Channel Icon (Emoji)</Label>
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🎬 🎭 🎪 🎞️ 🎥"
                maxLength={2}
              />
              <p className="text-xs text-muted-foreground">
                Choose a single emoji to represent your channel
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what your channel is about..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500 characters
              </p>
            </div>

            {/* Rules */}
            <div className="space-y-2">
              <Label>Channel Rules (Optional)</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Set guidelines for your community members
              </p>
              
              <div className="space-y-2">
                {rules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground min-w-[20px]">
                      {index + 1}.
                    </span>
                    <Input
                      value={rule}
                      onChange={(e) => updateRule(index, e.target.value)}
                      placeholder="Enter a rule..."
                      maxLength={200}
                    />
                    {rules.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRule(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {rules.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRule}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Channel'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
