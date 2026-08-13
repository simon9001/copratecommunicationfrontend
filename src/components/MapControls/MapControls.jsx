import React from 'react';
import { Home, Plus, Minus, Crosshair } from 'lucide-react';
import './MapControls.css';

const MapControls = ({ onResetView, onZoomIn, onZoomOut, onLocate }) => {
  return (
    <div className="map-controls">
      <button className="control-btn" onClick={onResetView} title="Reset View">
        <Home size={20} />
      </button>
      <div className="control-group">
        <button className="control-btn" onClick={onZoomIn} title="Zoom In">
          <Plus size={20} />
        </button>
        <button className="control-btn" onClick={onZoomOut} title="Zoom Out">
          <Minus size={20} />
        </button>
      </div>
      <button className="control-btn" onClick={onLocate} title="My Location">
        <Crosshair size={20} />
      </button>
    </div>
  );
};

export default MapControls;
