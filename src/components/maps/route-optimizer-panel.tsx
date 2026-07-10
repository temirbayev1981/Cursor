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
  const { t } = useTranslation()

  if (jobCount === 0) {
    return (
      <Card data-testid="route-optimizer-panel">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            {t.scheduling.routeOptimization}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t.scheduling.noRoutingJobs}
          </p>
        </CardContent>
      </Card>
    )
  }

  const routeSummary = savedMiles > 0
    ? t.scheduling.routeSavings
      .replace('{savedMiles}', savedMiles.toFixed(1))
      .replace('{savedMinutes}', String(savedMinutes))
      .replace('{totalMiles}', totalMiles.toFixed(1))
    : t.scheduling.routeTotal.replace('{totalMiles}', totalMiles.toFixed(1))

  return (
    <Card data-testid="route-optimizer-panel">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            {t.scheduling.routeOptimization}
          </span>
          <Badge variant="outline">{jobCount} {t.scheduling.routeStops}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{routeSummary}</p>
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
          <a href={mapsUrl} target="_blank" rel="noreferrer" data-testid="route-optimizer-open-maps">
            {t.scheduling.openMaps}
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
