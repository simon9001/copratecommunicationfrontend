import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  X, Play, Pause, Volume2, VolumeX, Maximize2,
  MapPin, Calendar, Ruler, DollarSign, Activity,
  ChevronLeft, ChevronRight, ExternalLink, Route,
  Clock, CheckCircle2, AlertCircle
} from 'lucide-react'
import './ProjectExplorer.css'

/* ─── Status helpers ───────────────────────────────────────────── */

const STATUS_STYLE = {
  Ongoing:   { bg: 'rgba(255,193,7,0.14)',  text: '#FFC107', icon: Activity },
  Completed: { bg: 'rgba(0,230,118,0.14)',  text: '#00E676', icon: CheckCircle2 },
  Planned:   { bg: 'rgba(56,189,248,0.14)', text: '#38BDF8', icon: Clock },
  Suspended: { bg: 'rgba(255,82,82,0.14)',  text: '#FF5252', icon: AlertCircle },
}

/* ─── Curved Arc Fan ────────────────────────────────────────────── */
/*
  Cards spread in a fan arc.  For N items, the active card sits at
  center (index = activeIdx). Adjacent cards rotate outward and shift
  vertically forming the arc shape.
*/
function arcTransform(i, activeIdx, total) {
  const offset = i - activeIdx
  const abs    = Math.abs(offset)
  const sign   = offset < 0 ? -1 : 1

  // Lateral spread per step
  const tx = offset * 170     // px horizontal shift
  // Arc lift: centre card is highest, edges drop
  const ty = abs * abs * 14   // quadratic vertical drop
  // Rotation: fan outward
  const rz = offset * 11      // degrees
  // Scale: active is largest
  const scale = 1 - abs * 0.1
  // Z-depth: active on top
  const zIdx = total - abs

  return { tx, ty, rz, scale, zIdx }
}

const ArcCard = ({ item, index, activeIdx, total, onClick }) => {
  const { tx, ty, rz, scale, zIdx } = arcTransform(index, activeIdx, total)
  const isActive = index === activeIdx
  const isVideo  = item.MediaType?.includes('VIDEO')

  return (
    <div
      className={`arc-card ${isActive ? 'arc-card--active' : ''}`}
      style={{
        transform: `translateX(${tx}px) translateY(${ty}px) rotateZ(${rz}deg) scale(${scale})`,
        zIndex: zIdx,
        transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
      }}
      onClick={() => onClick(index)}
      role="button"
      aria-label={`${isVideo ? 'Video' : 'Image'}: ${item.Title || 'Media item'}`}
      aria-pressed={isActive}
    >
      {/* Thumbnail / video preview */}
      <div className="arc-card-media">
        <img
          src={item.ThumbnailUrl || item.MediaUrl}
          alt={item.Title || 'Project media'}
          className="arc-card-thumb"
          loading="lazy"
        />
        {isVideo && (
          <div className="arc-card-play">
            <Play size={isActive ? 32 : 22} fill="white" />
          </div>
        )}
        {/* Media type pill */}
        <div className="arc-card-type-pill">
          {isVideo ? '▶ VIDEO' : '📷 PHOTO'}
        </div>
      </div>
      {isActive && item.Title && (
        <div className="arc-card-label">{item.Title}</div>
      )}
    </div>
  )
}

/* ─── Inline Video Player ───────────────────────────────────────── */

const VideoPlayer = ({ src, poster, onClose }) => {
  const videoRef = useRef()
  const [playing, setPlaying]   = useState(true)
  const [muted, setMuted]       = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTime = () => setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0)
    v.addEventListener('timeupdate', onTime)
    return () => v.removeEventListener('timeupdate', onTime)
  }, [])

  const toggle = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else          { v.pause(); setPlaying(false) }
  }

  const seek = (e) => {
    const v = videoRef.current
    if (!v) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct  = (e.clientX - rect.left) / rect.width
    v.currentTime = pct * v.duration
  }

  return (
    <div className="video-player-overlay">
      <div className="video-player-wrap">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay
          playsInline
          muted={muted}
          className="video-player-el"
        />

        {/* Controls bar */}
        <div className="video-controls">
          <button className="vc-btn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>

          {/* Progress bar */}
          <div className="vc-progress" onClick={seek} role="slider" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="vc-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <button className="vc-btn" onClick={() => { setMuted(m => !m); if (videoRef.current) videoRef.current.muted = !muted }} aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <button className="vc-btn" onClick={() => videoRef.current?.requestFullscreen()} aria-label="Fullscreen">
            <Maximize2 size={18} />
          </button>
        </div>

        <button className="video-close-btn" onClick={onClose} aria-label="Close video">
          <X size={20} />
        </button>
      </div>
    </div>
  )
}

