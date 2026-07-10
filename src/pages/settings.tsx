import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'

const PLANS = [
  { name: 'Starter', price: 49, features: ['5 users', '100 jobs/mo', 'Basic reporting'] },
  { name: 'Professional', price: 99, features: ['15 users', 'Unlimited jobs', 'AI features', 'Route optimization'], current: true },
  { name: 'Enterprise', price: 199, features: ['Unlimited users', 'White label', 'API access', 'Priority support'] },
]

export default function SettingsPage() {
  const { company } = useAuth()

  return (
    <div>
      <PageHeader title="Settings" description="Company configuration and subscription" />

      <Tabs defaultValue="company">
        <TabsList className="mb-6">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="team">Team & Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div><Label>Company Name</Label><Input defaultValue={company?.name} className="mt-1" /></div>
              <div><Label>Email</Label><Input defaultValue={company?.email} className="mt-1" /></div>
              <div><Label>Phone</Label><Input defaultValue={company?.phone} className="mt-1" /></div>
              <div><Label>Address</Label><Input defaultValue={company?.address} className="mt-1" /></div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <Card key={plan.name} className={plan.current ? 'border-primary' : ''}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{plan.name}</h3>
                    {plan.current && <Badge>Current</Badge>}
                  </div>
                  <p className="text-3xl font-bold mb-4">${plan.price}<span className="text-sm text-muted-foreground">/mo</span></p>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                    {plan.features.map((f) => (
                      <li key={f}>✓ {f}</li>
                    ))}
                  </ul>
                  {!plan.current && <Button variant="outline" className="w-full">Upgrade</Button>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Stripe', desc: 'Payment processing', status: 'Connected' },
              { name: 'Google Maps', desc: 'Route optimization', status: 'Connected' },
              { name: 'Email (IMAP)', desc: 'Work order import', status: 'Configure' },
              { name: 'QuickBooks', desc: 'Accounting sync', status: 'Coming Soon' },
            ].map((int) => (
              <Card key={int.name}>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{int.name}</p>
                    <p className="text-sm text-muted-foreground">{int.desc}</p>
                  </div>
                  <Badge variant={int.status === 'Connected' ? 'success' : 'outline'}>{int.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader><CardTitle>Roles & Permissions</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['Owner', 'Admin', 'Dispatcher', 'Technician', 'Accountant', 'Customer'].map((role) => (
                  <div key={role} className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
                    <span className="font-medium">{role}</span>
                    <span className="text-sm text-muted-foreground">
                      {role === 'Owner' ? 'Full access' : role === 'Technician' ? 'Jobs, time tracking' : 'Module-based'}
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
