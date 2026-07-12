import { Plus, Search, X, Link2, Pencil } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { TablePagination } from '@/components/shared/table-pagination'
import { TableSkeleton } from '@/components/shared/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomerForm } from '@/components/forms/customer-form'
import { useAuth } from '@/contexts/auth-context'
import { useSaveCustomer } from '@/hooks/use-entities'
import { useServerEntityTable } from '@/hooks/use-server-entity-table'
import { formatCurrency } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'
import { useDateLocale } from '@/hooks/use-date-locale'
import { toast } from 'sonner'
import type { Customer } from '@/types'
import { createPortalLink } from '@/services/portal-service'
import { saveCustomerNotificationPreferences, customerAllowsNotification } from '@/lib/customer-notification-prefs'

const CUSTOMER_TYPE_KEYS = ['residential', 'commercial', 'property_management'] as const

export default function CustomersPage() {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const { company } = useAuth()
  const companyId = company?.id ?? ''
  const { isLoading, pagination } = useServerEntityTable('customers', { search })
  const saveCustomer = useSaveCustomer()

  if (isLoading) return <TableSkeleton />

  const getCustomerTypeLabel = (type: string) => {
    if (CUSTOMER_TYPE_KEYS.includes(type as typeof CUSTOMER_TYPE_KEYS[number])) {
      return t.customers[type as typeof CUSTOMER_TYPE_KEYS[number]]
    }
    return type
  }

  const handleSave = (customer: Customer) => {
    saveCustomer.mutate(customer, {
      onSuccess: () => {
        const prefs = customer.notification_preferences
        if (prefs) {
          saveCustomerNotificationPreferences(customer.id, {
            email: prefs.email ?? true,
            sms: prefs.sms ?? false,
          })
        }
        toast.success(t.common.save)
        setShowForm(false)
        setEditingCustomer(null)
      },
    })
  }

  const openCreateForm = () => {
    setEditingCustomer(null)
    setShowForm(true)
  }

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer)
    setShowForm(true)
  }

  const handlePortalLink = async (customer: Customer, portalType: 'customer' | 'property') => {
    try {
      const { url } = await createPortalLink(companyId, customer.id, portalType, customer.email)
      await navigator.clipboard.writeText(url)
      toast.success(t.customers.portalLinkCopied)
    } catch {
      toast.error(t.customers.linkFailed)
    }
  }

  return (
    <div>
      <PageHeader
        title={t.customers.title}
        description={t.customers.description}
        actions={<Button onClick={openCreateForm}><Plus className="h-4 w-4" />{t.customers.addCustomer}</Button>}
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingCustomer ? t.common.edit : t.customers.addCustomer}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingCustomer(null) }}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <CustomerForm
              companyId={companyId}
              initial={editingCustomer ?? undefined}
              onSubmit={handleSave}
              onCancel={() => { setShowForm(false); setEditingCustomer(null) }}
            />
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={t.customers.search} className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="customers-search" />
      </div>

      <div className="md:hidden space-y-3">
        {pagination.paginatedItems.map((customer) => (
          <Card key={customer.id} className="p-4" data-testid={`customer-card-${customer.id}`}>
            <div className="space-y-3">
              <div>
                <p className="font-medium">{customer.name}</p>
                <p className="text-sm text-muted-foreground">{customer.address}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {!customerAllowsNotification(customer.id, 'email', customer) && (
                    <Badge variant="secondary" className="text-xs" data-testid={`customer-email-optout-${customer.id}`}>
                      {t.customers.emailOptOut}
                    </Badge>
                  )}
                  {!customerAllowsNotification(customer.id, 'sms', customer) && (
                    <Badge variant="secondary" className="text-xs" data-testid={`customer-sms-optout-${customer.id}`}>
                      {t.customers.smsOptOut}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                <span className="text-muted-foreground">{t.customers.type}</span>
                <Badge variant="outline" className="w-fit">{getCustomerTypeLabel(customer.type)}</Badge>
                <span className="text-muted-foreground">{t.customers.contact}</span>
                <span>
                  <span className="block">{customer.email}</span>
                  <span className="text-muted-foreground">{customer.phone}</span>
                </span>
                <span className="text-muted-foreground">{t.customers.jobs}</span>
                <span>{customer.job_count}</span>
                <span className="text-muted-foreground">{t.customers.revenue}</span>
                <span className="font-medium">{formatCurrency(customer.total_revenue)}</span>
                <span className="text-muted-foreground">{t.common.since}</span>
                <span>{new Date(customer.created_at).toLocaleDateString(dateLocale)}</span>
              </div>
              <div className="flex gap-1 pt-1">
                <Button
                  variant="ghost"
                  size="icon"
                  title={t.common.edit}
                  data-testid={`customer-edit-${customer.id}`}
                  onClick={() => openEditForm(customer)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title={t.customers.copyPortalLink}
                  data-testid={`customer-portal-link-${customer.id}`}
                  onClick={() => void handlePortalLink(customer, customer.type === 'property_management' ? 'property' : 'customer')}
                >
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        <TablePagination pagination={pagination} testId="customers-pagination-mobile" />
      </div>

      <div className="hidden md:block">
      <DataTable
        headers={[t.customers.customer, t.customers.type, t.customers.contact, t.customers.jobs, t.customers.revenue, t.common.since, '']}
        pagination={pagination}
        paginationTestId="customers-pagination"
      >
        {pagination.paginatedItems.map((customer) => (
          <DataTableRow key={customer.id}>
            <DataTableCell>
              <div>
                <p className="font-medium">{customer.name}</p>
                <p className="text-xs text-muted-foreground">{customer.address}</p>
                {!customerAllowsNotification(customer.id, 'email', customer) && (
                  <Badge
                    variant="secondary"
                    className="mt-1 text-xs"
                    data-testid={`customer-email-optout-${customer.id}`}
                  >
                    {t.customers.emailOptOut}
                  </Badge>
                )}
                {!customerAllowsNotification(customer.id, 'sms', customer) && (
                  <Badge
                    variant="secondary"
                    className="mt-1 text-xs"
                    data-testid={`customer-sms-optout-${customer.id}`}
                  >
                    {t.customers.smsOptOut}
                  </Badge>
                )}
              </div>
            </DataTableCell>
            <DataTableCell>
              <Badge variant="outline">{getCustomerTypeLabel(customer.type)}</Badge>
            </DataTableCell>
            <DataTableCell>
              <div className="text-sm">
                <p>{customer.email}</p>
                <p className="text-muted-foreground">{customer.phone}</p>
              </div>
            </DataTableCell>
            <DataTableCell>{customer.job_count}</DataTableCell>
            <DataTableCell className="font-medium">{formatCurrency(customer.total_revenue)}</DataTableCell>
            <DataTableCell className="text-muted-foreground">
              {new Date(customer.created_at).toLocaleDateString(dateLocale)}
            </DataTableCell>
            <DataTableCell>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  title={t.common.edit}
                  data-testid={`customer-edit-${customer.id}`}
                  onClick={() => openEditForm(customer)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title={t.customers.copyPortalLink}
                  data-testid={`customer-portal-link-${customer.id}`}
                  onClick={() => void handlePortalLink(customer, customer.type === 'property_management' ? 'property' : 'customer')}
                >
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTable>
      </div>
    </div>
  )
}
