'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  fallbackUrl?: string
  className?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  label?: string
}

export function BackButton({ 
  fallbackUrl = '/', 
  className,
  variant = 'ghost',
  size = 'default',
  label = 'Back'
}: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 2) {
      router.back()
    } else {
      router.push(fallbackUrl)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={cn('gap-2', className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {size !== 'icon' && label}
    </Button>
  )
}
