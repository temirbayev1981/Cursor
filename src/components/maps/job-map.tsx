import { useEffect, useRef } from 'react'
import { hasGoogleMaps } from '@/lib/env'
import { env } from '@/lib/env'
import { MapPin } from 'lucide-react'

interface JobMapProps {
  addresses?: string[]
  className?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GMaps = any

export function JobMap({ addresses = [], className = 'h-48' }: JobMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<GMaps>(null)

  useEffect(() => {
    if (!hasGoogleMaps || !mapRef.current) return

    const scriptId = 'google-maps-script'
    const initMap = () => {
      const g = (window as { google?: GMaps }).google
      if (!mapRef.current || !g?.maps) return
      const center = { lat: 41.8781, lng: -87.6298 }
      mapInstance.current = new g.maps.Map(mapRef.current, {
        center,
        zoom: 11,
        disableDefaultUI: true,
      })

      const geocoder = new g.maps.Geocoder()
      addresses.slice(0, 10).forEach((addr) => {
        geocoder.geocode({ address: addr }, (results: GMaps, status: string) => {
          if (status === 'OK' && results?.[0]?.geometry?.location && mapInstance.current) {
            new g.maps.Marker({
              map: mapInstance.current,
              position: results[0].geometry.location,
              title: addr,
            })
          }
        })
      })
    }

    if (document.getElementById(scriptId)) {
      initMap()
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://maps.googleapis.com/maps/api/js?key=${env.VITE_GOOGLE_MAPS_API_KEY}`
    script.async = true
    script.onload = initMap
    document.head.appendChild(script)
  }, [addresses])

  if (!hasGoogleMaps) {
    return (
      <div data-testid="dispatch-job-map-fallback" className={`rounded-lg bg-secondary/30 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2 ${className}`}>
        <MapPin className="h-8 w-8 opacity-50" />
        <p>Google Maps — укажите VITE_GOOGLE_MAPS_API_KEY</p>
        {addresses.length > 0 && (
          <ul className="text-xs space-y-1 mt-2 px-4">
            {addresses.slice(0, 5).map((a) => (
              <li key={a}>
                <a href={`https://maps.google.com/?q=${encodeURIComponent(a)}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  {a}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return <div ref={mapRef} data-testid="dispatch-job-map-canvas" className={`rounded-lg ${className}`} />
}
