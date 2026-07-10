import { describe, it, expect } from 'vitest'
import { optimizeRoute, geocodeAddressForRouting } from '@/lib/route-optimizer'

describe('route-optimizer', () => {
  it('optimizes route order by nearest neighbor', () => {
    const stops = [
      { id: '1', label: 'A', address: '100 Main St Austin TX', ...geocodeAddressForRouting('100 Main St Austin TX') },
      { id: '2', label: 'B', address: '200 Oak Lane Austin TX', ...geocodeAddressForRouting('200 Oak Lane Austin TX') },
      { id: '3', label: 'C', address: '300 Pine Ave Austin TX', ...geocodeAddressForRouting('300 Pine Ave Austin TX') },
    ]
    const result = optimizeRoute(stops)
    expect(result.ordered).toHaveLength(3)
    expect(result.ordered[0].id).toBe('1')
    expect(result.savedMiles).toBeGreaterThanOrEqual(0)
  })

  it('returns zero savings for single stop', () => {
    const stops = [
      { id: '1', label: 'A', address: 'Austin TX', ...geocodeAddressForRouting('Austin TX') },
    ]
    const result = optimizeRoute(stops)
    expect(result.savedMiles).toBe(0)
  })
})
