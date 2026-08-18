import React, { useState, useEffect, useMemo } from 'react'
import {
  Play,
  ArrowUpRight,
  X,
  MapPin,
  Calendar,
  Ruler,
  DollarSign,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Route,
  Video,
  Image as ImageIcon,
  Compass
} from 'lucide-react'
import './ProjectExplorer.css'

function formatInvestment(cost, currency = 'KES') {
  if (cost == null || cost === '') return 'KES —'
  const num = Number(cost)
  if (isNaN(num)) return `${currency} ${cost}`
  if (num >= 1e9) return `${currency} ${(num / 1e9).toFixed(1)}B`
  if (num >= 1e6) return `${currency} ${(num / 1e6).toFixed(1)}M`
  if (num >= 1e3) return `${currency} ${(num / 1e3).toFixed(0)}K`
  return `${currency} ${num.toLocaleString()}`
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-KE', { year: 'numeric', month: 'short' })
}

const STATUS_CONFIG = {
  Ongoing: { color: '#FDB813', bg: 'rgba(253, 184, 19, 0.15)', border: 'rgba(253, 184, 19, 0.4)', icon: Activity },
  Completed: { color: '#00E676', bg: 'rgba(0, 230, 118, 0.15)', border: 'rgba(0, 230, 118, 0.4)', icon: CheckCircle2 },
  Planned: { color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)', icon: Clock },
  Suspended: { color: '#FF5252', bg: 'rgba(255, 82, 82, 0.15)', border: 'rgba(255, 82, 82, 0.4)', icon: AlertTriangle },
  Cancelled: { color: '#FF5252', bg: 'rgba(255, 82, 82, 0.15)', border: 'rgba(255, 82, 82, 0.4)', icon: AlertTriangle },
}

