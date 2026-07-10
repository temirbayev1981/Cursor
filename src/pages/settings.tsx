import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Sun, Moon, Copy } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'
import { useTranslation } from '@/contexts/locale-context'
import { hasStripe, hasGoogleMaps, hasOpenAI, hasSupabase, hasNotificationConfigured, hasSmsConfigured } from '@/lib/env'
import { useImportSampleData, useAuditLogs } from '@/hooks/use-entities'
import { logAudit } from '@/services/entity-service'
import { getNotificationQueue } from '@/services/notification-service'
import { getErrorReports } from '@/lib/observability'
import { computePlatformHealth } from '@/lib/platform-health'
import { computePlatformAudit } from '@/lib/platform-audit'
import { computeSystemMetrics } from '@/lib/system-metrics'
import { getStoredCompany } from '@/services/onboarding-service'
import { createTeamInvite, listTeamInvites, type TeamInvite } from '@/services/invite-service'
import { startSubscriptionCheckout, updateCompanySubscription, PLAN_PRICES } from '@/services/billing-service'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { UserRole, SubscriptionPlan } from '@/types'

const INVITE_ROLES: UserRole[] = ['admin', 'dispatcher', 'technician', 'accountant']

const INTEGRATION_KEYS = ['stripe', 'maps', 'openai', 'supabase', 'email', 'sms'] as const

