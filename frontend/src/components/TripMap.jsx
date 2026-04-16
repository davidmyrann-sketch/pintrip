import { useEffect, useRef, useState } from 'react'

const BAKED_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

export default function TripMap({ locations }) {
  const container = useRef(null)
  const mapRef    = useRef(null)
  const [token, setToken] = useState(BAKED_TOKEN)

  useEffect(() => {
    if (!BAKED_TOKEN) {
      fetch('/api/config')
        .then(r => r.json())
        .then(d => { if (d.mapbox_token) setToken(d.mapbox_token) })
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!token || !window.mapboxgl) return
    if (mapRef.current) return

    const points = locations
      .filter(l => l.post?.lat && l.post?.lng)
      .map(l => ({ lat: l.post.lat, lng: l.post.lng, label: l.post.location_name, img: l.post.image_url, idx: l.order_index + 1 }))

    if (!points.length) return

    window.mapboxgl.accessToken = token

    const bounds = new window.mapboxgl.LngLatBounds()
    points.forEach(p => bounds.extend([p.lng, p.lat]))

    const map = new window.mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      bounds,
      fitBoundsOptions: { padding: 60 },
    })
    mapRef.current = map

    map.on('load', () => {
      // Route line
      if (points.length > 1) {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: points.map(p => [p.lng, p.lat]),
            },
          },
        })
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#F5A623',
            'line-width': 2,
            'line-dasharray': [2, 2],
            'line-opacity': 0.7,
          },
        })
      }

      // Numbered markers
      points.forEach((p) => {
        const el = document.createElement('div')
        el.style.cssText = `
          width:32px;height:32px;border-radius:50%;
          background:#F5A623;color:#080812;
          font-size:13px;font-weight:800;
          display:flex;align-items:center;justify-content:center;
          border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);
          cursor:pointer;
        `
        el.textContent = p.idx

        const popup = new window.mapboxgl.Popup({ offset: 20, closeButton: false })
          .setHTML(`
            <div style="display:flex;gap:10px;align-items:center;min-width:180px">
              <img src="${p.img}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;flex-shrink:0" />
              <div>
                <p style="font-weight:700;font-size:13px;color:#F5F5F0;margin:0 0 2px">${p.label}</p>
                <p style="font-size:11px;color:#A0A0B0;margin:0">Stop ${p.idx}</p>
              </div>
            </div>
          `)

        new window.mapboxgl.Marker({ element: el })
          .setLngLat([p.lng, p.lat])
          .setPopup(popup)
          .addTo(map)
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [locations, token])

  if (!token) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-surface rounded-2xl text-center px-8">
        <div className="text-4xl">🗺️</div>
        <p className="text-text-1 font-semibold">Map not configured</p>
        <p className="text-text-3 text-sm">Add your Mapbox token to <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">.env</code></p>
        <p className="text-text-3 text-xs">VITE_MAPBOX_TOKEN=your_token</p>
      </div>
    )
  }

  return <div ref={container} className="w-full h-full rounded-2xl overflow-hidden" />
}
