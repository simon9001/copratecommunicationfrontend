import React from 'react'
import { X, ExternalLink, Calendar, MapPin, Activity, Ruler, DollarSign, Route } from 'lucide-react'
import './ProjectPanel.css'

const STATUS_COLORS = {
  Ongoing:   { bg: 'rgba(255,193,7,0.12)',   text: '#FFC107' },
  Completed: { bg: 'rgba(0,230,118,0.12)',   text: '#00E676' },
  Planned:   { bg: 'rgba(56,189,248,0.12)',  text: '#38BDF8' },
  Suspended: { bg: 'rgba(255,82,82,0.12)',   text: '#FF5252' },
  Cancelled: { bg: 'rgba(255,82,82,0.12)',   text: '#FF5252' },
}

const StatusBadge = ({ status }) => {
  const style = STATUS_COLORS[status] || { bg: 'rgba(255,255,255,0.08)', text: '#94A3B8' }
  return (
    <span
      className="project-status-badge"
      style={{ background: style.bg, color: style.text }}
      aria-label={`Project status: ${status}`}
    >
      {status || 'Unknown'}
    </span>
  )
}

const ProgressBar = ({ value }) => {
  const pct = Math.min(100, Math.max(0, Number(value) || 0))
  const color =
    pct >= 90 ? '#00E676' :
    pct >= 50 ? '#FFC107' :
    '#38BDF8'
  return (
    <div className="progress-bar-wrap" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress: ${pct}%`}>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="progress-bar-pct">{pct}%</span>
    </div>
  )
}

const ProjectPanel = ({ project, onClose, hasRoute, onViewRoute }) => {
  if (!project) return null

  const county =
    project.County ||
    (project.Locations && project.Locations.length > 0
      ? project.Locations[0].County
      : null) ||
    'Unknown County'

  const completionYear =
    project.CompletionDate
      ? new Date(project.CompletionDate).getFullYear()
      : project.ExpectedCompletionDate
      ? new Date(project.ExpectedCompletionDate).getFullYear()
      : null

  const startYear = project.StartDate
    ? new Date(project.StartDate).getFullYear()
    : null

  const budget = project.ProjectCost
    ? `KSh ${Number(project.ProjectCost).toLocaleString()}`
    : null

  return (
    <div className={`project-panel ${project ? 'open' : ''}`} role="complementary" aria-label="Project details panel">
      <button className="panel-close-btn" onClick={onClose} aria-label="Close project panel">
        <X size={22} />
      </button>

      <div className="panel-content">
        {/* Header */}
        <div className="panel-header">
          <div className="panel-header-top">
            <span className="project-badge">{project.ProjectCode || 'PRJ'}</span>
            <StatusBadge status={project.ProjectStatus} />
          </div>
          <h2 className="project-title">{project.ProjectName}</h2>
          <div className="project-location">
            <MapPin size={14} />
            <span>{county}</span>
            {project.SubCounty && <span className="project-subcounty"> · {project.SubCounty}</span>}
          </div>
        </div>

        {/* Progress */}
        {project.ProgressPercentage != null && (
          <div className="panel-progress">
            <div className="panel-progress-label">Progress</div>
            <ProgressBar value={project.ProgressPercentage} />
          </div>
        )}

        {/* Media */}
        {project.Media && project.Media.length > 0 && (
          <div className="panel-media-carousel">
            <img
              src={project.Media[0].MediaUrl || project.Media[0].Url}
              alt={project.ProjectName}
              className="panel-media-img"
              loading="lazy"
            />
          </div>
        )}

        {/* Description */}
        {project.ShortDescription || project.Description ? (
          <div className="panel-description">
            <p>{project.ShortDescription || project.Description}</p>
          </div>
        ) : null}

        {/* Stats grid */}
        <div className="panel-stats-grid">
          {project.LengthKm && (
            <div className="stat-card">
              <Ruler size={18} className="stat-icon" />
              <div className="stat-info">
                <span className="stat-label">Length</span>
                <span className="stat-value">{project.LengthKm} km</span>
              </div>
            </div>
          )}

          {(startYear || completionYear) && (
            <div className="stat-card">
              <Calendar size={18} className="stat-icon" />
              <div className="stat-info">
                <span className="stat-label">{completionYear ? 'Completion' : 'Start'}</span>
                <span className="stat-value">{completionYear || startYear}</span>
              </div>
            </div>
          )}

          {budget && (
            <div className="stat-card stat-card--wide">
              <DollarSign size={18} className="stat-icon" />
              <div className="stat-info">
                <span className="stat-label">Budget</span>
                <span className="stat-value stat-value--budget">{budget}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="panel-actions">
          {hasRoute && (
            <button className="panel-btn-route" onClick={onViewRoute} aria-label="Highlight project route on map">
              <Route size={16} />
              View Route
            </button>
          )}
          <a href={`/project/${project.Slug}`} className="panel-btn-primary" aria-label={`View full details of ${project.ProjectName}`}>
            View Details
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  )
}

export default ProjectPanel
