import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import Globe from 'react-globe.gl'
import { kenyaCities } from '../../data/kenyaCities.js'
import './KenyaGlobe.css'

// ─── Constants ────────────────────────────────────────────────────────────────

// geoBoundaries open-data Kenya counties (GADM-compatible, all 47 counties)
const KENYA_COUNTIES_URL =
  'https://raw.githubusercontent.com/wmgeolab/geoBoundaries/main/releaseData/CGAZ/geoBoundaries-KEN-ADM1_simplified.geojson'

// Natural Earth world countries (already used by the app)
const WORLD_COUNTRIES_URL =
  'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson'

// Kenya bounding box (approx): lat -4.7 to 5.0, lng 33.9 to 41.9
const KENYA_BOUNDS = { minLat: -4.7, maxLat: 5.0, minLng: 33.9, maxLng: 41.9 }

// Altitude thresholds for progressive layer visibility
const ALT = {
  SHOW_COUNTIES: 2.2,      // counties appear
  SHOW_CITIES_T1: 1.5,     // major city labels
  SHOW_CITIES_T2: 0.9,     // town labels
  SHOW_CITIES_T3: 0.5,     // small town labels
  SHOW_ROUTES: 1.8,        // project routes
}

// Status colors aligned with design tokens
const STATUS_COLORS = {
  Ongoing:   '#FFC107',
  Completed: '#00E676',
  Planned:   '#38BDF8',
  Suspended: '#FF5252',
  Cancelled: '#FF5252',
  default:   '#00E676',
}

function getStatusColor(status) {
  return STATUS_COLORS[status] || STATUS_COLORS.default
}

// ─── Globe textures ───────────────────────────────────────────────────────────

const GLOBE_TEXTURES = {
  day:   'https://unpkg.com/three-globe@2.41.12/example/img/earth-blue-marble.jpg',
  night: 'https://unpkg.com/three-globe@2.41.12/example/img/earth-night.jpg',
}

// ─── Component ────────────────────────────────────────────────────────────────

