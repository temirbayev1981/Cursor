import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/contexts/locale-context'

export const INTEGRATION_KEYS = ['stripe', 'maps', 'openai', 'supabase', 'email', 'sms', 'observability'] as const

export type IntegrationKey = (typeof INTEGRATION_KEYS)[number]

interface SettingsIntegrationsPanelProps {
  integrationStatus: Record<IntegrationKey, 'connected' | 'configure' | 'comingSoon'>
  integrationProbes: Record<string, boolean | null>
  probesLoading: boolean
  probeSummary: { live: number; total: number }
  onRefreshProbes: () => void
}

export function SettingsIntegrationsPanel({
  integrationStatus,
  integrationProbes,
  probesLoading,
  probeSummary,
  onRefreshProbes,
}: SettingsIntegrationsPanelProps) {
  const { t } = useTranslation()

  const getIntegrationStatus = (key: IntegrationKey) => {
    const status = integrationStatus[key]
    if (status === 'connected') return t.common.connected
    if (status === 'configure') return t.common.configure
    return t.common.comingSoon
  }

  const getIntegrationProbeLabel = (key: IntegrationKey) => {
    if (probesLoading) return t.settings.integrationProbeChecking
    const reachable = integrationProbes[key]
    if (reachable === null || reachable === undefined) return null
    return reachable ? t.settings.integrationProbeLive : t.settings.integrationProbeUnreachable
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <p className="text-sm text-muted-foreground" data-testid="integration-probes-summary">
          {probesLoading
            ? t.settings.integrationProbesSummaryChecking
            : probeSummary.total > 0
              ? t.settings.integrationProbesSummary
                  .replace('{live}', String(probeSummary.live))
                  .replace('{total}', String(probeSummary.total))
              : t.settings.integrationProbesSummaryNone}
        </p>
        <Button
          variant="outline"
          size="sm"
          data-testid="integration-probes-refresh"
          disabled={probesLoading}
          onClick={onRefreshProbes}
        >
          {t.settings.integrationProbesRefresh}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATION_KEYS.map((key) => {
          const card = t.settings.integrationCards[key]
          const status = integrationStatus[key]
          const probeLabel = getIntegrationProbeLabel(key)
          const probeFailed = status === 'connected' && integrationProbes[key] === false
          return (
            <Card key={key} data-testid={`integration-card-${key}`}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="font-medium">{card.name}</p>
                  <p className="text-sm text-muted-foreground">{card.desc}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant={probeFailed ? 'destructive' : status === 'connected' ? 'success' : 'outline'}
                    data-testid={`integration-status-${key}`}
                  >
                    {probeFailed ? t.settings.integrationProbeUnreachable : getIntegrationStatus(key)}
                  </Badge>
                  {probeLabel && (
                    <Badge
                      variant={integrationProbes[key] ? 'success' : 'outline'}
                      className="text-xs"
                      data-testid={`integration-probe-${key}`}
                    >
                      {probeLabel}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
