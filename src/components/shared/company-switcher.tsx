import { Building2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from '@/contexts/locale-context'
import { listAccessibleCompanies } from '@/services/company-service'
import { DEMO_MODE } from '@/lib/supabase'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface CompanySwitcherProps {
  collapsed?: boolean
}

export function CompanySwitcher({ collapsed }: CompanySwitcherProps) {
  const { company, switchCompany } = useAuth()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const companies = listAccessibleCompanies()

  if (!DEMO_MODE || companies.length < 2) return null

  const handleChange = async (companyId: string) => {
    if (companyId === company?.id) return
    await switchCompany(companyId)
    await queryClient.invalidateQueries()
    toast.success(t.settings.companySwitched)
  }

  if (collapsed) {
    return (
      <div className="mb-3 flex justify-center" title={company?.name}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mb-3">
      <Select value={company?.id} onValueChange={(value) => void handleChange(value)}>
        <SelectTrigger className="w-full h-9 text-xs">
          <SelectValue placeholder={t.settings.switchCompany} />
        </SelectTrigger>
        <SelectContent>
          {companies.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
