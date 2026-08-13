import React from 'react';
import { Globe2 } from 'lucide-react';
import './StatsOverlay.css';

const StatsOverlay = ({ projectCount = 0, countyCount = 0 }) => {
  return (
    <div className="stats-overlay">
      <div className="stats-header">
        <Globe2 className="stats-icon" size={24} />
        <span className="stats-title">Kenya Projects</span>
      </div>
      <div className="stats-body">
        <div className="stats-main-number">{projectCount}</div>
        <div className="stats-subtitle">Across {countyCount} Counties</div>
      </div>
    </div>
  );
};

export default StatsOverlay;
