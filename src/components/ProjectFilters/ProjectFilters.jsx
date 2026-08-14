import React, { useState } from 'react'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import './ProjectFilters.css'

const STATUS_OPTIONS = ['All', 'Ongoing', 'Completed', 'Planned', 'Suspended']

const STATUS_COLORS = {
  Ongoing: 'var(--color-ongoing, #FFC107)',
  Completed: 'var(--color-completed, #00E676)',
  Planned: 'var(--color-planned, #38BDF8)',
  Suspended: 'var(--color-suspended, #FF5252)',
}

const ProjectFilters = ({ statusFilter, countyFilter, countyOptions = [], onStatusChange, onCountyChange, projectCount }) => {
  const [isOpen, setIsOpen] = useState(false)

  const activeFilterCount = (statusFilter !== 'All' ? 1 : 0) + (countyFilter !== 'All' ? 1 : 0)

  return (
    <div className={`project-filters ${isOpen ? 'expanded' : ''}`}>
      <button
        className="filters-toggle"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-label="Toggle project filters"
      >
        <Filter size={16} />
        <span className="filters-toggle-label">FILTERS</span>
        {activeFilterCount > 0 && (
          <span className="filters-badge">{activeFilterCount}</span>
        )}
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {isOpen && (
        <div className="filters-body">
          <div className="filter-section">
            <div className="filter-section-label">STATUS</div>
            <div className="filter-options">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
                  style={s !== 'All' && statusFilter === s ? { borderColor: STATUS_COLORS[s], color: STATUS_COLORS[s] } : {}}
                  onClick={() => onStatusChange(s)}
                  aria-pressed={statusFilter === s}
                >
                  {s !== 'All' && (
                    <span
                      className="filter-chip-dot"
                      style={{ background: STATUS_COLORS[s] }}
                    />
                  )}
                  {s}
                </button>
              ))}
            </div>
          </div>

          {countyOptions.length > 0 && (
            <div className="filter-section">
              <div className="filter-section-label">COUNTY</div>
              <div className="filter-options filter-options-counties">
                <button
                  className={`filter-chip ${countyFilter === 'All' ? 'active' : ''}`}
                  onClick={() => onCountyChange('All')}
                  aria-pressed={countyFilter === 'All'}
                >
                  All
                </button>
                {countyOptions.map((county) => (
                  <button
                    key={county}
                    className={`filter-chip ${countyFilter === county ? 'active' : ''}`}
                    onClick={() => onCountyChange(county)}
                    aria-pressed={countyFilter === county}
                  >
                    {county}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="filter-result-count">
            <span className="filter-result-number">{projectCount}</span>
            <span className="filter-result-label"> project{projectCount !== 1 ? 's' : ''} shown</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectFilters
