import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import KenyaGlobe from '../../components/Globe/KenyaGlobe'
import StatsOverlay from '../../components/StatsOverlay/StatsOverlay'
import MapControls from '../../components/MapControls/MapControls'
import ProjectPanel from '../../components/ProjectPanel/ProjectPanel'
import CountyPanel from '../../components/CountyPanel/CountyPanel'
import LayerControl from '../../components/LayerControl/LayerControl'
import GeoSearch from '../../components/GeoSearch/GeoSearch'
import ProjectFilters from '../../components/ProjectFilters/ProjectFilters'
import './ExplorePage.css'

// ─── Default layer state ───────────────────────────────────────────────────────

const DEFAULT_LAYERS = {
  satellite:     true,
  kenyaBoundary: true,
  counties:      true,
  cities:        true,
  majorRoads:    false,
  projects:      true,
  projectRoutes: true,
  subCounties:   false,
  rivers:        false,
  terrain:       false,
  soil:          false,
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchMapProjects(county, status) {
  const params = new URLSearchParams()
  if (county && county !== 'All') params.set('county', county)
  if (status && status !== 'All') params.set('status', status)
  const qs = params.toString()
  const res = await fetch(`/api/v1/public/map${qs ? '?' + qs : ''}`)
  if (!res.ok) throw new Error('Failed to fetch map data')
  const json = await res.json()
  const raw = Array.isArray(json) ? json : json.data || []
  return raw.filter((p) => p.Latitude && p.Longitude)
}

async function fetchAllRoutes() {
  try {
    const res = await fetch('/api/v1/public/routes')
    if (!res.ok) return []
    const json = await res.json()
    return Array.isArray(json) ? json : json.data || []
  } catch {
    return []
  }
}

async function fetchKenyaCounties() {
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/wmgeolab/geoBoundaries/main/releaseData/CGAZ/geoBoundaries-KEN-ADM1_simplified.geojson'
    )
    if (!res.ok) return []
    const geo = await res.json()
    return (geo.features || []).map((f) => ({
      ...f,
      properties: { ...f.properties, name: f.properties?.shapeName || f.properties?.name || '' },
    }))
  } catch {
    return []
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const ExplorePage = () => {
  const globeRef = useRef()

  // ── Data state ──────────────────────────────────────────────────────────────
  const [allProjects, setAllProjects]     = useState([])
  const [projectRoutes, setProjectRoutes] = useState([])
  const [kenyaCounties, setKenyaCounties] = useState([])   // GeoJSON features from globe fetch
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)

  // ── UI / filter state ────────────────────────────────────────────────────────
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedCounty, setSelectedCounty]   = useState(null)   // GeoJSON feature
  const [statusFilter, setStatusFilter]       = useState('All')
  const [countyFilter, setCountyFilter]       = useState('All')
  const [activeLayers, setActiveLayers]       = useState(DEFAULT_LAYERS)
  const [viewMode, setViewMode]               = useState('night')

  // ── Fetch all projects on mount (no filters) ─────────────────────────────────
  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchMapProjects(),
      fetchAllRoutes(),
      fetchKenyaCounties(),
    ])
      .then(([projects, routes, counties]) => {
        setAllProjects(projects)
        setProjectRoutes(routes)
        setKenyaCounties(counties)
        setError(null)
      })
      .catch((err) => {
        console.error('Error fetching GIS data:', err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Filtered projects (client-side, instant) ────────────────────────────────
  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      const statusOk = statusFilter === 'All' || p.ProjectStatus === statusFilter
      const countyOk =
        countyFilter === 'All' ||
        (p.County || '').toLowerCase() === countyFilter.toLowerCase()
      return statusOk && countyOk
    })
  }, [allProjects, statusFilter, countyFilter])

  // ── County list for filters dropdown ────────────────────────────────────────
  const countyOptions = useMemo(() => {
    const set = new Set(allProjects.map((p) => p.County).filter(Boolean))
    return [...set].sort()
  }, [allProjects])

  // ── Layer toggle ─────────────────────────────────────────────────────────────
  const handleLayerToggle = useCallback((key, value) => {
    setActiveLayers((prev) => ({ ...prev, [key]: value }))
  }, [])

  // ── Project selection ─────────────────────────────────────────────────────────
  const handleProjectSelect = useCallback((project) => {
    setSelectedProject(project)
    setSelectedCounty(null)
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: project.Latitude, lng: project.Longitude, altitude: 0.6 },
        1000
      )
    }
  }, [])

  const handleProjectClose = useCallback(() => setSelectedProject(null), [])

  // ── County selection (from globe polygon click) ──────────────────────────────
  const handleCountySelect = useCallback((feature) => {
    setSelectedCounty(feature)
    setSelectedProject(null)
  }, [])

  const handleCountyClose = useCallback(() => setSelectedCounty(null), [])

  // ── "View projects in county" — set county filter ──────────────────────────
  const handleViewCountyProjects = useCallback((countyName) => {
    setCountyFilter(countyName)
    setSelectedCounty(null)
  }, [])

  // ── Route view (highlight route on globe) ───────────────────────────────────
  const hasRoute = selectedProject
    ? Boolean(selectedProject.HasRoute)
    : false

  // ── Status filter change ─────────────────────────────────────────────────────
  const handleStatusChange = useCallback((status) => setStatusFilter(status), [])
  const handleCountyChange = useCallback((county) => setCountyFilter(county), [])

  // ── Map controls ─────────────────────────────────────────────────────────────
  const handleResetView = useCallback(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 0.5, lng: 37.9, altitude: 1.8 }, 1000)
    }
    setStatusFilter('All')
    setCountyFilter('All')
    setSelectedCounty(null)
    setSelectedProject(null)
  }, [])

  const handleZoomIn = useCallback(() => {
    if (globeRef.current) {
      const alt = globeRef.current.pointOfView().altitude
      globeRef.current.pointOfView({ altitude: Math.max(0.1, alt - 0.4) }, 300)
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    if (globeRef.current) {
      const alt = globeRef.current.pointOfView().altitude
      globeRef.current.pointOfView({ altitude: Math.min(5, alt + 0.4) }, 300)
    }
  }, [])

  const handleLocate = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        globeRef.current?.pointOfView(
          { lat: coords.latitude, lng: coords.longitude, altitude: 1.0 },
          1000
        )
      })
    }
  }, [])

  const handleToggleViewMode = useCallback(() => {
    setViewMode((v) => (v === 'night' ? 'day' : 'night'))
  }, [])

  // ── Search navigation ────────────────────────────────────────────────────────
  const handleSearchLocation = useCallback((lat, lng, altitude = 0.5) => {
    globeRef.current?.pointOfView({ lat, lng, altitude }, 1200)
  }, [])

  return (
    <div className="explore-page">
      {/* 3D Globe */}
      <KenyaGlobe
        ref={globeRef}
        projects={filteredProjects}
        projectRoutes={projectRoutes}
        onProjectSelect={handleProjectSelect}
        onCountySelect={handleCountySelect}
        viewMode={viewMode}
        activeLayers={activeLayers}
        selectedProject={selectedProject}
        selectedCounty={selectedCounty}
      />

      {/* Stats panel (top-left) */}
      <StatsOverlay projects={allProjects} />

      {/* Search bar (top-center) */}
      <GeoSearch
        counties={kenyaCounties}
        projects={allProjects}
        onSelectLocation={handleSearchLocation}
        onSelectProject={handleProjectSelect}
      />

      {/* Map controls (right side) */}
      <MapControls
        onResetView={handleResetView}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocate={handleLocate}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
      />

      {/* Layer control (bottom-left) */}
      <LayerControl
        activeLayers={activeLayers}
        onLayerToggle={handleLayerToggle}
      />

      {/* Filters (bottom-center) */}
      <ProjectFilters
        statusFilter={statusFilter}
        countyFilter={countyFilter}
        countyOptions={countyOptions}
        onStatusChange={handleStatusChange}
        onCountyChange={handleCountyChange}
        projectCount={filteredProjects.length}
      />

      {/* County slide-in panel (left) */}
      <CountyPanel
        county={selectedCounty}
        projects={allProjects}
        onClose={handleCountyClose}
        onViewProjects={handleViewCountyProjects}
      />

      {/* Project slide-in panel (right) */}
      <ProjectPanel
        project={selectedProject}
        onClose={handleProjectClose}
        hasRoute={hasRoute}
      />

      {/* Loading state */}
      {loading && (
        <div className="explore-loading" aria-live="polite" aria-label="Loading project data">
          <div className="explore-loading-dot" />
        </div>
      )}

      {/* Error state */}
      {error && !loading && allProjects.length === 0 && (
        <div className="explore-error" role="alert">
          <span>⚠ Could not load project data. Check backend connection.</span>
        </div>
      )}
    </div>
  )
}

export default ExplorePage
