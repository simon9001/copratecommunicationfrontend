import React, { useMemo } from 'react'
import { X, MapPin, Activity, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import './CountyPanel.css'

const CountyPanel = ({ county, projects = [], onClose, onViewProjects }) => {
  const isOpen = !!county
  const countyName = county?.properties?.shapeName || county?.properties?.name || ''

  const stats = useMemo(() => {
    if (!countyName) return { total: 0, ongoing: 0, completed: 0, planned: 0, suspended: 0 }
    const countyProjects = projects.filter(
      (p) => (p.County || '').toLowerCase() === countyName.toLowerCase()
    )
    return {
      total: countyProjects.length,
      ongoing: countyProjects.filter((p) => p.ProjectStatus === 'Ongoing').length,
      completed: countyProjects.filter((p) => p.ProjectStatus === 'Completed').length,
      planned: countyProjects.filter((p) => p.ProjectStatus === 'Planned').length,
      suspended: countyProjects.filter((p) => p.ProjectStatus === 'Suspended').length,
    }
  }, [county, projects, countyName])

  return (
    <div className={`county-panel ${isOpen ? 'open' : ''}`} role="complementary" aria-label="County information panel">
      <button className="county-panel-close" onClick={onClose} aria-label="Close county panel">
        <X size={20} />
      </button>

      <div className="county-panel-content">
        <div className="county-panel-header">
          <div className="county-panel-badge">
            <MapPin size={14} />
            COUNTY
          </div>
          <h2 className="county-panel-name">{countyName}</h2>
        </div>

        <div className="county-stats-grid">
          <div className="county-stat-card total">
            <div className="county-stat-number">{stats.total}</div>
            <div className="county-stat-label">Total Projects</div>
          </div>
          <div className="county-stat-card ongoing">
            <Activity size={16} className="county-stat-icon" />
            <div className="county-stat-number">{stats.ongoing}</div>
            <div className="county-stat-label">Ongoing</div>
          </div>
          <div className="county-stat-card completed">
            <CheckCircle2 size={16} className="county-stat-icon" />
            <div className="county-stat-number">{stats.completed}</div>
            <div className="county-stat-label">Completed</div>
          </div>
          <div className="county-stat-card planned">
            <Clock size={16} className="county-stat-icon" />
            <div className="county-stat-number">{stats.planned}</div>
            <div className="county-stat-label">Planned</div>
          </div>
        </div>

        {stats.suspended > 0 && (
          <div className="county-suspended-notice">
            <AlertTriangle size={14} />
            {stats.suspended} project{stats.suspended > 1 ? 's' : ''} suspended
          </div>
        )}

        <button
          className="county-view-btn"
          onClick={() => onViewProjects(countyName)}
          disabled={stats.total === 0}
          aria-label={`View all projects in ${countyName}`}
        >
          {stats.total > 0 ? `VIEW ${stats.total} PROJECT${stats.total !== 1 ? 'S' : ''}` : 'NO PROJECTS'}
        </button>
      </div>
    </div>
  )
}

export default CountyPanel
