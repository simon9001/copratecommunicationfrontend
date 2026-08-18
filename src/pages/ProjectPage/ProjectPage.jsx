import React, { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Ruler,
  DollarSign,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Compass,
  Play,
  Share2,
  Route,
  ShieldCheck,
  Building2,
  Layers,
  Sparkles
} from 'lucide-react'
import MediaCarousel from '../../components/MediaCarousel/MediaCarousel'
import VRPlayer from '../../components/VRPlayer/VRPlayer'
import './ProjectPage.css'

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
  if (!dateStr) return 'TBD'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'TBD'
  return d.toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })
}

const STATUS_CONFIG = {
  Ongoing: { color: '#FDB813', bg: 'rgba(253, 184, 19, 0.16)', border: 'rgba(253, 184, 19, 0.45)', icon: Activity },
  Completed: { color: '#00E676', bg: 'rgba(0, 230, 118, 0.16)', border: 'rgba(0, 230, 118, 0.45)', icon: CheckCircle2 },
  Planned: { color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.16)', border: 'rgba(56, 189, 248, 0.45)', icon: Clock },
  Suspended: { color: '#FF5252', bg: 'rgba(255, 82, 82, 0.16)', border: 'rgba(255, 82, 82, 0.45)', icon: AlertTriangle },
  Cancelled: { color: '#FF5252', bg: 'rgba(255, 82, 82, 0.16)', border: 'rgba(255, 82, 82, 0.45)', icon: AlertTriangle },
}

