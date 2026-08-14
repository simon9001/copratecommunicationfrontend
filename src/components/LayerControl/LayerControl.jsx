import React, { useState } from 'react'
import { Layers, ChevronUp, ChevronDown } from 'lucide-react'
import './LayerControl.css'

const LAYER_GROUPS = [
  {
    label: 'BASE LAYERS',
    layers: [
      { key: 'satellite', label: 'Satellite Imagery', defaultOn: true },
      { key: 'kenyaBoundary', label: 'Kenya Boundary', defaultOn: true },
      { key: 'counties', label: 'Counties', defaultOn: true },
    ],
  },
  {
    label: 'GEOGRAPHIC',
    layers: [
      { key: 'cities', label: 'Cities & Towns', defaultOn: true },
      { key: 'majorRoads', label: 'Major Roads', defaultOn: false },
      { key: 'rivers', label: 'Rivers & Lakes', defaultOn: false },
      { key: 'subCounties', label: 'Sub-Counties', defaultOn: false },
    ],
  },
  {
    label: 'PROJECT DATA',
    layers: [
      { key: 'projects', label: 'KeNHA Projects', defaultOn: true },
      { key: 'projectRoutes', label: 'Project Routes', defaultOn: true },
    ],
  },
  {
    label: 'ENVIRONMENTAL',
    layers: [
      { key: 'terrain', label: 'Terrain', defaultOn: false },
      { key: 'soil', label: 'Soil Data', defaultOn: false },
    ],
  },
]

const LayerControl = ({ activeLayers, onLayerToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={`layer-control ${isExpanded ? 'expanded' : ''}`}>
      <button
        className="layer-control-header"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        aria-label="Toggle map layers panel"
      >
        <Layers size={18} />
        <span className="layer-control-title">MAP LAYERS</span>
        {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {isExpanded && (
        <div className="layer-groups">
          {LAYER_GROUPS.map((group) => (
            <div key={group.label} className="layer-group">
              <div className="layer-group-label">{group.label}</div>
              {group.layers.map((layer) => {
                const active = activeLayers[layer.key] ?? layer.defaultOn
                return (
                  <label
                    key={layer.key}
                    className={`layer-toggle ${active ? 'active' : ''}`}
                    aria-label={`${active ? 'Disable' : 'Enable'} ${layer.label} layer`}
                  >
                    <button
                      className="layer-toggle-btn"
                      onClick={() => onLayerToggle(layer.key, !active)}
                      aria-pressed={active}
                    >
                      <span className={`toggle-indicator ${active ? 'on' : 'off'}`} />
                    </button>
                    <span className="layer-toggle-label">{layer.label}</span>
                  </label>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LayerControl