const ProjectExplorer = ({ project, loading, onClose }) => {
  const [activeVideo, setActiveVideo] = useState(null)
  const [isPlayingDemo, setIsPlayingDemo] = useState(false)

  // Reset video state when project changes
  useEffect(() => {
    setActiveVideo(null)
    setIsPlayingDemo(false)
  }, [project?.ProjectId])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeVideo) {
          setActiveVideo(null)
          setIsPlayingDemo(false)
        } else if (project) {
          onClose?.()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeVideo, project, onClose])

  // Project attributes from backend
  const isVisible = !!project || loading
  const mediaList = project?.media || project?.Media || []
  const locations = project?.locations || project?.Locations || []
  const updates = project?.updates || project?.Updates || []
  const milestones = project?.milestones || project?.Milestones || []

  const primaryLocation = locations.find((l) => l.IsPrimaryLocation) || locations[0]
  const county = primaryLocation?.County || project?.County || 'Kenya'
  const subCounty = primaryLocation?.SubCounty || project?.SubCounty || ''
  const ward = primaryLocation?.Ward || project?.Ward || ''

  // Progress computation
  const progress = useMemo(() => {
    if (project?.ProgressPercentage != null) return Number(project.ProgressPercentage)
    if (project?.p != null) return Number(project.p)
    if (updates.length > 0) {
      const sorted = [...updates].sort(
        (a, b) => new Date(b.UpdateDate || 0) - new Date(a.UpdateDate || 0)
      )
      if (sorted[0]?.ProgressPercentage != null) return Number(sorted[0].ProgressPercentage)
    }
    if (milestones.length > 0) {
      const completedCount = milestones.filter(m => m.Status === 'Completed').length
      return Math.round((completedCount / milestones.length) * 100)
    }
    return 75
  }, [project, updates, milestones])

  // Budget / Investment
  const investment = useMemo(() => {
    if (project?.b) return project.b
    return formatInvestment(project?.ProjectCost || project?.CostKes, project?.CurrencyCode || 'KES')
  }, [project])

  // Completion Year
  const deliveryYear = useMemo(() => {
    const rawDate = project?.CompletionDate || project?.ExpectedCompletionDate
    if (rawDate) {
      const parsed = new Date(rawDate).getFullYear()
      if (!isNaN(parsed)) return parsed
    }
    return '2026'
  }, [project])

  const startDateFormatted = formatDate(project?.StartDate)
  const completionDateFormatted = formatDate(project?.CompletionDate || project?.ExpectedCompletionDate)

  // Status configuration
  const statusKey = project?.ProjectStatus || 'Ongoing'
  const statusInfo = STATUS_CONFIG[statusKey] || STATUS_CONFIG.Ongoing
  const StatusIcon = statusInfo.icon

  // Build the 3 curved arc cards dynamically from backend media or curated topics
  const arcCards = useMemo(() => {
    const defaultTemplates = [
      {
        id: 'v1',
        className: 'v1',
        title: 'Corridor Overview',
        category: 'Project Overview',
        desc: project?.ShortDescription || 'Strategic national trunk highway corridor overview and engineering scope.',
      },
      {
        id: 'v2',
        className: 'v2',
        title: 'Highway Construction',
        category: 'Construction Progress',
        desc: 'Civil works execution, pavement layering, bridge structures, and live engineering progress.',
      },
      {
        id: 'v3',
        className: 'v3',
        title: 'Socio-Economic Impact',
        category: 'Community Impact',
        desc: 'Regional connectivity, travel time reduction, trade facilitation, and community benefits.',
      },
    ]

    return defaultTemplates.map((tpl, i) => {
      const matchedMedia = mediaList[i]
      const isVideo = matchedMedia?.MediaType?.toUpperCase().includes('VIDEO') || false
      const is360 = matchedMedia?.MediaType?.toUpperCase().includes('360') || false

      return {
        ...tpl,
        title: matchedMedia?.Title || tpl.title,
        desc: matchedMedia?.Description || tpl.desc,
        mediaUrl: matchedMedia?.MediaUrl || null,
        thumbUrl: matchedMedia?.ThumbnailUrl || matchedMedia?.MediaUrl || null,
        mediaType: matchedMedia?.MediaType || 'VIDEO',
        isVideo,
        is360,
      }
    })
  }, [mediaList, project])

  if (!isVisible && !project) return null

  return (
    <>
      {/* Semi-transparent ambient backdrop */}
      <div
        className={`kenha-overlay-backdrop ${isVisible ? 'show' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main KeNHA Project Overlay */}
      <aside className={`kenha-showcase ${isVisible ? 'show' : ''}`} id="panel">
        <button
          className="close kenha-close-btn"
          id="close"
          onClick={onClose}
          aria-label="Close project showcase"
        >
          ×
        </button>

        {loading && !project ? (
          <div className="kenha-showcase-loading">
            <div className="kenha-spinner" />
            <span>Loading KeNHA project telemetry...</span>
          </div>
        ) : (
          project && (
            <>
              {/* 3D Perspective Curved Arc of Video Cards */}
              <div className="arc" aria-label="Project media highlight cards">
                {arcCards.map((card) => (
                  <button
                    key={card.id}
                    className={`vidcard ${card.className}`}
                    onClick={() => {
                      setActiveVideo(card)
                      setIsPlayingDemo(true)
                    }}
                    aria-label={`Open ${card.title}`}
                  >
                    {card.thumbUrl ? (
                      <img
                        src={card.thumbUrl}
                        alt={card.title}
                        className="vidcard-thumb"
                        loading="lazy"
                      />
                    ) : (
                      <div className="vidcard-highway-bg">
                        <div className="highway-stripes" />
                      </div>
                    )}
                    
                    {/* KeNHA Badge / Play Button */}
                    <b className="play-badge">
                      {card.is360 ? <Compass size={14} /> : <Play size={12} fill="currentColor" />}
                    </b>

                    <div className="vidcard-meta">
                      <span className="vidcard-category">{card.category}</span>
                      <span className="vidcard-label">{card.title}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Centered KeNHA Project Details Cluster */}
              <div className="details">
                <div className="eyebrow">
                  <span className="kenha-brand-pill">KeNHA HIGHWAY INFRASTRUCTURE</span>
                  {project.ProjectCode && (
                    <span className="kenha-code-pill">{project.ProjectCode}</span>
                  )}
                </div>

                <h2 id="pn">{project.ProjectName || project.Name || 'KeNHA Road Project'}</h2>

                <div className="place" id="pl">
                  <MapPin size={14} className="location-icon" />
                  <span>
                    {county} County{subCounty ? ` · ${subCounty}` : ''}{ward ? ` · ${ward}` : ''}
                  </span>
                  <span
                    className="kenha-status-badge"
                    style={{
                      color: statusInfo.color,
                      backgroundColor: statusInfo.bg,
                      borderColor: statusInfo.border,
                    }}
                  >
                    <StatusIcon size={12} />
                    {statusKey}
                  </span>
                </div>

                {/* Progress bar line */}
                <div className="kenha-progress-container">
                  <div className="kenha-progress-track">
                    <div
                      className="kenha-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="kenha-progress-label">{progress}% Executed</span>
                </div>

                {/* KeNHA KPI Stats Cluster */}
                <div className="stats">
                  <div>
                    <b id="pc">{progress}%</b>
                    <small>PROGRESS</small>
                  </div>
                  <div>
                    <b id="bd">{investment}</b>
                    <small>INVESTMENT</small>
                  </div>
                  {project.LengthKm && (
                    <div>
                      <b>{Number(project.LengthKm).toFixed(1)} km</b>
                      <small>CORRIDOR</small>
                    </div>
                  )}
                  <div>
                    <b>{deliveryYear}</b>
                    <small>DELIVERY</small>
                  </div>
                </div>

                {/* Action links */}
                <div className="details-actions">
                  {project.HasRoute === 1 && (
                    <div className="kenha-route-indicator">
                      <Route size={13} />
                      <span>GIS Route Mapped</span>
                    </div>
                  )}
                  <a
                    href={`/project/${project.Slug || project.ProjectId}`}
                    className="kenha-details-btn"
                  >
                    <span>Full Project Dossier & VR</span>
                    <ArrowUpRight size={15} />
                  </a>
                </div>
              </div>
            </>
          )
        )}
      </aside>

      {/* KeNHA Video & VR Player Modal */}
      {activeVideo && (
        <div
          className="video show"
          id="video"
          role="dialog"
          aria-modal="true"
          aria-label={activeVideo.title}
        >
          <div className="player kenha-player">
            <button
              className="close kenha-close-btn"
              id="vclose"
              onClick={() => {
                setActiveVideo(null)
                setIsPlayingDemo(false)
              }}
              aria-label="Close video player"
            >
              ×
            </button>

            <div className="kenha-player-header">
              <div className="kenha-emblem-badge">
                <span className="kenha-logo-text">KeNHA</span>
                <span className="kenha-sub-text">HIGHWAY MONITORING & TELEMETRY</span>
              </div>
              <span className="kenha-player-code">{project?.ProjectCode || 'HIGHWAY-SURVEY'}</span>
            </div>

            <div className="screen kenha-screen">
              {activeVideo.mediaUrl && !activeVideo.mediaUrl.endsWith('.jpg') && !activeVideo.mediaUrl.endsWith('.png') ? (
                <video
                  src={activeVideo.mediaUrl}
                  poster={activeVideo.thumbUrl}
                  autoPlay
                  controls
                  playsInline
                  className="real-video-player"
                />
              ) : activeVideo.thumbUrl && (activeVideo.mediaUrl?.endsWith('.jpg') || activeVideo.mediaUrl?.endsWith('.png')) ? (
                <div className="photo-media-container">
                  <img
                    src={activeVideo.thumbUrl}
                    alt={activeVideo.title}
                    className="photo-media-img"
                  />
                  <div className="photo-media-hud">
                    <span>📷 KeNHA Field Photography & Site Inspection</span>
                  </div>
                </div>
              ) : (
                <div className="demo-player-surface">
                  <div className="highway-grid-lines" />
                  <div className="demo-player-glow" />
                  <button
                    className={`play kenha-play-btn ${isPlayingDemo ? 'pulse' : ''}`}
                    onClick={() => setIsPlayingDemo((p) => !p)}
                    aria-label="Play video"
                  >
                    {isPlayingDemo ? '❚❚' : '▶'}
                  </button>
                  <div className="kenha-hud-overlay">
                    <div className="hud-corner top-left">CORRIDOR: {county.toUpperCase()}</div>
                    <div className="hud-corner top-right">STATUS: {statusKey.toUpperCase()}</div>
                    <div className="hud-corner bottom-left">PROGRESS: {progress}%</div>
                    <div className="hud-corner bottom-right">QUALITY HIGHWAYS, BETTER CONNECTIONS</div>
                  </div>
                </div>
              )}
            </div>

            <div className="kenha-player-info">
              <h3 id="vt">{activeVideo.title}</h3>
              <p>
                {activeVideo.desc ||
                  'Official Kenya National Highways Authority project video stream, site survey, and construction telemetry.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ProjectExplorer
