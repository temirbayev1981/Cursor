import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, Mail, MessageSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'
import {
  clearNotificationQueue,
  getNotificationQueue,
  type NotificationPayload,
} from '@/services/notification-service'

function channelIcon(channel: NotificationPayload['channel']) {
  if (channel === 'sms') return MessageSquare
  return Mail
}

export function NotificationBell() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [queue, setQueue] = useState<NotificationPayload[]>(() => getNotificationQueue())
  const panelRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(() => {
    setQueue(getNotificationQueue())
  }, [])

  useEffect(() => {
    if (!open) return
    refresh()
    const id = window.setInterval(refresh, 4000)
    return () => window.clearInterval(id)
  }, [open, refresh])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const handleClear = () => {
    clearNotificationQueue()
    refresh()
  }

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        aria-label={t.header.notifications}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-5 w-5" />
        {queue.length > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {queue.length > 9 ? '9+' : queue.length}
          </span>
        )}
      </Button>

      {open && (
        <div
          className={cn(
            'absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-border',
            'bg-background/95 shadow-lg backdrop-blur-xl',
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">{t.header.notifications}</p>
            <div className="flex items-center gap-1">
              {queue.length > 0 && (
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleClear}>
                  {t.header.clearNotifications}
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {queue.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                {t.header.noNotifications}
              </p>
            ) : (
              queue.slice(0, 8).map((item, index) => {
                const Icon = channelIcon(item.channel)
                return (
                  <div
                    key={`${item.to}-${item.metadata?.sent_at ?? index}`}
                    className="rounded-lg px-3 py-2.5 hover:bg-secondary/40"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate text-xs font-medium">{item.to}</span>
                      {item.metadata?.sent_at && (
                        <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
                          {t.header.queuedLocally}
                        </Badge>
                      )}
                    </div>
                    {item.subject && (
                      <p className="truncate text-sm font-medium">{item.subject}</p>
                    )}
                    <p className="line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
