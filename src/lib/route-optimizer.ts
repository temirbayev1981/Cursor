export interface RouteStop {
  id: string
  label: string
  address: string
  lat: number
  lng: number
}

function haversineMiles(a: RouteStop, b: RouteStop): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 3958.8 * 2 * Math.asin(Math.sqrt(h))
}

function routeDistance(stops: RouteStop[]): number {
  if (stops.length < 2) return 0
  let total = 0
  for (let i = 1; i < stops.length; i++) {
    total += haversineMiles(stops[i - 1], stops[i])
  }
  return total
}

/** Demo geocode — deterministic coords near Austin, TX for routing without API */
export function geocodeAddressForRouting(address: string): { lat: number; lng: number } {
  let hash = 0
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash)
  }
  const lat = 30.25 + (Math.abs(hash) % 800) / 5000
  const lng = -97.75 - (Math.abs(hash >> 4) % 800) / 5000
  return { lat, lng }
}

export function optimizeRoute(stops: RouteStop[]): {
  ordered: RouteStop[]
  totalMiles: number
  originalMiles: number
  savedMiles: number
  savedMinutes: number
} {
  if (stops.length <= 1) {
    return {
      ordered: stops,
      totalMiles: 0,
      originalMiles: 0,
      savedMiles: 0,
      savedMinutes: 0,
    }
  }

  const originalMiles = routeDistance(stops)
  const remaining = [...stops]
  const ordered: RouteStop[] = [remaining.shift()!]

  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1]
    let nearestIdx = 0
    let nearestDist = haversineMiles(current, remaining[0])
    for (let i = 1; i < remaining.length; i++) {
      const d = haversineMiles(current, remaining[i])
      if (d < nearestDist) {
        nearestDist = d
        nearestIdx = i
      }
    }
    ordered.push(remaining.splice(nearestIdx, 1)[0])
  }

  const totalMiles = routeDistance(ordered)
  const savedMiles = Math.max(0, originalMiles - totalMiles)
  const savedMinutes = Math.round(savedMiles * 2.5)

  return { ordered, totalMiles, originalMiles, savedMiles, savedMinutes }
}

export function buildGoogleMapsDirectionsUrl(stops: RouteStop[]): string {
  if (stops.length === 0) return 'https://maps.google.com'
  if (stops.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stops[0].address)}`
  }

  const origin = encodeURIComponent(stops[0].address)
  const destination = encodeURIComponent(stops[stops.length - 1].address)
  const waypoints = stops
    .slice(1, -1)
    .map((s) => encodeURIComponent(s.address))
    .join('|')

  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
  if (waypoints) url += `&waypoints=${waypoints}`
  return url
}
