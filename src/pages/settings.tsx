import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'
import { useTranslation } from '@/contexts/locale-context'
import { hasStripe, hasGoogleMaps, hasOpenAI, hasSupabase } from '@/lib/env'
import { getNotificationQueue } from '@/services/notification-service'
import { getErrorReports } from '@/lib/observability'
import { getStoredCompany } from '@/services/onboarding-service'
import { toast } from 'sonner'

const INTEGRATION_KEYS = ['stripe', 'maps', 'openai', 'supabase', 'email'] as const

export default function SettingsPage() {
  const { company } = useAuth()
  const { t, locale } = useTranslation()
  const { theme, setTheme } = useTheme()
  const stored = getStoredCompany()
  const base = stored ?? company

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
    email: 'configure',
  }

  const plans = [
    { key: 'starter' as const, price: 49, current: false },
    { key: 'professional' as const, price: 99, current: true },
    { key: 'enterprise' as const, price: 199, current: false },
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
              return (
                <Card key={plan.key} className={plan.current ? 'border-primary' : ''}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">{planData.name}</h3>
                      {plan.current && <Badge>{t.common.current}</Badge>}
                    </div>
                    <p className="text-3xl font-bold mb-4">${plan.price}<span className="text-sm text-muted-foreground">{t.common.perMonth}</span></p>
                    <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                      {planData.features.map((f) => (
                        <li key={f}>✓ {f}</li>
                      ))}
                    </ul>
                    {!plan.current && <Button variant="outline" className="w-full">{t.common.upgrade}</Button>}
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
          <Card>
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
        </TabsContent>

        <TabsContent value="system">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
