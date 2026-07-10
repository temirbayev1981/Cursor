import { MapPin, Navigation } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/contexts/locale-context'
import type { RouteStop } from '@/lib/route-optimizer'

interface RouteOptimizerPanelProps {
  stops: RouteStop[]
  savedMiles: number
  savedMinutes: number
  totalMiles: number
  mapsUrl: string
  jobCount: number
}

export function RouteOptimizerPanel({
  stops,
  savedMiles,
  savedMinutes,
  totalMiles,
  mapsUrl,
  jobCount,
}: RouteOptimizerPanelProps) {
  const { t, locale } = useTranslation()

  if (jobCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            {t.scheduling.routeOptimization}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {locale === 'ru' ? 'Нет запланированных заказов для маршрута' : 'No scheduled jobs for routing'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            {t.scheduling.routeOptimization}
          </span>
          <Badge variant="outline">{jobCount} {locale === 'ru' ? 'остановок' : 'stops'}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {savedMiles > 0
            ? (locale === 'ru'
              ? `Экономия ~${savedMiles.toFixed(1)} миль и ~${savedMinutes} мин (${totalMiles.toFixed(1)} миль всего)`
              : `Saves ~${savedMiles.toFixed(1)} miles and ~${savedMinutes} min (${totalMiles.toFixed(1)} mi total)`)
            : (locale === 'ru'
              ? `Маршрут: ${totalMiles.toFixed(1)} миль`
              : `Route: ${totalMiles.toFixed(1)} miles`)}
        </p>
        {stops.map((stop, i) => (
          <div key={stop.id} className="flex items-start gap-3 text-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="font-medium line-clamp-1">{stop.label}</p>
              <p className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{stop.address}</span>
              </p>
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full" size="sm" asChild>
          <a href={mapsUrl} target="_blank" rel="noreferrer">
            {t.scheduling.openMaps}
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
