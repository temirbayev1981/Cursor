import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/contexts/locale-context'
import { NotificationHubPanel } from '@/components/settings/notification-hub-panel'
import { formatAuditAction, countUniqueAuditActions, AUDIT_ACTION_COUNT } from '@/lib/audit-labels'
import { INTEGRATION_PROBE_IDS } from '@/lib/integration-probe-ui'
import { toast } from 'sonner'
import type { PlatformAuditReport } from '@/lib/platform-audit'
import type { IntegrationKey } from '@/components/settings/settings-integrations-panel'
import { integrationKeyForRecommendation } from '@/lib/audit-recommendation-links'
import type { PlatformHealthReport } from '@/lib/platform-health'
import type { SystemMetrics } from '@/lib/system-metrics'
import type { IntegrationProbeHistoryEntry } from '@/lib/integration-probe-history'
import type { UseMutationResult } from '@tanstack/react-query'

interface AuditLogEntry {
  id: string
  action: string
  entity_type: string
  created_at: string
}

interface SettingsSystemPanelProps {
  platformAudit: PlatformAuditReport
  platformHealth: PlatformHealthReport
  systemMetrics: SystemMetrics
  systemStatusLabel: string
  probeHistory: IntegrationProbeHistoryEntry[]
  latestProbeHistory: IntegrationProbeHistoryEntry | null
  serviceWorkerReady: boolean
  auditLogs: AuditLogEntry[]
  errors: { message: string; timestamp: string }[]
  hasSupabase: boolean
  importSampleData: UseMutationResult<{ imported: number }, Error, void>
  onRefreshAuditLogs: () => void
  onRefreshSystemMetrics: () => void
  onOpenIntegration?: (key: IntegrationKey) => void
}

