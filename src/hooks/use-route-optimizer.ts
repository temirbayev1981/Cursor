import { useMemo } from 'react'
import type { Job, Customer, Property } from '@/types'
import { geocodeAddressForRouting, optimizeRoute, buildGoogleMapsDirectionsUrl, type RouteStop } from '@/lib/route-optimizer'

export function resolveJobAddress(
  job: Job,
  customers: Customer[],
  properties: Property[]
): string {
  const property = job.property_id
    ? properties.find((p) => p.id === job.property_id)
    : undefined
  if (property?.address) return property.address

  const customer = customers.find((c) => c.id === job.customer_id)
  return customer?.address ?? job.title
}

export function useOptimizedRoute(
  jobs: Job[],
  customers: Customer[],
  properties: Property[]
) {
  return useMemo(() => {
    const activeJobs = jobs.filter((j) =>
      j.status === 'scheduled' || j.status === 'in_progress'
    )

    const stops: RouteStop[] = activeJobs.map((job) => {
      const address = resolveJobAddress(job, customers, properties)
      const coords = geocodeAddressForRouting(address)
      return {
        id: job.id,
        label: job.title,
        address,
        ...coords,
      }
    })

    const result = optimizeRoute(stops)
    const mapsUrl = buildGoogleMapsDirectionsUrl(result.ordered)

    return { ...result, stops: result.ordered, mapsUrl, jobCount: activeJobs.length }
  }, [jobs, customers, properties])
}

export interface RouteStopInput {
  id: string
  label: string
  address: string
}

export function useOptimizedRouteFromStops(items: RouteStopInput[]) {
  return useMemo(() => {
    const stops: RouteStop[] = items.map((item) => {
      const coords = geocodeAddressForRouting(item.address)
      return { ...item, ...coords }
    })

    const result = optimizeRoute(stops)
    const mapsUrl = buildGoogleMapsDirectionsUrl(result.ordered)

    return { ...result, stops: result.ordered, mapsUrl, jobCount: items.length }
  }, [items])
}