/* ─── Progress bar ──────────────────────────────────────────────── */

const ProgressBar = ({ value }) => {
  const pct   = Math.min(100, Math.max(0, Number(value) || 0))
  const color = pct >= 90 ? '#00E676' : pct >= 50 ? '#FFC107' : '#38BDF8'
  return (
    <div className="pe-progress-wrap">
      <div className="pe-progress-track">
        <div className="pe-progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="pe-progress-pct" style={{ color }}>{pct}%</span>
    </div>
  )
}

/* ─── Main Component ───────────────────────────────────────────── */

const ProjectExplorer = ({ project, loading, onClose }) => {
  const [activeMediaIdx, setActiveMediaIdx] = useState(0)
  const [playingVideo, setPlayingVideo]     = useState(null)   // media item to play

  // Reset active card when project changes
  useEffect(() => { setActiveMediaIdx(0); setPlayingVideo(null) }, [project?.ProjectId])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { if (playingVideo) setPlayingVideo(null); else onClose() }
      if (!media || media.length === 0) return
      if (e.key === 'ArrowLeft')  setActiveMediaIdx(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setActiveMediaIdx(i => Math.min(media.length - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playingVideo, onClose])

  const isVisible = !!project || loading

  /* Derived project data */
  const media       = project?.media       || []
  const locations   = project?.locations   || []
  const milestones  = project?.milestones  || []
  const updates     = project?.updates     || []

  const primaryLocation = locations.find(l => l.IsPrimaryLocation) || locations[0]
  const county    = primaryLocation?.County   || project?.County || '—'
  const subCounty = primaryLocation?.SubCounty || ''

  const progress  = (() => {
    const latestUpdate = [...updates].sort((a,b) => new Date(b.UpdateDate) - new Date(a.UpdateDate))[0]
    return latestUpdate?.ProgressPercentage ?? null
  })()

  const budget = project?.ProjectCost
    ? `KSh ${Number(project.ProjectCost).toLocaleString()}`
    : null

  const statusStyle = STATUS_STYLE[project?.ProjectStatus] || STATUS_STYLE.Planned
  const StatusIcon  = statusStyle.icon

  const activeMedia = media[activeMediaIdx]
  const isActiveVideo = activeMedia?.MediaType?.includes('VIDEO')

  /* Arc navigation */
  const prevCard = () => setActiveMediaIdx(i => Math.max(0, i - 1))
  const nextCard = () => setActiveMediaIdx(i => Math.min(media.length - 1, i + 1))

  const handlePlayActive = () => {
    if (isActiveVideo) setPlayingVideo(activeMedia)
  }

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className={`pe-backdrop ${isVisible ? 'pe-backdrop--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main panel */}
      <div
        className={`project-explorer ${isVisible ? 'project-explorer--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Project explorer"
      >
        {/* Close button */}
        <button className="pe-close" onClick={onClose} aria-label="Close project explorer">
          <X size={22} />
        </button>

        {/* Loading skeleton */}
        {loading && !project && (
          <div className="pe-loading">
            <div className="pe-skeleton pe-skeleton--arc" />
            <div className="pe-skeleton pe-skeleton--title" />
            <div className="pe-skeleton pe-skeleton--text" />
            <div className="pe-skeleton pe-skeleton--stats" />
          </div>
        )}

        {project && (
          <div className="pe-body">

            {/* ── CURVED ARC MEDIA FAN ──────────────────────────── */}
            <div className="pe-arc-section" aria-label="Project media">
              {media.length === 0 ? (
                <div className="pe-arc-empty">No media available</div>
              ) : (
                <>
                  {/* Arc navigation arrows */}
                  {activeMediaIdx > 0 && (
                    <button className="pe-arc-nav pe-arc-nav--left" onClick={prevCard} aria-label="Previous media">
                      <ChevronLeft size={22} />
                    </button>
                  )}

                  <div className="pe-arc-stage" aria-live="polite">
                    {media.map((item, i) => (
                      <ArcCard
                        key={item.MediaId || i}
                        item={item}
                        index={i}
                        activeIdx={activeMediaIdx}
                        total={media.length}
                        onClick={setActiveMediaIdx}
                      />
                    ))}
                  </div>

                  {activeMediaIdx < media.length - 1 && (
                    <button className="pe-arc-nav pe-arc-nav--right" onClick={nextCard} aria-label="Next media">
                      <ChevronRight size={22} />
                    </button>
                  )}

                  {/* Play button below arc for active video */}
                  {isActiveVideo && (
                    <button
                      className="pe-arc-play-btn"
                      onClick={handlePlayActive}
                      aria-label={`Play video: ${activeMedia.Title || 'Video'}`}
                    >
                      <Play size={18} fill="currentColor" />
                      PLAY VIDEO
                    </button>
                  )}

                  {/* Media counter */}
                  <div className="pe-arc-counter" aria-label={`Media ${activeMediaIdx + 1} of ${media.length}`}>
                    {media.map((_, i) => (
                      <button
                        key={i}
                        className={`pe-arc-dot ${i === activeMediaIdx ? 'active' : ''}`}
                        onClick={() => setActiveMediaIdx(i)}
                        aria-label={`Go to media ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ── PROJECT DETAILS ───────────────────────────────── */}
            <div className="pe-details">

              {/* Header */}
              <div className="pe-header">
                <div className="pe-header-badges">
                  <span className="pe-code-badge">{project.ProjectCode || 'PRJ'}</span>
                  <span
                    className="pe-status-badge"
                    style={{ background: statusStyle.bg, color: statusStyle.text }}
                  >
                    <StatusIcon size={12} />
                    {project.ProjectStatus}
                  </span>
                </div>
                <h2 className="pe-title">{project.ProjectName}</h2>
                <div className="pe-location">
                  <MapPin size={13} />
                  <span>{county}</span>
                  {subCounty && <span className="pe-sublocation"> · {subCounty}</span>}
                </div>
              </div>

              {/* Progress */}
              {progress != null && (
                <div className="pe-progress-section">
                  <div className="pe-section-label">PROGRESS</div>
                  <ProgressBar value={progress} />
                </div>
              )}

              {/* Description */}
              {(project.ShortDescription || project.FullDescription) && (
                <p className="pe-description">
                  {project.ShortDescription || project.FullDescription}
                </p>
              )}

              {/* Stats grid */}
              <div className="pe-stats-grid">
                <div className="pe-stat">
                  <MapPin size={15} className="pe-stat-icon" />
                  <div className="pe-stat-body">
                    <div className="pe-stat-label">County</div>
                    <div className="pe-stat-value">{county}</div>
                  </div>
                </div>

                {project.LengthKm && (
                  <div className="pe-stat">
                    <Ruler size={15} className="pe-stat-icon" />
                    <div className="pe-stat-body">
                      <div className="pe-stat-label">Length</div>
                      <div className="pe-stat-value">{project.LengthKm} km</div>
                    </div>
                  </div>
                )}

                {budget && (
                  <div className="pe-stat">
                    <DollarSign size={15} className="pe-stat-icon" />
                    <div className="pe-stat-body">
                      <div className="pe-stat-label">Budget</div>
                      <div className="pe-stat-value pe-stat-value--budget">{budget}</div>
                    </div>
                  </div>
                )}

                {(project.ExpectedCompletionDate || project.CompletionDate) && (
                  <div className="pe-stat">
                    <Calendar size={15} className="pe-stat-icon" />
                    <div className="pe-stat-body">
                      <div className="pe-stat-label">Completion</div>
                      <div className="pe-stat-value">
                        {new Date(project.CompletionDate || project.ExpectedCompletionDate).getFullYear()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline milestones (compact) */}
              {milestones.length > 0 && (
                <div className="pe-milestones">
                  <div className="pe-section-label">TIMELINE</div>
                  <div className="pe-milestone-list">
                    {milestones.slice(0, 3).map((m, i) => (
                      <div key={m.MilestoneId || i} className="pe-milestone-item">
                        <div className={`pe-milestone-dot ${m.Status === 'Completed' ? 'done' : ''}`} />
                        <div className="pe-milestone-text">
                          <span className="pe-milestone-title">{m.Title}</span>
                          {m.MilestoneDate && (
                            <span className="pe-milestone-date">
                              {new Date(m.MilestoneDate).toLocaleDateString('en-KE', { year: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="pe-actions">
                {isActiveVideo && (
                  <button
                    className="pe-btn pe-btn--primary"
                    onClick={handlePlayActive}
                  >
                    <Play size={16} fill="currentColor" />
                    PLAY VIDEO
                  </button>
                )}
                <a
                  href={`/project/${project.Slug}`}
                  className="pe-btn pe-btn--outline"
                  aria-label={`View full details for ${project.ProjectName}`}
                >
                  <ExternalLink size={15} />
                  FULL DETAILS
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inline video player (full-screen modal) */}
      {playingVideo && (
        <VideoPlayer
          src={playingVideo.MediaUrl}
          poster={playingVideo.ThumbnailUrl}
          onClose={() => setPlayingVideo(null)}
        />
      )}
    </>
  )
}

export default ProjectExplorer
