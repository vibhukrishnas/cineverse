'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Profile page error:', error)
  }, [error])

  return (
    <div className="container max-w-4xl mx-auto py-16 px-4">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle>Failed to load profile</CardTitle>
          <CardDescription>
            We couldn't load this profile. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-mono text-muted-foreground break-all">
              {error.message || 'Unknown error'}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 justify-center">
          <Button onClick={reset} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
