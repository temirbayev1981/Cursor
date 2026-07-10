import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { TableSkeleton } from '@/components/shared/skeleton'
import { useEmployees } from '@/hooks/use-entities'
import { calculateTrueHourlyCost, formatCurrency, getInitials } from '@/lib/utils'
import { useTranslation } from '@/contexts/locale-context'

export default function TechniciansPage() {
  const { t } = useTranslation()
  const { data: employees = [], isLoading } = useEmployees()
  const techs = employees.filter((e) => e.billing_rate > 0 && e.is_active)

  if (isLoading) return <TableSkeleton rows={3} cols={3} />

  return (
    <div>
      <PageHeader
        title={t.technicians.title}
        description={t.technicians.description}
        actions={<Button><Plus className="h-4 w-4" />{t.technicians.addTechnician}</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {techs.map((tech) => {
          const trueCost = calculateTrueHourlyCost(tech)
          const margin = ((tech.billing_rate - trueCost) / tech.billing_rate) * 100

          return (
            <Card key={tech.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{getInitials(tech.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{tech.name}</p>
                    <p className="text-sm text-muted-foreground">{tech.role}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {tech.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-[10px]">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.technicians.wage}</span>
                    <span>{formatCurrency(tech.hourly_wage)}/{t.common.hr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.technicians.trueCost}</span>
                    <span className="font-medium text-warning">{formatCurrency(trueCost)}/{t.common.hr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.technicians.billingRate}</span>
                    <span className="font-medium text-primary">{formatCurrency(tech.billing_rate)}/{t.common.hr}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground">{t.technicians.margin}</span>
                    <Badge variant={margin >= 50 ? 'success' : 'warning'}>{margin.toFixed(0)}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
