import { useState } from 'react'
import { ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DEMO_SCHEDULE, DEMO_EMPLOYEES } from '@/data/mock-data'
import { addDays, format, startOfWeek, isSameDay } from 'date-fns'

export default function SchedulingPage() {
  const [view, setView] = useState<'day' | 'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date('2026-07-10'))

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getEventsForDay = (day: Date) =>
    DEMO_SCHEDULE.filter((e) => isSameDay(new Date(e.start_time), day))

  return (
    <div>
      <PageHeader
        title="Scheduling"
        description="Drag-and-drop calendar with route optimization"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="flex gap-4 mb-6">
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const events = getEventsForDay(day)
              const isToday = isSameDay(day, new Date('2026-07-10'))
              return (
                <Card key={day.toISOString()} className={isToday ? 'border-primary/50' : ''}>
                  <CardContent className="p-3">
                    <div className="text-center mb-3">
                      <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
                      <p className={`text-lg font-bold ${isToday ? 'text-primary' : ''}`}>{format(day, 'd')}</p>
                    </div>
                    <div className="space-y-2">
                      {events.map((event) => {
                        const tech = DEMO_EMPLOYEES.find((e) => e.id === event.technician_id)
                        return (
                          <div key={event.id} className="rounded-lg bg-primary/10 p-2 text-xs cursor-grab">
                            <p className="font-medium truncate">{event.title}</p>
                            <p className="text-muted-foreground">{tech?.name}</p>
                            <p className="text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(event.start_time), 'h:mm a')}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Route Optimization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Today's optimized route saves 12 miles and 28 minutes.</p>
              {DEMO_SCHEDULE.slice(0, 3).map((event, i) => (
                <div key={event.id} className="flex items-start gap-3 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">{i + 1}</span>
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{event.location}
                    </p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" size="sm">Open in Google Maps</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Technician Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {DEMO_EMPLOYEES.filter((e) => e.billing_rate > 0).map((tech) => (
                <div key={tech.id} className="flex items-center justify-between text-sm">
                  <span>{tech.name}</span>
                  <Badge variant="success">Available</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
