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
import { useImportDemoSeed } from '@/hooks/use-entities'
import { getNotificationQueue } from '@/services/notification-service'
import { getErrorReports } from '@/lib/observability'
import { getStoredCompany } from '@/services/onboarding-service'
import { createTeamInvite, listTeamInvites, type TeamInvite } from '@/services/invite-service'
import { startSubscriptionCheckout, updateCompanySubscription, PLAN_PRICES } from '@/services/billing-service'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { UserRole, SubscriptionPlan } from '@/types'

const INVITE_ROLES: UserRole[] = ['admin', 'dispatcher', 'technician', 'accountant']

const INTEGRATION_KEYS = ['stripe', 'maps', 'openai', 'supabase', 'email'] as const

export default function SettingsPage() {
  const { company, user } = useAuth()
  const { t, locale } = useTranslation()
  const { theme, setTheme } = useTheme()
  const stored = getStoredCompany()
  const base = stored ?? company
  const companyId = base?.id ?? 'comp-001'

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('technician')
  const [pendingInvites, setPendingInvites] = useState<TeamInvite[]>([])
  const [inviteLoading, setInviteLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>(base?.subscription_plan ?? 'professional')
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
    email: hasNotificationConfigured || hasSmsConfigured ? 'connected' : 'configure',
  }

  const importDemoSeed = useImportDemoSeed()

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
        toast.success(locale === 'ru' ? `План обновлён: ${subscribed}` : `Plan upgraded: ${subscribed}`)
      })
      window.history.replaceState({}, '', '/settings')
    }
  }, [companyId, locale])

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (plan === currentPlan) return
    setUpgradingPlan(plan)
    try {
      const result = await startSubscriptionCheckout(plan, companyId)
      if (result === 'demo') {
        const updated = await updateCompanySubscription(companyId, plan)
        setCurrentPlan(updated.subscription_plan)
        toast.success(locale === 'ru' ? 'План обновлён (демо)' : 'Plan upgraded (demo)')
      } else if (result === 'error') {
        toast.error(locale === 'ru' ? 'Ошибка оплаты' : 'Checkout failed')
      }
    } finally {
      setUpgradingPlan(null)
    }
  }

  const handleSendInvite = async () => {
    if (!inviteEmail.includes('@')) return
    setInviteLoading(true)
    try {
      const { url } = await createTeamInvite(companyId, inviteEmail, inviteRole, user?.id)
      await navigator.clipboard.writeText(url)
      toast.success(t.settings.inviteLinkCopied)
      setInviteEmail('')
      const invites = await listTeamInvites(companyId)
      setPendingInvites(invites)
    } catch {
      toast.error(locale === 'ru' ? 'Ошибка приглашения' : 'Invite failed')
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

  const handleSaveCompany = () => {
    const updated = { ...base!, ...companyForm }
    localStorage.setItem('handymanos_company', JSON.stringify(updated))
    toast.success(t.settings.saveChanges)
  }

  const notifications = getNotificationQueue().slice(0, 5)
  const errors = getErrorReports().slice(0, 5)

  return (
    <div>
      <PageHeader title={t.settings.title} description={t.settings.description} />

      <Tabs defaultValue="company">
        <TabsList className="mb-6">
          <TabsTrigger value="company">{t.settings.company}</TabsTrigger>
          <TabsTrigger value="billing">{t.settings.billing}</TabsTrigger>
          <TabsTrigger value="integrations">{t.settings.integrations}</TabsTrigger>
          <TabsTrigger value="team">{t.settings.team}</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
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
                  <p className="font-medium">{theme === 'dark' ? (locale === 'ru' ? 'Тёмная тема' : 'Dark mode') : (locale === 'ru' ? 'Светлая тема' : 'Light mode')}</p>
                  <p className="text-sm text-muted-foreground">
                    {theme === 'dark' ? (locale === 'ru' ? 'Переключить на светлую тему' : 'Switch to light theme') : (locale === 'ru' ? 'Переключить на тёмную тему' : 'Switch to dark theme')}
                  </p>
                </div>
                <Button variant="outline" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={handleSaveCompany}>{t.settings.saveChanges}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const planData = t.settings.plans[plan.key]
              const isCurrent = currentPlan === plan.key
              return (
                <Card key={plan.key} className={isCurrent ? 'border-primary' : ''}>
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
              const labels: Record<typeof key, { name: string; desc: string }> = {
                stripe: { name: 'Stripe', desc: 'Online payments' },
                maps: { name: 'Google Maps', desc: 'Routing & dispatch map' },
                openai: { name: 'OpenAI', desc: 'AI work order parsing' },
                supabase: { name: 'Supabase', desc: 'Database & auth' },
                email: { name: 'Email/SMS', desc: 'Customer notifications' },
              }
              const status = integrationStatus[key]
              return (
                <Card key={key}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{labels[key].name}</p>
                      <p className="text-sm text-muted-foreground">{labels[key].desc}</p>
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
                <Button onClick={() => void handleSendInvite()} disabled={inviteLoading || !inviteEmail.includes('@')}>
                  {t.settings.sendInvite}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t.settings.pendingInvites}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
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
            {hasSupabase && (
              <Card className="md:col-span-2">
                <CardHeader><CardTitle>Supabase</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    {locale === 'ru'
                      ? 'Импорт демо-данных в подключённую базу Supabase (клиенты, заказы, сметы, счета).'
                      : 'Import demo data into your connected Supabase database (customers, jobs, estimates, invoices).'}
                  </p>
                  <Button
                    variant="outline"
                    disabled={importDemoSeed.isPending}
                    onClick={() => importDemoSeed.mutate(undefined, {
                      onSuccess: (r) => toast.success(`${locale === 'ru' ? 'Импортировано' : 'Imported'}: ${r.imported}`),
                      onError: (e) => toast.error(e.message),
                    })}
                  >
                    {locale === 'ru' ? 'Импорт демо-данных' : 'Import demo data'}
                  </Button>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle>Notifications ({notifications.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {notifications.length === 0 ? <p className="text-muted-foreground">Очередь пуста</p> : notifications.map((n, i) => (
                  <div key={i} className="rounded bg-secondary/30 p-2">
                    <Badge variant="outline" className="mb-1">{n.channel}</Badge>
                    <p className="truncate">{n.subject ?? n.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Error reports ({errors.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {errors.length === 0 ? <p className="text-muted-foreground">Нет ошибок</p> : errors.map((e, i) => (
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
