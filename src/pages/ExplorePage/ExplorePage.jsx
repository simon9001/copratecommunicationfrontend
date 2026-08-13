import React, { useEffect, useState, useRef } from 'react'
import KenyaGlobe from '../../components/Globe/KenyaGlobe'
import StatsOverlay from '../../components/StatsOverlay/StatsOverlay'
import MapControls from '../../components/MapControls/MapControls'
import ProjectPanel from '../../components/ProjectPanel/ProjectPanel'
import './ExplorePage.css'

const ExplorePage = () => {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [countyCount, setCountyCount] = useState(0)
  const [viewMode, setViewMode] = useState('night') // 'night' or 'day'
  const globeRef = useRef()

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/v1/public/map')
        if (!response.ok) throw new Error('Failed to fetch map data')
        const data = await response.json()

        const projectsData = Array.isArray(data) ? data : data.data || []
        const validProjects = projectsData.filter((p) => p.Latitude && p.Longitude)
        setProjects(validProjects)

        // Compute unique counties
        const counties = new Set()
        validProjects.forEach((p) => {
          if (p.County) counties.add(p.County)
        })
        setCountyCount(counties.size)
      } catch (error) {
        console.error('Error fetching map projects:', error)
      }
    }

    fetchProjects()
  }, [])

  const handleProjectSelect = (project) => {
    setSelectedProject(project)
    if (globeRef.current) {
      globeRef.current.pointOfView(
        {
          lat: project.Latitude,
          lng: project.Longitude,
          altitude: 0.8,
        },
        1000
      )
    }
  }

  const handleClosePanel = () => {
    setSelectedProject(null)
  }

  const handleResetView = () => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 0.5, lng: 37.9, altitude: 1.8 }, 1000)
    }
  }

  const handleZoomIn = () => {
    if (globeRef.current) {
      const currentAltitude = globeRef.current.pointOfView().altitude
      globeRef.current.pointOfView({ altitude: Math.max(0.1, currentAltitude - 0.5) }, 300)
    }
  }

  const handleZoomOut = () => {
    if (globeRef.current) {
      const currentAltitude = globeRef.current.pointOfView().altitude
      globeRef.current.pointOfView({ altitude: Math.min(5, currentAltitude + 0.5) }, 300)
    }
  }

  const handleLocate = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        if (globeRef.current) {
          globeRef.current.pointOfView(
            {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              altitude: 1.2,
            },
            1000
          )
        }
      })
    }
  }

  const handleToggleViewMode = () => {
    setViewMode((prev) => (prev === 'night' ? 'day' : 'night'))
  }

  return (
    <div className="explore-page">
      <StatsOverlay
        projectCount={projects.length}
        countyCount={countyCount}
      />

      <KenyaGlobe
        ref={globeRef}
        projects={projects}
        onProjectSelect={handleProjectSelect}
        viewMode={viewMode}
      />

      <MapControls
        onResetView={handleResetView}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocate={handleLocate}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
      />

      <ProjectPanel
        project={selectedProject}
        onClose={handleClosePanel}
      />
    </div>
  )
}

export default ExplorePage
