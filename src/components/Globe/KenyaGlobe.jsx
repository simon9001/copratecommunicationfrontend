import React, { useEffect, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import { kenyaCountryGeoJson } from '../../data/kenyaGeoJson.js'
import { kenyaCountiesGeoJson } from '../../data/kenyaCountiesGeoJson.js'
import './KenyaGlobe.css'

const KenyaGlobe = React.forwardRef(({ projects = [], onProjectSelect, viewMode = 'night' }, ref) => {
  const globeRef = useRef()
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [worldPolygons, setWorldPolygons] = useState([])

  // Expose the internal globe ref methods to the parent via the forwarded ref
  React.useImperativeHandle(ref, () => ({
    pointOfView: (args, duration) => globeRef.current?.pointOfView(args, duration),
    controls: () => globeRef.current?.controls(),
  }))

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // Fetch world countries GeoJSON for global land outlines
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then((res) => res.json())
      .then((geo) => {
        // Merge World countries + Kenya 47 Counties
        const merged = [...(geo.features || []), ...kenyaCountiesGeoJson.features]
        setWorldPolygons(merged)
      })
      .catch(() => {
        setWorldPolygons([...kenyaCountryGeoJson.features, ...kenyaCountiesGeoJson.features])
      })
  }, [])

  useEffect(() => {
    if (globeRef.current) {
      // On startup auto-rotate
      globeRef.current.controls().autoRotate = true
      globeRef.current.controls().autoRotateSpeed = 0.8

      // Stop auto-rotate and fly to Kenya after 1.5s
      setTimeout(() => {
        if (globeRef.current) {
          globeRef.current.controls().autoRotate = false
          globeRef.current.pointOfView({ lat: 0.5, lng: 37.9, altitude: 1.8 }, 2200)
        }
      }, 1500)
    }
  }, [])

  const customMarker = (d) => {
    const el = document.createElement('div')
    el.className = 'globe-marker-pulse'
    el.onclick = () => onProjectSelect(d)

    const tooltip = document.createElement('div')
    tooltip.className = 'globe-marker-tooltip'
    tooltip.textContent = d.ProjectName || d.projectName
    el.appendChild(tooltip)

    return el
  }

  // Dynamic Globe Textures: Day Satellite View vs Night View
  const globeImage =
    viewMode === 'day'
      ? 'https://unpkg.com/three-globe@2.41.12/example/img/earth-blue-marble.jpg'
      : 'https://unpkg.com/three-globe@2.41.12/example/img/earth-night.jpg'

  return (
    <div className="globe-container">
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl={globeImage}
        bumpImageUrl="https://unpkg.com/three-globe@2.41.12/example/img/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)"
        atmosphereColor={viewMode === 'day' ? '#38BDF8' : '#00E676'}
        atmosphereAltitude={0.18}

        // Country & County Boundary Polygons
        polygonsData={worldPolygons.length > 0 ? worldPolygons : [...kenyaCountryGeoJson.features, ...kenyaCountiesGeoJson.features]}
        polygonCapColor={(d) => {
          const isKenyaCountry = d.properties?.ADMIN === 'Kenya' || d.properties?.name === 'Kenya'
          const isCounty = !!d.properties?.code

          if (isCounty) return 'rgba(255, 193, 7, 0.08)' // Kenya County fill
          if (isKenyaCountry) return 'rgba(0, 230, 118, 0.12)' // Kenya Country fill
          return 'rgba(255, 255, 255, 0.01)'
        }}
        polygonSideColor={(d) => {
          const isKenyaCountry = d.properties?.ADMIN === 'Kenya' || d.properties?.name === 'Kenya'
          const isCounty = !!d.properties?.code

          if (isCounty) return 'rgba(255, 193, 7, 0.2)'
          if (isKenyaCountry) return 'rgba(0, 230, 118, 0.25)'
          return 'rgba(255, 255, 255, 0.02)'
        }}
        polygonStrokeColor={(d) => {
          const isKenyaCountry = d.properties?.ADMIN === 'Kenya' || d.properties?.name === 'Kenya'
          const isCounty = !!d.properties?.code

          if (isCounty) return '#FFC107' // County boundary line in Highway Gold
          if (isKenyaCountry) return '#00E676' // Country boundary line in Neon Green
          return 'rgba(255, 255, 255, 0.08)'
        }}
        polygonAltitude={(d) => {
          const isCounty = !!d.properties?.code
          const isKenyaCountry = d.properties?.ADMIN === 'Kenya' || d.properties?.name === 'Kenya'
          if (isCounty) return 0.015
          if (isKenyaCountry) return 0.01
          return 0.003
        }}
        polygonLabel={({ properties: d }) =>
          d.code
            ? `<div style="background: rgba(10,18,30,0.9); padding: 4px 8px; border-radius: 4px; color: #FFC107; font-family: sans-serif; font-size: 12px; border: 1px solid rgba(255,193,7,0.4);">County: ${d.name} (Code ${d.code})</div>`
            : null
        }

        // Project Location Markers
        htmlElementsData={projects}
        htmlLat="Latitude"
        htmlLng="Longitude"
        htmlElement={customMarker}
      />
    </div>
  )
})

export default KenyaGlobe
