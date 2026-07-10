import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        {
          'bg-primary/20 text-primary': variant === 'default',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
          'bg-success/20 text-success': variant === 'success',
          'bg-warning/20 text-warning': variant === 'warning',
          'bg-destructive/20 text-destructive': variant === 'destructive',
          'border border-border text-muted-foreground': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  )
}
