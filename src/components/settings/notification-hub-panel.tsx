import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, MessageSquare, RefreshCw } from 'lucide-react'
import { useTranslation } from '@/contexts/locale-context'
import {
  flushNotificationQueue,
  getNotificationQueueFiltered,
  getNotificationQueueStats,
  retryFailedNotifications,
  type NotificationHubFilter,
} from '@/services/notification-service'
import { toast } from 'sonner'

interface NotificationHubPanelProps {
  onQueueChange?: () => void
}

export function NotificationHubPanel({ onQueueChange }: NotificationHubPanelProps) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<NotificationHubFilter>('all')
  const [revision, setRevision] = useState(0)

  const stats = useMemo(() => getNotificationQueueStats(), [revision])
  const items = useMemo(() => getNotificationQueueFiltered(filter).slice(0, 12), [filter, revision])

  const bump = () => {
    setRevision((n) => n + 1)
    onQueueChange?.()
  }

  const handleFlush = () => {
    void flushNotificationQueue().then((sent) => {
      bump()
      if (sent > 0) {
        toast.success(t.settings.notificationQueueFlushed.replace('{count}', String(sent)))
      } else {
        toast.info(t.settings.notificationQueueFlushPending)
      }
    })
  }

  const handleRetryFailed = () => {
    void retryFailedNotifications().then((sent) => {
      bump()
      if (sent > 0) {
        toast.success(t.settings.notificationHubRetried.replace('{count}', String(sent)))
      } else {
        toast.info(t.settings.notificationHubNoRetry)
      }
    })
  }

  const statusLabel = (status: string) => {
    if (status === 'sent') return t.settings.notificationStatusSent
    if (status === 'failed') return t.settings.notificationStatusFailed
    return t.settings.notificationStatusQueued
  }

  return (
    <Card data-testid="notification-hub">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
        <div>
          <CardTitle>{t.settings.notificationHub}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t.settings.notificationHubSummary
              .replace('{total}', String(stats.total))
              .replace('{failed}', String(stats.failed))}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {stats.total > 0 && (
            <Button variant="outline" size="sm" data-testid="notification-queue-flush" onClick={handleFlush}>
              {t.settings.notificationQueueFlush}
            </Button>
          )}
          {stats.failed > 0 && (
            <Button variant="outline" size="sm" data-testid="notification-hub-retry" onClick={handleRetryFailed}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              {t.settings.notificationHubRetryFailed}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as NotificationHubFilter)}>
          <TabsList>
            <TabsTrigger value="all" data-testid="notification-hub-filter-all">{t.common.all}</TabsTrigger>
            <TabsTrigger value="email" data-testid="notification-hub-filter-email">{t.settings.notificationHubEmail}</TabsTrigger>
            <TabsTrigger value="sms" data-testid="notification-hub-filter-sms">{t.settings.notificationHubSms}</TabsTrigger>
          </TabsList>
        </Tabs>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.settings.notificationQueueEmpty}</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.map((item) => {
              const Icon = item.channel === 'sms' ? MessageSquare : Mail
              return (
                <div
                  key={item.id}
                  className="rounded-lg bg-secondary/30 p-3 text-sm"
                  data-testid={`notification-hub-item-${item.id}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate font-medium">{item.to}</span>
                    </div>
                    <Badge
                      variant={item.status === 'failed' ? 'destructive' : item.status === 'sent' ? 'success' : 'outline'}
                      data-testid={`notification-hub-status-${item.id}`}
                    >
                      {statusLabel(item.status)}
                    </Badge>
                  </div>
                  <p className="truncate">{item.subject ?? item.body}</p>
                  {item.attempts > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.settings.notificationHubAttempts.replace('{count}', String(item.attempts))}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
