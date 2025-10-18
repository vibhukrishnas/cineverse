interface GenreBadgeProps {
  genre: string
  variant?: 'default' | 'outline'
}

export function GenreBadge({ genre, variant = 'default' }: GenreBadgeProps) {
  const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors'
  
  const variantClasses = {
    default: 'bg-primary/10 text-primary hover:bg-primary/20',
    outline: 'border border-primary/30 text-primary hover:bg-primary/10',
  }

  return (
    <span className={`${baseClasses} ${variantClasses[variant]}`}>
      {genre}
    </span>
  )
}