export default function SettingsPage() {
  const { company, user, updateCompanyDetails } = useAuth()
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const stored = getStoredCompany()
  const base = stored ?? company
  const companyId = base?.id ?? 'comp-001'

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('technician')
  const [pendingInvites, setPendingInvites] = useState<TeamInvite[]>([])
  const [inviteLoading, setInviteLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>(base?.subscription_plan ?? 'professional')
  const [companySaving, setCompanySaving] = useState(false)
  const [upgradingPlan, setUpgradingPlan] = useState<SubscriptionPlan | null>(null)

  const [companyForm, setCompanyForm] = useState({
    name: base?.name ?? '',
    email: base?.email ?? '',
    phone: base?.phone ?? '',
    address: base?.address ?? '',
  })

  const integrationStatus: Record<typeof INTEGRATION_KEYS[number], 'connected' | 'configure' | 'comingSoon'> = {
    stripe: hasStripe ? 'connected' : 'configure',
    maps: hasGoogleMaps ? 'connected' : 'configure',
    openai: hasOpenAI ? 'connected' : 'configure',
    supabase: hasSupabase ? 'connected' : 'configure',
    email: hasNotificationConfigured ? 'connected' : 'configure',
    sms: hasSmsConfigured ? 'connected' : 'configure',
  }

  const importSampleData = useImportSampleData()

  useEffect(() => {
    void listTeamInvites(companyId).then(setPendingInvites)
  }, [companyId])

  useEffect(() => {
    setCurrentPlan(base?.subscription_plan ?? 'professional')
  }, [base?.subscription_plan])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const subscribed = params.get('subscription') as SubscriptionPlan | null
    if (subscribed && ['starter', 'professional', 'enterprise'].includes(subscribed)) {
      void updateCompanySubscription(companyId, subscribed).then((updated) => {
        setCurrentPlan(updated.subscription_plan)
        toast.success(t.settings.planUpgraded.replace('{plan}', subscribed))
      })
      window.history.replaceState({}, '', '/settings')
    }
  }, [companyId, t.settings.planUpgraded])

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (plan === currentPlan) return
    setUpgradingPlan(plan)
    try {
      const result = await startSubscriptionCheckout(plan, companyId)
      if (result === 'updated') {
        setCurrentPlan(plan)
        toast.success(t.settings.planUpgraded.replace('{plan}', plan))
      } else if (result === 'error') {
        toast.error(t.settings.checkoutFailed)
      }
    } finally {
      setUpgradingPlan(null)
    }
  }

  const handleSendInvite = async () => {
    if (!inviteEmail.includes('@')) return
    setInviteLoading(true)
    try {
      const { url, invite } = await createTeamInvite(companyId, inviteEmail, inviteRole, user?.id)
      await navigator.clipboard.writeText(url)
      if (user) void logAudit(companyId, user.id, 'team.invite_sent', 'team_invite', invite.id)
      toast.success(t.settings.inviteLinkCopied)
      setInviteEmail('')
      const invites = await listTeamInvites(companyId)
      setPendingInvites(invites)
    } catch {
      toast.error(t.settings.inviteFailed)
    } finally {
      setInviteLoading(false)
    }
  }

  const plans: { key: SubscriptionPlan; price: number }[] = [
    { key: 'starter', price: PLAN_PRICES.starter },
    { key: 'professional', price: PLAN_PRICES.professional },
    { key: 'enterprise', price: PLAN_PRICES.enterprise },
  ]

  const getIntegrationStatus = (key: typeof INTEGRATION_KEYS[number]) => {
    const status = integrationStatus[key]
    if (status === 'connected') return t.common.connected
    if (status === 'configure') return t.common.configure
    return t.common.comingSoon
  }

  const getRoleDescription = (index: number) => {
    if (index === 0) return t.common.fullAccess
    if (index === 3) return t.common.jobsTimeTracking
    return t.common.moduleBased
  }

  const handleSaveCompany = async () => {
    setCompanySaving(true)
    try {
      await updateCompanyDetails(companyForm)
      toast.success(t.settings.saveChanges)
    } catch {
      toast.error(t.settings.companySaveFailed)
    } finally {
      setCompanySaving(false)
    }
  }

  const notifications = getNotificationQueue().slice(0, 5)
  const errors = getErrorReports().slice(0, 5)
  const platformHealth = computePlatformHealth()
  const platformAudit = computePlatformAudit()
  const systemMetrics = computeSystemMetrics()
  const { data: auditLogs = [] } = useAuditLogs()

  const systemStatusLabel = {
    healthy: t.settings.systemHealthy,
    degraded: t.settings.systemDegraded,
    critical: t.settings.systemCritical,
  }[systemMetrics.status]

  return (
    <div>
      <PageHeader title={t.settings.title} description={t.settings.description} />

      <Tabs defaultValue="company">
        <TabsList className="mb-6">
          <TabsTrigger value="company">{t.settings.company}</TabsTrigger>
          <TabsTrigger value="billing">{t.settings.billing}</TabsTrigger>
          <TabsTrigger value="integrations">{t.settings.integrations}</TabsTrigger>
          <TabsTrigger value="team">{t.settings.team}</TabsTrigger>
          <TabsTrigger value="system">{t.settings.systemTab}</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader><CardTitle>{t.settings.companyInfo}</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div><Label>{t.settings.companyName}</Label><Input className="mt-1" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} /></div>
              <div><Label>{t.auth.email}</Label><Input className="mt-1" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} /></div>
              <div><Label>{t.onboarding.phone}</Label><Input className="mt-1" value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} /></div>
              <div><Label>{t.onboarding.address}</Label><Input className="mt-1" value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} /></div>
              <div className="flex items-center justify-between rounded-lg bg-secondary/30 p-4">
                <div>
                  <p className="font-medium">{theme === 'dark' ? t.settings.themeDark : t.settings.themeLight}</p>
                  <p className="text-sm text-muted-foreground">
                    {theme === 'dark' ? t.settings.themeSwitchToLight : t.settings.themeSwitchToDark}
                  </p>
                </div>
                <Button variant="outline" size="icon" data-testid="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={() => void handleSaveCompany()} disabled={companySaving}>{t.settings.saveChanges}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const planData = t.settings.plans[plan.key]
              const isCurrent = currentPlan === plan.key
              return (
                <Card key={plan.key} className={isCurrent ? 'border-primary' : ''} data-testid={`billing-plan-${plan.key}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">{planData.name}</h3>
                      {isCurrent && <Badge>{t.common.current}</Badge>}
                    </div>
                    <p className="text-3xl font-bold mb-4">${plan.price}<span className="text-sm text-muted-foreground">{t.common.perMonth}</span></p>
                    <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                      {planData.features.map((f) => (
                        <li key={f}>✓ {f}</li>
                      ))}
                    </ul>
                    {!isCurrent && (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={upgradingPlan === plan.key}
                        data-testid={`billing-upgrade-${plan.key}`}
                        onClick={() => void handleUpgrade(plan.key)}
                      >
                        {upgradingPlan === plan.key ? '...' : t.common.upgrade}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INTEGRATION_KEYS.map((key) => {
              const card = t.settings.integrationCards[key]
              const status = integrationStatus[key]
              return (
                <Card key={key}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{card.name}</p>
                      <p className="text-sm text-muted-foreground">{card.desc}</p>
                    </div>
                    <Badge variant={status === 'connected' ? 'success' : 'outline'}>{getIntegrationStatus(key)}</Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="team">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>{t.settings.inviteMember}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t.settings.inviteEmail}</Label>
                  <Input
                    className="mt-1"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="tech@company.com"
                    data-testid="team-invite-email"
                  />
                </div>
                <div>
                  <Label>{t.settings.inviteRole}</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INVITE_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => void handleSendInvite()} disabled={inviteLoading || !inviteEmail.includes('@')} data-testid="team-invite-submit">
                  {t.settings.sendInvite}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t.settings.pendingInvites}</CardTitle></CardHeader>
              <CardContent className="space-y-2" data-testid="team-pending-invites">
                {pendingInvites.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.settings.noPendingInvites}</p>
                ) : (
                  pendingInvites.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between rounded-lg bg-secondary/30 p-3 text-sm">
                      <div>
                        <p className="font-medium">{inv.email}</p>
                        <p className="text-muted-foreground">
                          {inv.role} · {t.settings.inviteExpires} {new Date(inv.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const url = `${window.location.origin}/login?invite=${inv.token}`
                          void navigator.clipboard.writeText(url)
                          toast.success(t.settings.inviteLinkCopied)
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>{t.settings.rolesPermissions}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {t.settings.roles.map((role, index) => (
                    <div key={role} className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
                      <span className="font-medium">{role}</span>
                      <span className="text-sm text-muted-foreground">{getRoleDescription(index)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="md:col-span-2">
              <CardHeader><CardTitle>{t.settings.platformAudit}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold">{platformAudit.score}/10</div>
                  <div>
                    <Badge variant={platformAudit.readyForProduction ? 'success' : 'outline'}>
                      {platformAudit.grade}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">{t.settings.auditSummary[platformAudit.summaryKey]}</p>
                  </div>
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {platformAudit.recommendationIds.map((id) => (
                    <li key={id}>• {t.settings.auditRecommendations[id]}</li>
                  ))}
                </ul>
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
            {hasSupabase && (
              <Card className="md:col-span-2">
                <CardHeader><CardTitle>{t.settings.supabaseCard}</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    {t.settings.importSampleDesc}
                  </p>
                  <Button
                    variant="outline"
                    disabled={importSampleData.isPending}
                    onClick={() => importSampleData.mutate(undefined, {
                      onSuccess: (r) => toast.success(`${t.settings.imported}: ${r.imported}`),
                      onError: (e) => toast.error(e.message),
                    })}
                  >
                    {t.settings.importSampleData}
                  </Button>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle>{t.settings.auditLog} ({auditLogs.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm max-h-64 overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <p className="text-muted-foreground">{t.common.noData}</p>
                ) : (
                  auditLogs.slice(0, 20).map((log) => (
                    <div key={log.id} className="rounded bg-secondary/30 p-2">
                      <p className="font-medium">{log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.entity_type} · {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t.settings.notificationsPanel.replace('{count}', String(notifications.length))}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {notifications.length === 0 ? <p className="text-muted-foreground">{t.settings.notificationQueueEmpty}</p> : notifications.map((n, i) => (
                  <div key={i} className="rounded bg-secondary/30 p-2">
                    <Badge variant="outline" className="mb-1">{n.channel}</Badge>
                    <p className="truncate">{n.subject ?? n.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
