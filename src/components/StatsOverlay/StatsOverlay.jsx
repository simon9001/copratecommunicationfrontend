import React, { useMemo } from 'react'
import { Globe2, Activity, CheckCircle2, Clock } from 'lucide-react'
import './StatsOverlay.css'

const CountUp = ({ value }) => {
  return <span className="stats-count">{value}</span>
}

const StatsOverlay = ({ projects = [] }) => {
  const stats = useMemo(() => {
    const total = projects.length
    const ongoing   = projects.filter((p) => p.ProjectStatus === 'Ongoing').length
    const completed = projects.filter((p) => p.ProjectStatus === 'Completed').length
    const planned   = projects.filter((p) => p.ProjectStatus === 'Planned').length
    const counties  = new Set(projects.map((p) => p.County).filter(Boolean)).size
    return { total, ongoing, completed, planned, counties }
  }, [projects])

  return (
    <div className="stats-overlay" role="status" aria-label="Project statistics">
      <div className="stats-header">
        <Globe2 className="stats-icon" size={20} />
        <span className="stats-title">KeNHA PROJECTS</span>
      </div>

      <div className="stats-main">
        <div className="stats-main-number">{stats.total}</div>
        <div className="stats-main-sub">Across {stats.counties} {stats.counties === 1 ? 'County' : 'Counties'}</div>
      </div>

      <div className="stats-breakdown">
        <div className="stats-breakdown-item ongoing">
          <Activity size={13} />
          <span className="breakdown-num">{stats.ongoing}</span>
          <span className="breakdown-label">Ongoing</span>
        </div>
        <div className="stats-breakdown-divider" />
        <div className="stats-breakdown-item completed">
          <CheckCircle2 size={13} />
          <span className="breakdown-num">{stats.completed}</span>
          <span className="breakdown-label">Done</span>
        </div>
        <div className="stats-breakdown-divider" />
        <div className="stats-breakdown-item planned">
          <Clock size={13} />
          <span className="breakdown-num">{stats.planned}</span>
          <span className="breakdown-label">Planned</span>
        </div>
      </div>
    </div>
  )
}

export default StatsOverlay
