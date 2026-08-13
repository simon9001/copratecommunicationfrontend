import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MediaCarousel from '../../components/MediaCarousel/MediaCarousel';
import VRPlayer from '../../components/VRPlayer/VRPlayer';
import './ProjectPage.css';

const ProjectPage = () => {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/v1/projects/slug/${slug}`);
        if (!response.ok) throw new Error('Failed to fetch project');
        const data = await response.json();
        setProject(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [slug]);

  if (loading) return <div className="project-page loading">Loading...</div>;
  if (error) return <div className="project-page error">Error: {error}</div>;
  if (!project) return <div className="project-page not-found">Project not found</div>;

  const getStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'COMPLETED': return 'status-green';
      case 'ONGOING': return 'status-amber';
      case 'PLANNED': return 'status-blue';
      default: return '';
    }
  };

  const featuredMedia = project.media?.[0];

  return (
    <div className="project-page">
      <Link to="/" className="back-button">
        <ArrowLeft size={20} /> Back to Globe
      </Link>
      
      <div className="hero-section">
        {featuredMedia ? (
          featuredMedia.MediaType === 'IMAGE' ? (
            <img src={featuredMedia.MediaUrl} alt={project.Name} className="hero-media" />
          ) : (
             <video src={featuredMedia.MediaUrl} autoPlay loop muted playsInline className="hero-media" />
          )
        ) : (
           <div className="hero-placeholder">No media available</div>
        )}
        <div className="hero-overlay">
          <span className={`status-badge ${getStatusColor(project.Status)}`}>{project.Status}</span>
          <h1 className="project-title">{project.Name}</h1>
        </div>
      </div>

      <div className="content-grid">
        <div className="main-content">
          <section className="description-section">
            <h2>About Project</h2>
            <p className="project-description">{project.Description}</p>
          </section>

          <section className="media-section">
             <h2>Gallery & VR</h2>
             {project.media && project.media.length > 0 ? (
               <MediaCarousel items={project.media} onSelect={setSelectedMedia} />
             ) : (
               <p>No gallery items found.</p>
             )}
          </section>

           <section className="milestones-section">
            <h2>Timeline</h2>
             {project.milestones && project.milestones.length > 0 ? (
                <div className="milestone-timeline">
                  {project.milestones.map((milestone, index) => (
                    <div key={milestone.MilestoneID || index} className="milestone-item">
                      <div className="milestone-dot"></div>
                      <div className="milestone-content">
                         <h4>{milestone.Title}</h4>
                         <span className="milestone-date">{new Date(milestone.Date).toLocaleDateString()}</span>
                         <p>{milestone.Description}</p>
                      </div>
                    </div>
                  ))}
                </div>
             ) : (
               <p>No milestones recorded.</p>
             )}
          </section>
        </div>

        <aside className="sidebar">
          <div className="stats-card">
             <h3>Project Details</h3>
             <div className="stat-item">
                <span className="stat-label">Length</span>
                <span className="stat-value">{project.LengthKm ? `${project.LengthKm} km` : 'N/A'}</span>
             </div>
             <div className="stat-item">
                <span className="stat-label">Cost</span>
                <span className="stat-value">{project.CostKes ? `KES ${project.CostKes.toLocaleString()}` : 'N/A'}</span>
             </div>
             <div className="stat-item">
                <span className="stat-label">Region</span>
                <span className="stat-value">{project.Region || 'N/A'}</span>
             </div>
             <div className="stat-item">
                <span className="stat-label">Completion Date</span>
                <span className="stat-value">{project.CompletionDate ? new Date(project.CompletionDate).toLocaleDateString() : 'TBD'}</span>
             </div>
          </div>
        </aside>
      </div>
      
      {selectedMedia && (
        <VRPlayer media={selectedMedia} onClose={() => setSelectedMedia(null)} />
      )}
    </div>
  );
};

export default ProjectPage;