const ProjectPage = () => {
  const { slug } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/v1/projects/slug/${slug}`)
        if (!response.ok) throw new Error('Project not found or network error')
        const json = await response.json()
        setProject(json.data || json)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [slug])

  const locations = project?.locations || project?.Locations || []
  const primaryLocation = locations.find((l) => l.IsPrimaryLocation) || locations[0]
  const county = primaryLocation?.County || project?.County || 'Kenya'
  const subCounty = primaryLocation?.SubCounty || project?.SubCounty || ''
  const ward = primaryLocation?.Ward || project?.Ward || ''

  const mediaList = project?.media || project?.Media || []
  const milestones = project?.milestones || project?.Milestones || []
  const updates = project?.updates || project?.Updates || []

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

  const statusKey = project?.ProjectStatus || project?.Status || 'Ongoing'
  const statusInfo = STATUS_CONFIG[statusKey] || STATUS_CONFIG.Ongoing
  const StatusIcon = statusInfo.icon

  const featuredMedia = mediaList.find(m => m.IsFeatured) || mediaList[0]

  if (loading) {
    return (
      <div className="kenha-page-loading">
        <div className="kenha-page-spinner" />
        <span>Loading KeNHA Project Dossier...</span>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="kenha-page-error">
        <h2>Project Dossier Unavailable</h2>
        <p>{error || 'The requested project could not be found.'}</p>
        <Link to="/" className="kenha-btn-back">
          <ArrowLeft size={16} /> Return to Interactive Globe
        </Link>
      </div>
    )
  }

  return (
    <div className="kenha-project-page">
      {/* Top Breadcrumbs and Navigation */}
      <div className="kenha-page-nav">
        <Link to="/" className="kenha-back-button">
          <ArrowLeft size={18} />
          <span>Interactive Globe Map</span>
        </Link>
        <div className="kenha-brand-tag">
          <span className="brand-dot" />
          <span>KENYA NATIONAL HIGHWAYS AUTHORITY • PROJECT DOSSIER</span>
        </div>
      </div>

      {/* Hero Header Section */}
      <div className="kenha-hero">
        <div className="kenha-hero-media-wrapper">
          {featuredMedia ? (
            featuredMedia.MediaType?.includes('VIDEO') ? (
              <video
                src={featuredMedia.MediaUrl}
                poster={featuredMedia.ThumbnailUrl}
                autoPlay
                loop
                muted
                playsInline
                className="kenha-hero-media"
              />
            ) : (
              <img
                src={featuredMedia.MediaUrl || featuredMedia.ThumbnailUrl}
                alt={project.ProjectName || project.Name}
                className="kenha-hero-media"
              />
            )
          ) : (
            <div className="kenha-hero-fallback">
              <div className="fallback-grid" />
            </div>
          )}
          <div className="kenha-hero-gradient" />
        </div>

        <div className="kenha-hero-content">
          <div className="kenha-hero-badges">
            {project.ProjectCode && (
              <span className="hero-code-badge">{project.ProjectCode}</span>
            )}
            <span
              className="hero-status-badge"
              style={{
                color: statusInfo.color,
                backgroundColor: statusInfo.bg,
                borderColor: statusInfo.border,
              }}
            >
              <StatusIcon size={14} />
              {statusKey}
            </span>
          </div>

          <h1 className="kenha-hero-title">{project.ProjectName || project.Name}</h1>

          <div className="kenha-hero-location">
            <MapPin size={16} className="loc-icon" />
            <span>
              {county} County{subCounty ? ` · ${subCounty}` : ''}{ward ? ` · ${ward}` : ''}
            </span>
          </div>

          {/* KPI Stat Ribbon */}
          <div className="kenha-kpi-ribbon">
            <div className="kpi-block">
              <span className="kpi-label">TOTAL INVESTMENT</span>
              <span className="kpi-value gold">
                {formatInvestment(project.ProjectCost || project.CostKes, project.CurrencyCode)}
              </span>
            </div>
            <div className="kpi-divider" />
            <div className="kpi-block">
              <span className="kpi-label">CORRIDOR LENGTH</span>
              <span className="kpi-value">
                {project.LengthKm ? `${Number(project.LengthKm).toFixed(1)} km` : '—'}
              </span>
            </div>
            <div className="kpi-divider" />
            <div className="kpi-block">
              <span className="kpi-label">EXECUTION PROGRESS</span>
              <span className="kpi-value gold">{progress}%</span>
            </div>
            <div className="kpi-divider" />
            <div className="kpi-block">
              <span className="kpi-label">TARGET DELIVERY</span>
              <span className="kpi-value">
                {project.CompletionDate
                  ? new Date(project.CompletionDate).getFullYear()
                  : project.ExpectedCompletionDate
                  ? new Date(project.ExpectedCompletionDate).getFullYear()
                  : '2026'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="kenha-content-grid">
        {/* Left Column: Project Narrative, Gallery, Timeline, Updates */}
        <main className="kenha-main-column">
          {/* Section: Project Overview */}
          <section className="kenha-section">
            <div className="section-header">
              <div className="section-title-wrap">
                <span className="section-eyebrow">EXECUTIVE BRIEF</span>
                <h2>Strategic Highway Overview</h2>
              </div>
            </div>
            <div className="section-body">
              <p className="project-lead-text">
                {project.ShortDescription ||
                  'The Kenya National Highways Authority is executing this priority trunk corridor to boost regional connectivity, facilitate international freight logistics, and drive local socio-economic transformation.'}
              </p>
              {project.FullDescription && (
                <div className="project-full-text">
                  <p>{project.FullDescription}</p>
                </div>
              )}
            </div>
          </section>

          {/* Section: Media & VR Gallery */}
          <section className="kenha-section">
            <div className="section-header">
              <div className="section-title-wrap">
                <span className="section-eyebrow">VISUAL INSPECTION & TELEMETRY</span>
                <h2>Drone Footage, Gallery & 360 VR</h2>
              </div>
            </div>
            <div className="section-body">
              {mediaList.length > 0 ? (
                <MediaCarousel
                  items={mediaList}
                  onSelect={(item) => setSelectedMedia(item)}
                />
              ) : (
                <div className="kenha-media-empty">
                  <Compass size={32} className="empty-icon" />
                  <p>Official site footage and drone aerial surveillance will be synced shortly.</p>
                </div>
              )}
            </div>
          </section>

          {/* Section: Milestones Timeline */}
          {milestones.length > 0 && (
            <section className="kenha-section">
              <div className="section-header">
                <div className="section-title-wrap">
                  <span className="section-eyebrow">ENGINEERING SCHEDULE</span>
                  <h2>Construction Milestones</h2>
                </div>
              </div>
              <div className="section-body">
                <div className="kenha-timeline">
                  {milestones.map((m, idx) => (
                    <div key={m.MilestoneId || idx} className="timeline-node">
                      <div
                        className={`timeline-dot ${
                          m.Status === 'Completed' ? 'completed' : 'in-progress'
                        }`}
                      />
                      <div className="timeline-content">
                        <div className="timeline-meta">
                          <span className="timeline-date">{formatDate(m.MilestoneDate)}</span>
                          <span className={`timeline-status ${m.Status?.toLowerCase()}`}>
                            {m.Status || 'Completed'}
                          </span>
                        </div>
                        <h4 className="timeline-title">{m.Title}</h4>
                        {m.Description && <p className="timeline-desc">{m.Description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Section: Project Updates */}
          {updates.length > 0 && (
            <section className="kenha-section">
              <div className="section-header">
                <div className="section-title-wrap">
                  <span className="section-eyebrow">SITE FIELD REPORTS</span>
                  <h2>Recent Project Updates</h2>
                </div>
              </div>
              <div className="section-body">
                <div className="updates-list">
                  {updates.map((u, idx) => (
                    <div key={u.UpdateId || idx} className="update-card">
                      <div className="update-header">
                        <h4>{u.Title}</h4>
                        <span className="update-date">{formatDate(u.UpdateDate)}</span>
                      </div>
                      {u.ProgressPercentage != null && (
                        <div className="update-progress-bar">
                          <div
                            className="update-progress-fill"
                            style={{ width: `${u.ProgressPercentage}%` }}
                          />
                          <span>{u.ProgressPercentage}% Telemetry</span>
                        </div>
                      )}
                      <p className="update-text">{u.Content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Right Sidebar: Specifications & Authority Data */}
        <aside className="kenha-sidebar">
          {/* KeNHA Official Spec Card */}
          <div className="kenha-spec-card">
            <div className="spec-card-header">
              <ShieldCheck size={20} className="spec-icon" />
              <div>
                <h3>Technical Specifications</h3>
                <span className="spec-sub">KeNHA Engineering Registry</span>
              </div>
            </div>

            <div className="spec-list">
              <div className="spec-row">
                <span className="spec-name">Authority</span>
                <span className="spec-val">KeNHA</span>
              </div>
              <div className="spec-row">
                <span className="spec-name">Project Code</span>
                <span className="spec-val code">{project.ProjectCode || '—'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-name">County Jurisdiction</span>
                <span className="spec-val">{county}</span>
              </div>
              {subCounty && (
                <div className="spec-row">
                  <span className="spec-name">Sub-County</span>
                  <span className="spec-val">{subCounty}</span>
                </div>
              )}
              {project.LengthKm && (
                <div className="spec-row">
                  <span className="spec-name">Road Length</span>
                  <span className="spec-val">{Number(project.LengthKm).toFixed(2)} km</span>
                </div>
              )}
              <div className="spec-row">
                <span className="spec-name">Total Budget</span>
                <span className="spec-val gold">
                  {formatInvestment(project.ProjectCost || project.CostKes, project.CurrencyCode)}
                </span>
              </div>
              <div className="spec-row">
                <span className="spec-name">Commencement Date</span>
                <span className="spec-val">{formatDate(project.StartDate)}</span>
              </div>
              <div className="spec-row">
                <span className="spec-name">Target Completion</span>
                <span className="spec-val">
                  {formatDate(project.CompletionDate || project.ExpectedCompletionDate)}
                </span>
              </div>
              <div className="spec-row">
                <span className="spec-name">Publication Status</span>
                <span className="spec-val published">{project.PublicationStatus || 'Published'}</span>
              </div>
            </div>

            <Link to="/" className="kenha-spec-map-btn">
              <Route size={16} />
              <span>Locate on 3D Globe</span>
            </Link>
          </div>
        </aside>
      </div>

      {/* VR / Full Media Player Modal */}
      {selectedMedia && (
        <VRPlayer media={selectedMedia} onClose={() => setSelectedMedia(null)} />
      )}
    </div>
  )
}

export default ProjectPage
