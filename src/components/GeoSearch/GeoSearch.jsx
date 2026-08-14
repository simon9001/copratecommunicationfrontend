import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Search, X, MapPin, Briefcase, Map } from 'lucide-react'
import { kenyaCities } from '../../data/kenyaCities.js'
import './GeoSearch.css'

const GeoSearch = ({ counties = [], projects = [], onSelectLocation, onSelectProject }) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef()
  const containerRef = useRef()

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return []
    const q = query.toLowerCase()

    const cityMatches = kenyaCities
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map((c) => ({ type: 'city', label: c.name, sublabel: 'City / Town', lat: c.lat, lng: c.lng, altitude: 0.4 }))

    const countyMatches = counties
      .filter((f) => {
        const name = f.properties?.shapeName || f.properties?.name || ''
        return name.toLowerCase().includes(q)
      })
      .slice(0, 3)
      .map((f) => {
        const name = f.properties?.shapeName || f.properties?.name || ''
        // Compute centroid from bbox
        const coords = f.geometry?.coordinates?.[0]
        let lat = -1.286, lng = 36.817
        if (coords && coords.length > 0) {
          lat = coords.reduce((s, c) => s + c[1], 0) / coords.length
          lng = coords.reduce((s, c) => s + c[0], 0) / coords.length
        }
        return { type: 'county', label: name + ' County', sublabel: 'County', lat, lng, altitude: 0.6, feature: f }
      })

    const projectMatches = projects
      .filter((p) => {
        const name = (p.ProjectName || '').toLowerCase()
        const code = (p.ProjectCode || '').toLowerCase()
        return name.includes(q) || code.includes(q)
      })
      .slice(0, 4)
      .map((p) => ({ type: 'project', label: p.ProjectName, sublabel: p.ProjectCode || 'Project', lat: p.Latitude, lng: p.Longitude, altitude: 0.35, project: p }))

    return [...countyMatches, ...cityMatches, ...projectMatches]
  }, [query, counties, projects])

  useEffect(() => {
    setIsOpen(results.length > 0 && isFocused)
  }, [results, isFocused])

  // Click outside to close
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false)
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const handleSelect = (item) => {
    setQuery('')
    setIsOpen(false)
    setIsFocused(false)
    if (item.type === 'project') {
      onSelectProject?.(item.project)
    } else {
      onSelectLocation?.(item.lat, item.lng, item.altitude)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setQuery('')
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const getIcon = (type) => {
    if (type === 'city') return <MapPin size={14} />
    if (type === 'county') return <Map size={14} />
    return <Briefcase size={14} />
  }

  return (
    <div className="geo-search" ref={containerRef}>
      <div className={`geo-search-input-wrap ${isFocused ? 'focused' : ''}`}>
        <Search size={16} className="geo-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="geo-search-input"
          placeholder="Search county, city, or project..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search geographic locations and projects"
          aria-autocomplete="list"
          aria-expanded={isOpen}
        />
        {query && (
          <button className="geo-search-clear" onClick={() => { setQuery(''); inputRef.current?.focus() }} aria-label="Clear search">
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="geo-search-dropdown" role="listbox">
          {results.map((item, i) => (
            <button
              key={i}
              className={`geo-search-result result-${item.type}`}
              onClick={() => handleSelect(item)}
              role="option"
            >
              <span className="result-icon">{getIcon(item.type)}</span>
              <span className="result-text">
                <span className="result-label">{item.label}</span>
                <span className="result-sublabel">{item.sublabel}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default GeoSearch
