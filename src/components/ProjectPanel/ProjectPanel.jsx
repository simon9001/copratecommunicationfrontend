import React from 'react';
import { X, ExternalLink, Calendar, MapPin, Activity, Ruler } from 'lucide-react';
import './ProjectPanel.css';

const ProjectPanel = ({ project, onClose }) => {
  if (!project) return null;

  const year = project.CompletionDate ? new Date(project.CompletionDate).getFullYear() : 
               project.StartDate ? new Date(project.StartDate).getFullYear() : 'N/A';

  const county = project.Locations && project.Locations.length > 0 
    ? project.Locations[0].County 
    : 'Unknown County';

  return (
    <div className={`project-panel ${project ? 'open' : ''}`}>
      <button className="panel-close-btn" onClick={onClose} aria-label="Close panel">
        <X size={24} />
      </button>

      <div className="panel-content">
        <div className="panel-header">
          <span className="project-badge">{project.ProjectCode || 'PRJ'}</span>
          <h2 className="project-title">{project.ProjectName}</h2>
          <div className="project-location">
            <MapPin size={16} />
            <span>{county}</span>
          </div>
        </div>

        {project.Media && project.Media.length > 0 && (
          <div className="panel-media-carousel">
            <img src={project.Media[0].Url} alt={project.ProjectName} className="panel-media-img" />
          </div>
        )}

        <div className="panel-description">
          <p>{project.Description || 'No description available for this project.'}</p>
        </div>

        <div className="panel-stats-grid">
          <div className="stat-card">
            <Ruler size={20} className="stat-icon" />
            <div className="stat-info">
              <span className="stat-label">Length</span>
              <span className="stat-value">{project.LengthKm ? `${project.LengthKm} km` : 'N/A'}</span>
            </div>
          </div>
          
          <div className="stat-card">
            <MapPin size={20} className="stat-icon" />
            <div className="stat-info">
              <span className="stat-label">County</span>
              <span className="stat-value">{county}</span>
            </div>
          </div>

          <div className="stat-card">
            <Calendar size={20} className="stat-icon" />
            <div className="stat-info">
              <span className="stat-label">Year</span>
              <span className="stat-value">{year}</span>
            </div>
          </div>

          <div className="stat-card">
            <Activity size={20} className="stat-icon" />
            <div className="stat-info">
              <span className="stat-label">Status</span>
              <span className="stat-value status-badge">{project.ProjectStatus || 'Unknown'}</span>
            </div>
          </div>
        </div>

        <a href={`/project/${project.Slug}`} className="panel-btn-primary">
          View More Details
          <ExternalLink size={18} />
        </a>
      </div>
    </div>
  );
};

export default ProjectPanel;
