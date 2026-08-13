import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Image, Tag, Users, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/v1/projects');
        const data = await response.json();
        setProjects(data.data || []);
      } catch (err) {
        console.error('Failed to fetch projects', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin-portal');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-logo">KeNHA <span>Admin</span></h2>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/admin" className="nav-item active">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/admin/projects" className="nav-item">
            <FolderOpen size={20} /> Projects
          </Link>
          <Link to="/admin/media" className="nav-item">
            <Image size={20} /> Media Library
          </Link>
          <Link to="/admin/categories" className="nav-item">
            <Tag size={20} /> Categories
          </Link>
          <Link to="/admin/users" className="nav-item">
            <Users size={20} /> Users
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>Dashboard Overview</h1>
          <div className="user-info">
             Logged in as: <strong>{user?.name || user?.email || 'Admin'}</strong>
          </div>
        </header>

        <div className="admin-content">
           <section className="dashboard-section">
             <div className="section-header">
               <h2>Recent Projects</h2>
               <button className="btn-primary">Add Project</button>
             </div>
             
             <div className="table-container">
               {loading ? (
                 <p>Loading projects...</p>
               ) : (
                 <table className="admin-table">
                   <thead>
                     <tr>
                       <th>Name</th>
                       <th>Region</th>
                       <th>Status</th>
                       <th>Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {projects.map(project => (
                       <tr key={project.ProjectID}>
                         <td>{project.Name}</td>
                         <td>{project.Region || 'N/A'}</td>
                         <td>
                           <span className={`status-pill ${project.Status?.toLowerCase()}`}>
                             {project.Status}
                           </span>
                         </td>
                         <td>
                            <button className="btn-icon">Edit</button>
                         </td>
                       </tr>
                     ))}
                     {projects.length === 0 && (
                       <tr>
                         <td colSpan="4" className="text-center">No projects found</td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               )}
             </div>
           </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