export function SettingsSystemPanel({
  platformAudit,
  platformHealth,
  systemMetrics,
  systemStatusLabel,
  probeHistory,
  latestProbeHistory,
  serviceWorkerReady,
  auditLogs,
  errors,
  hasSupabase,
  importSampleData,
  onRefreshAuditLogs,
  onRefreshSystemMetrics,
  onOpenIntegration,
}: SettingsSystemPanelProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="md:col-span-2" data-testid="settings-user-guide">
        <CardHeader><CardTitle>{t.settings.userGuide}</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{t.settings.userGuideDesc}</p>
          <Button variant="outline" asChild>
            <Link to="/instructions">
              <BookOpen className="h-4 w-4" />
              {t.settings.openUserGuide}
            </Link>
          </Button>
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader><CardTitle>{t.settings.platformAudit}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {platformAudit.score < 8.5 && (
            <p
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              data-testid="platform-audit-low-score"
            >
              {t.settings.platformAuditLowScore}
            </p>
          )}
          {!serviceWorkerReady && (
            <p className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-muted-foreground" data-testid="sw-first-visit-hint">
              {t.settings.swFirstVisitHint}
            </p>
          )}
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">{platformAudit.score}/10</div>
            <div>
              <Badge variant={platformAudit.readyForProduction ? 'success' : 'outline'}>
                {platformAudit.grade}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">{t.settings.auditSummary[platformAudit.summaryKey]}</p>
            </div>
          </div>
          <ul className="text-sm space-y-1 text-muted-foreground" data-testid="platform-audit-recommendations">
            {platformAudit.recommendationIds.map((id) => {
              const integrationKey = integrationKeyForRecommendation(id)
              const label = t.settings.auditRecommendations[id]
              if (integrationKey && onOpenIntegration && id !== 'all_ready') {
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className="text-left underline-offset-2 hover:underline hover:text-foreground"
                      data-testid={`audit-recommendation-link-${id}`}
                      onClick={() => onOpenIntegration(integrationKey)}
                    >
                      • {label}
                    </button>
                  </li>
                )
              }
              return <li key={id}>• {label}</li>
            })}
          </ul>
          <div className="flex flex-wrap gap-2 pt-2" data-testid="platform-audit-checklist">
            {platformAudit.checks.map((check) => (
              <Badge
                key={check.id}
                variant={check.ok ? 'success' : 'outline'}
                data-testid={`platform-audit-check-${check.id}`}
              >
                {t.settings.auditCheckLabels[check.id as keyof typeof t.settings.auditCheckLabels] ?? check.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader><CardTitle>{t.settings.platformHealth}</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">{platformHealth.score}/10</div>
            <div>
              <Badge variant={platformHealth.readyForProduction ? 'success' : 'outline'}>
                {platformHealth.grade}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {platformHealth.readyForProduction
                  ? t.settings.productionReady
                  : t.settings.needsConfiguration}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {platformHealth.checks.map((check) => (
              <Badge key={check.id} variant={check.ok ? 'success' : 'outline'}>
                {check.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader><CardTitle>{t.settings.systemMetrics}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="rounded-lg bg-secondary/30 p-3">
            <p className="text-muted-foreground">{t.settings.platformScore}</p>
            <Badge variant={systemMetrics.status === 'healthy' ? 'success' : systemMetrics.status === 'degraded' ? 'outline' : 'destructive'}>
              {systemStatusLabel}
            </Badge>
          </div>
          <div className="rounded-lg bg-secondary/30 p-3">
            <p className="text-muted-foreground">{t.settings.errorsLast24h}</p>
            <p className="text-2xl font-bold">{systemMetrics.errorsLast24h}</p>
          </div>
          <div className="rounded-lg bg-secondary/30 p-3">
            <p className="text-muted-foreground">{t.settings.offlineQueue}</p>
            <p className="text-2xl font-bold">{systemMetrics.offlineQueueSize}</p>
          </div>
          <div className="rounded-lg bg-secondary/30 p-3">
            <p className="text-muted-foreground">{t.settings.notificationQueue}</p>
            <p className="text-2xl font-bold">{systemMetrics.notificationQueueSize}</p>
          </div>
          {systemMetrics.lastErrorAt && (
            <p className="col-span-full text-xs text-muted-foreground">
              {t.settings.lastError}: {new Date(systemMetrics.lastErrorAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
      <Card className="md:col-span-2" data-testid="integration-probe-history">
        <CardHeader>
          <CardTitle>{t.settings.integrationProbeHistory}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {latestProbeHistory
              ? t.settings.integrationProbeHistoryLatest.replace(
                  '{time}',
                  new Date(latestProbeHistory.checkedAt).toLocaleString(),
                )
              : null}
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {probeHistory.length === 0 ? (
            <p className="text-muted-foreground">{t.settings.integrationProbeHistoryEmpty}</p>
          ) : (
            probeHistory.slice(0, 5).map((entry, index) => (
              <div
                key={entry.checkedAt}
                className="rounded-lg bg-secondary/30 p-3"
                data-testid={`integration-probe-history-entry-${index}`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-medium">
                    {new Date(entry.checkedAt).toLocaleString()}
                  </p>
                  <Badge variant={entry.summary.unreachable > 0 ? 'outline' : 'success'}>
                    {t.settings.integrationProbesSummary
                      .replace('{live}', String(entry.summary.live))
                      .replace('{total}', String(entry.summary.total))}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INTEGRATION_PROBE_IDS.map((id) => {
                    const reachable = entry.results[id]
                    if (reachable === null || reachable === undefined) return null
                    const card = t.settings.integrationCards[id]
                    return (
                      <Badge
                        key={`${entry.checkedAt}-${id}`}
                        variant={reachable ? 'success' : 'destructive'}
                        data-testid={`integration-probe-history-${id}-${index}`}
                      >
                        {card.name}: {reachable ? t.settings.integrationProbeLive : t.settings.integrationProbeUnreachable}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      {hasSupabase && (
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>{t.settings.supabaseCard}</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {t.settings.importSampleDesc}
            </p>
            <Button
              variant="outline"
              data-testid="import-sample-data"
              disabled={importSampleData.isPending}
              onClick={() => importSampleData.mutate(undefined, {
                onSuccess: (r) => {
                  onRefreshAuditLogs()
                  toast.success(`${t.settings.imported}: ${r.imported}`)
                },
                onError: (e) => toast.error(e.message),
              })}
            >
              {t.settings.importSampleData}
            </Button>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{t.settings.auditLog} ({auditLogs.length})</CardTitle>
          <p className="text-sm text-muted-foreground" data-testid="audit-coverage-summary">
            {t.settings.auditCoverageSummary
              .replace('{unique}', String(countUniqueAuditActions(auditLogs)))
              .replace('{total}', String(AUDIT_ACTION_COUNT))}
          </p>
        </CardHeader>
        <CardContent className="space-y-2 text-sm max-h-64 overflow-y-auto" data-testid="audit-log-list">
          {auditLogs.length === 0 ? (
            <p className="text-muted-foreground">{t.common.noData}</p>
          ) : (
            auditLogs.slice(0, 20).map((log) => (
              <div
                key={log.id}
                className="rounded bg-secondary/30 p-2"
                data-testid={`audit-log-${log.id}`}
                data-audit-action={log.action}
              >
                <p className="font-medium">{formatAuditAction(log.action, t.settings.auditActions)}</p>
                <p className="text-xs text-muted-foreground">
                  {log.entity_type} · {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <NotificationHubPanel onQueueChange={onRefreshSystemMetrics} />
      <Card>
        <CardHeader><CardTitle>{t.settings.errorReportsPanel.replace('{count}', String(errors.length))}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {errors.length === 0 ? <p className="text-muted-foreground">{t.settings.noErrors}</p> : errors.map((e, i) => (
            <div key={i} className="rounded bg-secondary/30 p-2">
              <p className="font-medium truncate">{e.message}</p>
              <p className="text-xs text-muted-foreground">{e.timestamp}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
