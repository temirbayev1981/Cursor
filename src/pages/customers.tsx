import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { TableSkeleton } from '@/components/shared/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useCustomers } from '@/hooks/use-entities'
import { formatCurrency } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'

const CUSTOMER_TYPE_KEYS = ['residential', 'commercial', 'property_management'] as const

export default function CustomersPage() {
  const { t, locale } = useTranslation()
  const dateLocale = locale === 'ru' ? 'ru-RU' : 'en-US'
  const [search, setSearch] = useState('')
  const { data: customers = [], isLoading } = useCustomers()

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <TableSkeleton />

  const getCustomerTypeLabel = (type: string) => {
    if (CUSTOMER_TYPE_KEYS.includes(type as typeof CUSTOMER_TYPE_KEYS[number])) {
      return t.customers[type as typeof CUSTOMER_TYPE_KEYS[number]]
    }
    return type
  }

  return (
    <div>
      <PageHeader
        title={t.customers.title}
        description={t.customers.description}
        actions={<Button><Plus className="h-4 w-4" />{t.customers.addCustomer}</Button>}
      />

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={t.customers.search} className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable headers={[t.customers.customer, t.customers.type, t.customers.contact, t.customers.jobs, t.customers.revenue, t.common.since]}>
        {filtered.map((customer) => (
          <DataTableRow key={customer.id}>
            <DataTableCell>
              <div>
                <p className="font-medium">{customer.name}</p>
                <p className="text-xs text-muted-foreground">{customer.address}</p>
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
          </DataTableRow>
        ))}
      </DataTable>
    </div>
  )
}
