import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, DataTableRow, DataTableCell } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DEMO_CUSTOMERS } from '@/data/mock-data'
import { formatCurrency } from '@/lib/utils'

export default function CustomersPage() {
  const [search, setSearch] = useState('')

  const filtered = DEMO_CUSTOMERS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title="Customers"
        description="CRM — manage customers, history, and communications"
        actions={<Button><Plus className="h-4 w-4" />Add Customer</Button>}
      />

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search customers..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable headers={['Customer', 'Type', 'Contact', 'Jobs', 'Revenue', 'Since']}>
        {filtered.map((customer) => (
          <DataTableRow key={customer.id}>
            <DataTableCell>
              <div>
                <p className="font-medium">{customer.name}</p>
                <p className="text-xs text-muted-foreground">{customer.address}</p>
              </div>
            </DataTableCell>
            <DataTableCell>
              <Badge variant="outline">{customer.type.replace('_', ' ')}</Badge>
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
              {new Date(customer.created_at).toLocaleDateString()}
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTable>
    </div>
  )
}
