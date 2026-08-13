import React from 'react'
import { Home, Plus, Minus, Crosshair, Sun, Moon } from 'lucide-react'
import './MapControls.css'

const MapControls = ({ onResetView, onZoomIn, onZoomOut, onLocate, viewMode = 'night', onToggleViewMode }) => {
  return (
    <div className="map-controls">
      <button className="control-btn" onClick={onResetView} title="Reset View (Kenya)">
        <Home size={20} />
      </button>

      <button
        className={`control-btn mode-toggle-btn ${viewMode}`}
        onClick={onToggleViewMode}
        title={viewMode === 'night' ? 'Switch to Day Satellite View' : 'Switch to Night View'}
      >
        {viewMode === 'night' ? <Sun size={20} color="#FFC107" /> : <Moon size={20} color="#38BDF8" />}
      </button>

      <div className="control-group">
        <button className="control-btn" onClick={onZoomIn} title="Zoom In (See Land & Roads)">
          <Plus size={20} />
        </button>
        <button className="control-btn" onClick={onZoomOut} title="Zoom Out (World View)">
          <Minus size={20} />
        </button>
      </div>

      <button className="control-btn" onClick={onLocate} title="My Location">
        <Crosshair size={20} />
      </button>
    </div>
  )
}

export default MapControls