const KenyaGlobe = React.forwardRef(function KenyaGlobe(
  {
    projects = [],
    projectRoutes = [],
    onProjectSelect,
    onCountySelect,
    viewMode = 'night',
    activeLayers = {},
    selectedCounty = null,
    selectedProject = null,
  },
  ref
) {
  const globeRef = useRef()
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })
  const [worldCountries, setWorldCountries] = useState([])
  const [kenyaCounties, setKenyaCounties] = useState([])
  const [hoveredPolygon, setHoveredPolygon] = useState(null)
  const [cameraAlt, setCameraAlt] = useState(1.8)
  const [vrAvailable, setVrAvailable] = useState(false)

  // ── Expose globe methods via forwarded ref ──────────────────────────────────
  React.useImperativeHandle(ref, () => ({
    pointOfView: (...args) => globeRef.current?.pointOfView(...args),
    controls:    () => globeRef.current?.controls(),
  }))

  // ── Detect VR capability ────────────────────────────────────────────────────
  useEffect(() => {
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        setVrAvailable(supported)
      }).catch(() => {})
    }
  }, [])

  // ── Window resize ───────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── Fetch world countries GeoJSON ───────────────────────────────────────────
  useEffect(() => {
    fetch(WORLD_COUNTRIES_URL)
      .then((r) => r.json())
      .then((geo) => setWorldCountries(geo.features || []))
      .catch(() => setWorldCountries([]))
  }, [])

  // ── Fetch real Kenya 47-county GeoJSON ─────────────────────────────────────
  useEffect(() => {
    fetch(KENYA_COUNTIES_URL)
      .then((r) => r.json())
      .then((geo) => {
        const features = (geo.features || []).map((f) => ({
          ...f,
          properties: {
            ...f.properties,
            // Normalise name field: geoBoundaries uses 'shapeName'
            name: f.properties?.shapeName || f.properties?.name || 'Unknown',
            _isKenyaCounty: true,
          },
        }))
        setKenyaCounties(features)
      })
      .catch(() => {
        // Fallback: load old approximate data so globe still works
        import('../../data/kenyaCountiesGeoJson.js').then((m) => {
          const features = (m.kenyaCountiesGeoJson?.features || []).map((f) => ({
            ...f,
            properties: { ...f.properties, _isKenyaCounty: true },
          }))
          setKenyaCounties(features)
        })
      })
  }, [])

  // ── Camera altitude tracking ────────────────────────────────────────────────
  useEffect(() => {
    if (!globeRef.current) return
    const controls = globeRef.current.controls()
    if (!controls) return
    const onControlChange = () => {
      const pov = globeRef.current?.pointOfView()
      if (pov?.altitude != null) setCameraAlt(pov.altitude)
    }
    controls.addEventListener('change', onControlChange)
    return () => controls.removeEventListener('change', onControlChange)
  }, [/* run after first render, globeRef stable */])

  // ── Initial fly-to Kenya ────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeRef.current) return
    const ctrl = globeRef.current.controls()
    ctrl.autoRotate = true
    ctrl.autoRotateSpeed = 0.6

    const timer = setTimeout(() => {
      if (!globeRef.current) return
      globeRef.current.controls().autoRotate = false
      globeRef.current.pointOfView({ lat: 0.5, lng: 37.9, altitude: 1.8 }, 2400)
    }, 1600)
    return () => clearTimeout(timer)
  }, [])

  // ─────────────────────────────────────────────────────────────────────────────
  // Layer visibility helpers
  // ─────────────────────────────────────────────────────────────────────────────

  const layerOn = (key, defaultVal = true) =>
    activeLayers[key] !== undefined ? activeLayers[key] : defaultVal

  const showCounties    = layerOn('counties')     && cameraAlt < ALT.SHOW_COUNTIES
  const showCitiesTier1 = layerOn('cities')       && cameraAlt < ALT.SHOW_CITIES_T1
  const showCitiesTier2 = layerOn('cities')       && cameraAlt < ALT.SHOW_CITIES_T2
  const showCitiesTier3 = layerOn('cities')       && cameraAlt < ALT.SHOW_CITIES_T3
  const showRoutes      = layerOn('projectRoutes')&& cameraAlt < ALT.SHOW_ROUTES
  const showProjects    = layerOn('projects')

  // ─────────────────────────────────────────────────────────────────────────────
  // Polygon data: world + kenya counties (merged)
  // ─────────────────────────────────────────────────────────────────────────────

  const polygonsData = useMemo(() => {
    if (!layerOn('satellite', true) && !layerOn('kenyaBoundary') && !showCounties) return []

    const world = worldCountries.filter((f) => {
      // Remove the original Kenya polygon from world set – the county layer replaces it
      const name = f.properties?.ADMIN || f.properties?.name || ''
      return name !== 'Kenya'
    })

    const layers = layerOn('satellite', true) ? world : []

    if (showCounties && kenyaCounties.length > 0) {
      layers.push(...kenyaCounties)
    }

    return layers
  }, [worldCountries, kenyaCounties, showCounties, activeLayers])

  // ─────────────────────────────────────────────────────────────────────────────
  // Polygon colour callbacks
  // ─────────────────────────────────────────────────────────────────────────────

  const polygonCapColor = useCallback((d) => {
    const isCounty  = d.properties?._isKenyaCounty
    const isHovered = hoveredPolygon === d
    const isSelected = selectedCounty === d

    if (isCounty) {
      if (isSelected) return 'rgba(255, 193, 7, 0.28)'
      if (isHovered)  return 'rgba(255, 193, 7, 0.18)'
      return 'rgba(255, 193, 7, 0.06)'
    }

    const name = d.properties?.ADMIN || d.properties?.name || ''
    if (name === 'Kenya') return 'rgba(0, 230, 118, 0.1)'
    return 'rgba(255, 255, 255, 0.015)'
  }, [hoveredPolygon, selectedCounty])

  const polygonSideColor = useCallback((d) => {
    const isCounty = d.properties?._isKenyaCounty
    if (isCounty) return 'rgba(255, 193, 7, 0.15)'
    const name = d.properties?.ADMIN || d.properties?.name || ''
    if (name === 'Kenya') return 'rgba(0, 230, 118, 0.2)'
    return 'rgba(255, 255, 255, 0.025)'
  }, [])

  const polygonStrokeColor = useCallback((d) => {
    const isCounty  = d.properties?._isKenyaCounty
    const isHovered = hoveredPolygon === d
    const isSelected = selectedCounty === d

    if (isCounty) {
      if (isSelected) return '#FFC107'
      if (isHovered)  return 'rgba(255, 193, 7, 0.9)'
      return 'rgba(255, 193, 7, 0.45)'
    }

    const name = d.properties?.ADMIN || d.properties?.name || ''
    if (name === 'Kenya') return '#00E676'
    return 'rgba(255, 255, 255, 0.07)'
  }, [hoveredPolygon, selectedCounty])

  const polygonAltitude = useCallback((d) => {
    const isCounty  = d.properties?._isKenyaCounty
    const isSelected = selectedCounty === d
    if (isCounty) return isSelected ? 0.025 : 0.012
    const name = d.properties?.ADMIN || d.properties?.name || ''
    if (name === 'Kenya') return 0.008
    return 0.003
  }, [selectedCounty])

  const polygonLabel = useCallback(({ properties: p }) => {
    if (!p?._isKenyaCounty) return null
    const name = p.shapeName || p.name || 'County'
    return `<div class="globe-county-tooltip">${name} County</div>`
  }, [])

  // ─────────────────────────────────────────────────────────────────────────────
  // City labels
  // ─────────────────────────────────────────────────────────────────────────────

  const cityLabelsData = useMemo(() => {
    if (!layerOn('cities')) return []
    if (showCitiesTier3) return kenyaCities
    if (showCitiesTier2) return kenyaCities.filter((c) => c.tier <= 2)
    if (showCitiesTier1) return kenyaCities.filter((c) => c.tier === 1)
    return []
  }, [showCitiesTier1, showCitiesTier2, showCitiesTier3, activeLayers])

  const labelSize = useCallback((d) => {
    const base = d.tier === 1 ? 0.5 : d.tier === 2 ? 0.38 : 0.28
    // Larger when more zoomed in
    const zoomBoost = Math.max(0, (1.5 - cameraAlt) * 0.3)
    return base + zoomBoost
  }, [cameraAlt])

  const labelColor = useCallback((d) => {
    if (d.tier === 1) return '#FFFFFF'
    if (d.tier === 2) return 'rgba(255,255,255,0.85)'
    return 'rgba(255,255,255,0.65)'
  }, [])

  // ─────────────────────────────────────────────────────────────────────────────
  // Project route paths
  // ─────────────────────────────────────────────────────────────────────────────

  const pathsData = useMemo(() => {
    if (!showRoutes || projectRoutes.length === 0) return []
    return projectRoutes
      .filter((r) => r.geoJson || r.GeoJson)
      .map((r) => {
        try {
          const gj = typeof (r.geoJson || r.GeoJson) === 'string'
            ? JSON.parse(r.geoJson || r.GeoJson)
            : (r.geoJson || r.GeoJson)
          const coords = gj?.coordinates || gj?.geometry?.coordinates || []
          // Normalise: LineString → [[lng,lat],...], MultiLineString → flatten
          const lineCoords = gj?.type === 'MultiLineString'
            ? coords.flat()
            : coords
          return {
            ...r,
            _points: lineCoords.map(([lng, lat]) => ({ lat, lng })),
          }
        } catch {
          return null
        }
      })
      .filter(Boolean)
  }, [projectRoutes, showRoutes])

  const pathColor = useCallback((d) => {
    const isSelected = d.projectId === selectedProject?.ProjectId
    if (isSelected) return ['#FFC107', '#FFC107']
    return ['rgba(0,230,118,0.8)', 'rgba(0,230,118,0.3)']
  }, [selectedProject])

  const pathStroke = useCallback((d) => {
    const isSelected = d.projectId === selectedProject?.ProjectId
    return isSelected ? 1.5 : 0.7
  }, [selectedProject])

  // ─────────────────────────────────────────────────────────────────────────────
  // Project HTML markers
  // ─────────────────────────────────────────────────────────────────────────────

  const customMarker = useCallback((d) => {
    const el = document.createElement('div')
    const status = d.ProjectStatus || 'default'
    const color  = getStatusColor(status)
    const isSelected = selectedProject?.ProjectId === d.ProjectId

    el.className = `globe-marker-pulse ${status.toLowerCase()} ${isSelected ? 'selected' : ''}`
    el.style.setProperty('--marker-color', color)
    el.style.setProperty('--marker-color-dim', color + '44')

    el.setAttribute('role', 'button')
    el.setAttribute('aria-label', `Project: ${d.ProjectName || 'Unknown'}`)

    const tooltip = document.createElement('div')
    tooltip.className = 'globe-marker-tooltip'
    tooltip.textContent = d.ProjectName || d.projectName || 'Project'
    el.appendChild(tooltip)

    el.addEventListener('click', (e) => {
      e.stopPropagation()
      onProjectSelect?.(d)
    })
    return el
  }, [selectedProject, onProjectSelect])

  // ─────────────────────────────────────────────────────────────────────────────
  // County polygon click / hover
  // ─────────────────────────────────────────────────────────────────────────────

  const handlePolygonClick = useCallback((polygon) => {
    if (!polygon?.properties?._isKenyaCounty) return
    onCountySelect?.(polygon)

    // Fly to county centroid
    if (globeRef.current) {
      const coords = polygon.geometry?.coordinates?.[0]
      if (coords && coords.length > 0) {
        const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length
        const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length
        globeRef.current.pointOfView({ lat, lng, altitude: 0.6 }, 1200)
      }
    }
  }, [onCountySelect])

  const handlePolygonHover = useCallback((polygon) => {
    setHoveredPolygon(polygon?.properties?._isKenyaCounty ? polygon : null)
    document.body.style.cursor = polygon?.properties?._isKenyaCounty ? 'pointer' : 'default'
  }, [])

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="globe-container">
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}

        // ── Earth imagery ──────────────────────────────────────────────
        globeImageUrl={GLOBE_TEXTURES[viewMode] || GLOBE_TEXTURES.night}
        bumpImageUrl="https://unpkg.com/three-globe@2.41.12/example/img/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)"
        atmosphereColor={viewMode === 'day' ? '#38BDF8' : '#00E676'}
        atmosphereAltitude={0.18}

        // ── Polygons (countries + kenya counties) ──────────────────────
        polygonsData={polygonsData}
        polygonCapColor={polygonCapColor}
        polygonSideColor={polygonSideColor}
        polygonStrokeColor={polygonStrokeColor}
        polygonAltitude={polygonAltitude}
        polygonLabel={polygonLabel}
        onPolygonClick={handlePolygonClick}
        onPolygonHover={handlePolygonHover}
        polygonsTransitionDuration={400}

        // ── City / town labels ─────────────────────────────────────────
        labelsData={cityLabelsData}
        labelLat={(d) => d.lat}
        labelLng={(d) => d.lng}
        labelText={(d) => d.name}
        labelSize={labelSize}
        labelColor={labelColor}
        labelResolution={2}
        labelAltitude={0.005}
        labelDotRadius={0.25}
        labelDotOrientation={() => 'bottom'}
        labelsTransitionDuration={300}

        // ── Project route paths ────────────────────────────────────────
        pathsData={pathsData}
        pathPoints={(d) => d._points}
        pathPointLat={(p) => p.lat}
        pathPointLng={(p) => p.lng}
        pathColor={pathColor}
        pathStroke={pathStroke}
        pathDashLength={0.02}
        pathDashGap={0.004}
        pathDashAnimateTime={10000}
        pathsTransitionDuration={400}

        // ── Project HTML markers ────────────────────────────────────────
        htmlElementsData={showProjects ? projects : []}
        htmlLat="Latitude"
        htmlLng="Longitude"
        htmlElement={customMarker}
        htmlTransitionDuration={300}
      />

      {/* VR Enter Button */}
      {vrAvailable && (
        <div className="vr-enter-badge" title="Enter Immersive VR Mode">
          <span className="vr-enter-icon">⬡</span>
          <span>ENTER VR</span>
        </div>
      )}
    </div>
  )
})

export default KenyaGlobe
