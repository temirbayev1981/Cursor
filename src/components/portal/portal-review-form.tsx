import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'

interface PortalReviewFormProps {
  disabled?: boolean
  onSubmit: (rating: number, comment: string) => void
}

export function PortalReviewForm({ disabled, onSubmit }: PortalReviewFormProps) {
  const { t } = useTranslation()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [hovered, setHovered] = useState(0)

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">{t.customerPortal.reviewRating}</Label>
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              disabled={disabled}
              className="rounded-md p-1 transition-colors hover:bg-secondary/60 disabled:opacity-50"
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(value)}
              aria-label={`${value}`}
            >
              <Star
                className={cn(
                  'h-8 w-8',
                  (hovered || rating) >= value ? 'fill-accent text-accent' : 'text-muted-foreground',
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="portal-review-comment">{t.customerPortal.reviewComment}</Label>
        <Textarea
          id="portal-review-comment"
          className="mt-1"
          rows={3}
          value={comment}
          disabled={disabled}
          placeholder={t.customerPortal.reviewCommentPlaceholder}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <Button
        className="w-full"
        disabled={disabled || rating < 1}
        onClick={() => onSubmit(rating, comment.trim())}
      >
        {t.customerPortal.submitReview}
      </Button>
    </div>
  )
}
