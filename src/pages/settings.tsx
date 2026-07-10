import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from '@/contexts/locale-context'

const INTEGRATION_KEYS = ['stripe', 'maps', 'email', 'quickbooks'] as const
const INTEGRATION_STATUS = {
  stripe: 'connected',
  maps: 'connected',
  email: 'configure',
  quickbooks: 'comingSoon',
} as const

export default function SettingsPage() {
  const { company } = useAuth()
  const { t } = useTranslation()

  const plans = [
    { key: 'starter' as const, price: 49, current: false },
    { key: 'professional' as const, price: 99, current: true },
    { key: 'enterprise' as const, price: 199, current: false },
  ]

  const getIntegrationStatus = (key: typeof INTEGRATION_KEYS[number]) => {
    const status = INTEGRATION_STATUS[key]
    if (status === 'connected') return t.common.connected
    if (status === 'configure') return t.common.configure
    return t.common.comingSoon
  }

  const getRoleDescription = (index: number) => {
    if (index === 0) return t.common.fullAccess
    if (index === 3) return t.common.jobsTimeTracking
    return t.common.moduleBased
  }

  return (
    <div>
      <PageHeader title={t.settings.title} description={t.settings.description} />

      <Tabs defaultValue="company">
        <TabsList className="mb-6">
          <TabsTrigger value="company">{t.settings.company}</TabsTrigger>
          <TabsTrigger value="billing">{t.settings.billing}</TabsTrigger>
          <TabsTrigger value="integrations">{t.settings.integrations}</TabsTrigger>
          <TabsTrigger value="team">{t.settings.team}</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader><CardTitle>{t.settings.companyInfo}</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div><Label>{t.settings.companyName}</Label><Input defaultValue={company?.name} className="mt-1" /></div>
              <div><Label>{t.auth.email}</Label><Input defaultValue={company?.email} className="mt-1" /></div>
              <div><Label>{t.onboarding.phone}</Label><Input defaultValue={company?.phone} className="mt-1" /></div>
              <div><Label>{t.onboarding.address}</Label><Input defaultValue={company?.address} className="mt-1" /></div>
              <Button>{t.settings.saveChanges}</Button>
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
              const integration = t.settings.integrationsList[key]
              const status = INTEGRATION_STATUS[key]
              return (
                <Card key={key}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-sm text-muted-foreground">{integration.desc}</p>
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
                    <span className="text-sm text-muted-foreground">
                      {getRoleDescription(index)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
