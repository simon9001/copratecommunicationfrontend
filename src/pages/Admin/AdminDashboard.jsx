import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, Image as ImageIcon, Tag, Users, LogOut,
  Plus, Edit, Trash2, Globe, Search, CheckCircle2, Clock, AlertCircle,
  Play, Eye, ExternalLink, X, RefreshCw, Shield, MapPin, DollarSign,
  Ruler, Layers, Video, Filter, ArrowUpRight, Upload, Film, FileText, Check,
  Sun, Moon
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import {
  getProjects, createProject, updateProject, updateProjectStatus, deleteProject,
  getAllMedia, createMedia, deleteMedia,
  getCategories, createCategory,
  getUsers, createUser, toggleUserStatus, deleteUser
} from '../../services/api'
import './AdminDashboard.css'

const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo Marakwet', 'Embu', 'Garissa', 'Homa Bay',
  'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii',
  'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera',
  'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi', 'Nakuru', 'Nandi',
  'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya', 'Taita Taveta', 'Tana River',
  'Tharaka Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
]

const ALL_ROLES = [
  'Super Administrator',
  'ICT Administrator',
  'Communications Manager',
  'Communications Editor',
  'Communications Officer',
  'Viewer'
]

// Preset road construction videos and images for quick 1-click addition
const SAMPLE_MEDIA_PRESETS = [
  {
    title: 'Nairobi Expressway Aerial Drone Survey',
    type: 'VIDEO',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=800&q=80',
    desc: 'High-definition 4K aerial drone survey of expressway corridor alignment.',
  },
  {
    title: 'Highway Asphalt Paving Operations',
    type: 'VIDEO',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1584463699039-3d02a0a202d0?auto=format&fit=crop&w=800&q=80',
    desc: 'Heavy mechanical asphalt laying and bitumen compaction works.',
  },
  {
    title: 'Dual Carriageway Interchange Construction',
    type: 'IMAGE',
    url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80',
    desc: 'Structural flyover and elevated junction construction site.',
  },
  {
    title: 'Coastal Bypass Bridge & Pier Engineering',
    type: 'IMAGE',
    url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
    desc: 'Marine bridge pier concrete casting and safety barricades.',
  },
]

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  // Navigation tab state
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'projects' | 'media' | 'categories' | 'users'

  // Data states
  const [projects, setProjects] = useState([])
  const [mediaList, setMediaList] = useState([])
  const [categories, setCategories] = useState([])
  const [userList, setUserList] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Feedback toast
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Filters & Search
  const [projectSearch, setProjectSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [countyFilter, setCountyFilter] = useState('All')
  const [mediaTypeFilter, setMediaTypeFilter] = useState('All')

  // Modals state
  const [projectModal, setProjectModal] = useState({ open: false, mode: 'create', data: null })
  const [mediaModal, setMediaModal] = useState({ open: false, defaultProjectId: null })
  const [categoryModal, setCategoryModal] = useState({ open: false })
  const [userModal, setUserModal] = useState({ open: false })
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, id: null, title: '' })

  // Media upload mode: 'file' | 'url' | 'presets'
  const [mediaUploadSource, setMediaUploadSource] = useState('file')
  const [selectedFileName, setSelectedFileName] = useState('')

  // Form states
  const [projectForm, setProjectForm] = useState({
    projectCode: '',
    projectName: '',
    shortDescription: '',
    fullDescription: '',
    projectStatus: 'Ongoing',
    publicationStatus: 'Published',
    projectCost: '',
    lengthKm: '',
    county: 'Nairobi',
    subCounty: '',
    latitude: -1.286389,
    longitude: 36.817222,
    isFeatured: false,
    isPublished: true,
  })

  const [mediaForm, setMediaForm] = useState({
    projectId: '',
    mediaType: 'VIDEO',
    title: '',
    mediaUrl: '',
    thumbnailUrl: '',
    isFeatured: true,
    description: '',
  })

  const [categoryForm, setCategoryForm] = useState({
    categoryName: '',
    description: '',
    iconName: 'road',
  })

  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    roleNames: ['Communications Officer'],
  })

  // Fetch all dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const [projRes, mediaRes, catRes, userRes] = await Promise.allSettled([
        getProjects({ limit: 100 }),
        getAllMedia(),
        getCategories(),
        getUsers(),
      ])

      if (projRes.status === 'fulfilled') {
        const raw = projRes.value?.data?.items || projRes.value?.data || projRes.value || []
        setProjects(Array.isArray(raw) ? raw : [])
      }
      if (mediaRes.status === 'fulfilled') {
        const raw = mediaRes.value?.data || mediaRes.value || []
        setMediaList(Array.isArray(raw) ? raw : [])
      }
      if (catRes.status === 'fulfilled') {
        const raw = catRes.value?.data || catRes.value || []
        setCategories(Array.isArray(raw) ? raw : [])
      }
      if (userRes.status === 'fulfilled') {
        const raw = userRes.value?.data || userRes.value || []
        setUserList(Array.isArray(raw) ? raw : [])
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      showToast('Error loading dashboard data', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleLogout = () => {
    logout()
    navigate('/admin-portal')
  }

  // --- Metrics calculation ---
  const metrics = useMemo(() => {
    const total = projects.length
    const ongoing = projects.filter(p => (p.ProjectStatus || p.Status) === 'Ongoing').length
    const completed = projects.filter(p => (p.ProjectStatus || p.Status) === 'Completed').length
    const planned = projects.filter(p => (p.ProjectStatus || p.Status) === 'Planned').length
    const published = projects.filter(p => (p.PublicationStatus || (p.IsPublished ? 'Published' : 'Draft')) === 'Published').length
    const totalCost = projects.reduce((acc, p) => acc + (Number(p.ProjectCost) || 0), 0)
    const countiesCount = new Set(projects.map(p => p.County).filter(Boolean)).size

    return {
      total,
      ongoing,
      completed,
      planned,
      published,
      totalCost: (totalCost / 1e9).toFixed(1), // in Billions
      countiesCount,
      mediaCount: mediaList.length,
      usersCount: userList.length,
    }
  }, [projects, mediaList, userList])

  // --- Filtered projects ---
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const q = projectSearch.toLowerCase()
      const matchesSearch = !q ||
        (p.ProjectName || '').toLowerCase().includes(q) ||
        (p.ProjectCode || '').toLowerCase().includes(q) ||
        (p.County || '').toLowerCase().includes(q)

      const matchesStatus = statusFilter === 'All' || (p.ProjectStatus || p.Status) === statusFilter
      const matchesCounty = countyFilter === 'All' || (p.County || '').toLowerCase() === countyFilter.toLowerCase()

      return matchesSearch && matchesStatus && matchesCounty
    })
  }, [projects, projectSearch, statusFilter, countyFilter])

  // Map project media counts
  const projectMediaCounts = useMemo(() => {
    const counts = {}
    mediaList.forEach(m => {
      counts[m.ProjectId] = (counts[m.ProjectId] || 0) + 1
    })
    return counts
  }, [mediaList])

  // --- Filtered media ---
  const filteredMedia = useMemo(() => {
    return mediaList.filter(m => {
      if (mediaTypeFilter === 'All') return true
      return m.MediaType === mediaTypeFilter
    })
  }, [mediaList, mediaTypeFilter])

  // --- Project CRUD Handlers ---
  const handleOpenCreateProject = () => {
    setProjectForm({
      projectCode: `KEN-${Date.now().toString().slice(-4)}`,
      projectName: '',
      shortDescription: '',
      fullDescription: '',
      projectStatus: 'Ongoing',
      publicationStatus: 'Published',
      projectCost: '',
      lengthKm: '',
      county: 'Nairobi',
      subCounty: '',
      latitude: -1.286389,
      longitude: 36.817222,
      isFeatured: false,
      isPublished: true,
    })
    setProjectModal({ open: true, mode: 'create', data: null })
  }

  const handleOpenEditProject = (project) => {
    setProjectForm({
      projectCode: project.ProjectCode || '',
      projectName: project.ProjectName || project.Name || '',
      shortDescription: project.ShortDescription || '',
      fullDescription: project.FullDescription || project.Description || '',
      projectStatus: project.ProjectStatus || project.Status || 'Ongoing',
      publicationStatus: project.PublicationStatus || 'Published',
      projectCost: project.ProjectCost || '',
      lengthKm: project.LengthKm || '',
      county: project.County || 'Nairobi',
      subCounty: project.SubCounty || '',
      latitude: Number(project.Latitude) || -1.286389,
      longitude: Number(project.Longitude) || 36.817222,
      isFeatured: Boolean(project.IsFeatured),
      isPublished: Boolean(project.IsPublished || project.PublicationStatus === 'Published'),
    })
    setProjectModal({ open: true, mode: 'edit', data: project })
  }

  const handleOpenAddMediaForProject = (project) => {
    const pId = project.ProjectId || project.ProjectID
    setMediaForm({
      projectId: pId ? String(pId) : '',
      mediaType: 'VIDEO',
      title: `${project.ProjectName || 'Highway'} Footage`,
      mediaUrl: '',
      thumbnailUrl: '',
      isFeatured: true,
      description: '',
    })
    setSelectedFileName('')
    setMediaUploadSource('file')
    setMediaModal({ open: true, defaultProjectId: pId })
  }

  const handleSaveProject = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const payload = {
        projectCode: projectForm.projectCode,
        projectName: projectForm.projectName,
        shortDescription: projectForm.shortDescription,
        fullDescription: projectForm.fullDescription,
        projectStatus: projectForm.projectStatus,
        publicationStatus: projectForm.publicationStatus,
        projectCost: projectForm.projectCost ? Number(projectForm.projectCost) : undefined,
        lengthKm: projectForm.lengthKm ? Number(projectForm.lengthKm) : undefined,
        county: projectForm.county,
        subCounty: projectForm.subCounty,
        latitude: Number(projectForm.latitude),
        longitude: Number(projectForm.longitude),
        isFeatured: projectForm.isFeatured,
        isPublished: projectForm.publicationStatus === 'Published',
      }

      if (projectModal.mode === 'create') {
        await createProject(payload)
        showToast(`Project '${payload.projectName}' created successfully!`)
      } else {
        const id = projectModal.data.ProjectId || projectModal.data.ProjectID
        await updateProject(id, payload)
        showToast(`Project '${payload.projectName}' updated successfully!`)
      }

      setProjectModal({ open: false, mode: 'create', data: null })
      await loadDashboardData()
    } catch (err) {
      console.error('Error saving project:', err)
      showToast(err.message || 'Failed to save project', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleTogglePublish = async (project) => {
    const id = project.ProjectId || project.ProjectID
    const currentStatus = project.PublicationStatus || (project.IsPublished ? 'Published' : 'Draft')
    const nextStatus = currentStatus === 'Published' ? 'Draft' : 'Published'

    try {
      await updateProjectStatus(id, nextStatus, 'Toggled from admin dashboard')
      showToast(`Project status updated to ${nextStatus}`)
      await loadDashboardData()
    } catch (err) {
      showToast('Failed to update publication status', 'error')
    }
  }

  // --- Local File Upload Handler ---
  const handleLocalFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')

    if (!isVideo && !isImage) {
      showToast('Please select a valid image (PNG/JPG) or video (MP4/WebM) file.', 'error')
      return
    }

    setSelectedFileName(file.name)
    setMediaForm(prev => ({
      ...prev,
      mediaType: isVideo ? 'VIDEO' : 'IMAGE',
      title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
    }))

    const reader = new FileReader()
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target.result
      setMediaForm(prev => ({
        ...prev,
        mediaUrl: dataUrl,
        thumbnailUrl: isImage ? dataUrl : prev.thumbnailUrl,
      }))
      showToast(`Loaded ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`)
    }
    reader.readAsDataURL(file)
  }

  const handleApplyPreset = (preset) => {
    setMediaForm(prev => ({
      ...prev,
      mediaType: preset.type,
      title: preset.title,
      mediaUrl: preset.url,
      thumbnailUrl: preset.thumbnail,
      description: preset.desc,
    }))
    setSelectedFileName(preset.title)
    showToast(`Applied preset: ${preset.title}`)
  }

  // --- Media Submission ---
  const handleSaveMedia = async (e) => {
    e.preventDefault()
    if (!mediaForm.projectId) {
      showToast('Please select a project to attach this media file to.', 'error')
      return
    }
    if (!mediaForm.mediaUrl) {
      showToast('Please select a local video/image file or enter a media URL.', 'error')
      return
    }

    setActionLoading(true)
    try {
      const payload = {
        projectId: Number(mediaForm.projectId),
        mediaType: mediaForm.mediaType,
        title: mediaForm.title || 'Project Media File',
        description: mediaForm.description || '',
        mediaUrl: mediaForm.mediaUrl,
        thumbnailUrl: mediaForm.thumbnailUrl || mediaForm.mediaUrl,
        isFeatured: Boolean(mediaForm.isFeatured),
        isPublished: true,
        approvalStatus: 'Approved',
        displayOrder: 1,
      }

      await createMedia(Number(mediaForm.projectId), payload)
      showToast('Media added to project successfully!')
      setMediaModal({ open: false, defaultProjectId: null })
      setMediaForm({ projectId: '', mediaType: 'VIDEO', title: '', mediaUrl: '', thumbnailUrl: '', isFeatured: true, description: '' })
      setSelectedFileName('')
      await loadDashboardData()
    } catch (err) {
      console.error('Error adding media:', err)
      showToast(err.message || 'Failed to add media', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // --- Category Handlers ---
  const handleSaveCategory = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      await createCategory(categoryForm)
      showToast(`Category '${categoryForm.categoryName}' created!`)
      setCategoryModal({ open: false })
      setCategoryForm({ categoryName: '', description: '', iconName: 'road' })
      await loadDashboardData()
    } catch (err) {
      showToast(err.message || 'Failed to create category', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // --- User Handlers ---
  const handleSaveUser = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      await createUser(userForm)
      showToast(`User account '${userForm.email}' created!`)
      setUserModal({ open: false })
      setUserForm({ fullName: '', email: '', password: '', roleNames: ['Communications Officer'] })
      await loadDashboardData()
    } catch (err) {
      showToast(err.message || 'Failed to create user', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleUserActive = async (targetUser) => {
    try {
      await toggleUserStatus(targetUser.UserId, !targetUser.IsActive)
      showToast(`User ${targetUser.Email} ${targetUser.IsActive ? 'deactivated' : 'activated'}`)
      await loadDashboardData()
    } catch (err) {
      showToast('Failed to update user status', 'error')
    }
  }

  // --- Deletion Dialog Execution ---
  const confirmDeleteAction = async () => {
    setActionLoading(true)
    try {
      if (deleteConfirm.type === 'project') {
        await deleteProject(deleteConfirm.id)
        showToast('Project deleted successfully')
      } else if (deleteConfirm.type === 'media') {
        await deleteMedia(deleteConfirm.projectId, deleteConfirm.id)
        showToast('Media item deleted')
      } else if (deleteConfirm.type === 'user') {
        await deleteUser(deleteConfirm.id)
        showToast('User account removed')
      }
      setDeleteConfirm({ open: false, type: null, id: null, title: '' })
      await loadDashboardData()
    } catch (err) {
      showToast(err.message || 'Deletion failed', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="admin-layout">
      {/* Toast Notification */}
      {toast && (
        <div className={`admin-toast ${toast.type}`} role="status">
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <Globe className="brand-icon" size={24} />
            <h2 className="sidebar-logo">KeNHA <span>Admin</span></h2>
          </div>
          <span className="brand-tag">Geospatial Explorer v2.0</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <FolderOpen size={18} />
            <span>Projects</span>
            <span className="nav-badge">{projects.length}</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            <ImageIcon size={18} />
            <span>Media Library</span>
            <span className="nav-badge">{mediaList.length}</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <Tag size={18} />
            <span>Categories</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            <span>Users & Security</span>
            <span className="nav-badge">{userList.length}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="sidebar-action-link" target="_blank">
            <ExternalLink size={16} />
            <span>Public Globe Explorer</span>
          </Link>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="header-titles">
            <h1>
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'projects' && 'Highway Projects & Media Manager'}
              {activeTab === 'media' && 'Project Media Library'}
              {activeTab === 'categories' && 'Infrastructure Categories'}
              {activeTab === 'users' && 'System Users & Access Control'}
            </h1>
            <p className="header-subtitle">Kenya National Highways Authority Corporate GIS System</p>
          </div>

          <div className="header-actions">
            <button
              className="btn-refresh"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="btn-refresh" onClick={loadDashboardData} disabled={loading} title="Refresh Data">
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            </button>
            <div className="user-profile-badge">
              <div className="user-avatar">
                {(user?.fullName || user?.FullName || user?.email || 'A')[0].toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-name">{user?.fullName || user?.FullName || user?.name || user?.email || 'Admin'}</span>
                <span className="user-role">
                  <Shield size={11} />
                  {Array.isArray(user?.roles) ? user.roles.join(', ') : 'Super Administrator'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {/* =========================================================
              1. OVERVIEW TAB
             ========================================================= */}
          {activeTab === 'overview' && (
            <div className="tab-view overview-view">
              {/* Metric Cards Grid */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-icon total">
                    <FolderOpen size={22} />
                  </div>
                  <div className="metric-info">
                    <span className="metric-label">Total Projects</span>
                    <span className="metric-value">{metrics.total}</span>
                    <span className="metric-sub">{metrics.published} Published on Globe</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon ongoing">
                    <Clock size={22} />
                  </div>
                  <div className="metric-info">
                    <span className="metric-label">Ongoing Works</span>
                    <span className="metric-value">{metrics.ongoing}</span>
                    <span className="metric-sub">{metrics.completed} Completed Projects</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon budget">
                    <DollarSign size={22} />
                  </div>
                  <div className="metric-info">
                    <span className="metric-label">Total Portfolio</span>
                    <span className="metric-value">KES {metrics.totalCost}B</span>
                    <span className="metric-sub">Across {metrics.countiesCount} Counties</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon media">
                    <Video size={22} />
                  </div>
                  <div className="metric-info">
                    <span className="metric-label">Photos & Videos</span>
                    <span className="metric-value">{metrics.mediaCount}</span>
                    <span className="metric-sub">{metrics.usersCount} Active Officers</span>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="quick-actions-bar">
                <button className="btn-primary" onClick={handleOpenCreateProject}>
                  <Plus size={16} /> Add Highway Project
                </button>
                <button className="btn-secondary highlight-btn" onClick={() => { setMediaUploadSource('file'); setMediaModal({ open: true, defaultProjectId: null }) }}>
                  <Upload size={16} /> Add Photos & Videos
                </button>
                <button className="btn-secondary" onClick={() => setUserModal({ open: true })}>
                  <Plus size={16} /> Add User Account
                </button>
                <button className="btn-secondary" onClick={() => setCategoryModal({ open: true })}>
                  <Plus size={16} /> New Category
                </button>
              </div>

              {/* Recent Projects Table Preview */}
              <section className="dashboard-section">
                <div className="section-header">
                  <h2>Recent Infrastructure Projects</h2>
                  <button className="section-link" onClick={() => setActiveTab('projects')}>
                    View All ({projects.length}) <ArrowUpRight size={14} />
                  </button>
                </div>

                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Project Name</th>
                        <th>County</th>
                        <th>Media</th>
                        <th>Cost (KES)</th>
                        <th>Status</th>
                        <th>Globe State</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.slice(0, 5).map((project, index) => (
                        <tr key={project.ProjectId ?? `proj-${index}`}>
                          <td>
                            <span className="code-pill">{project.ProjectCode}</span>
                          </td>
                          <td>
                            <strong>{project.ProjectName}</strong>
                          </td>
                          <td>
                            <span className="location-tag">
                              <MapPin size={12} /> {project.County || 'Kenya'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="table-media-badge"
                              onClick={() => handleOpenAddMediaForProject(project)}
                              title="Click to add/manage media"
                            >
                              <Video size={12} />
                              <span>{projectMediaCounts[project.ProjectId] || 0} files</span>
                              <Plus size={10} className="plus-icon" />
                            </button>
                          </td>
                          <td>
                            {project.ProjectCost
                              ? `KES ${(Number(project.ProjectCost) / 1e9).toFixed(2)}B`
                              : '—'}
                          </td>
                          <td>
                            <span className={`status-pill ${(project.ProjectStatus || '').toLowerCase()}`}>
                              {project.ProjectStatus}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`publish-toggle ${project.PublicationStatus === 'Published' ? 'published' : 'draft'}`}
                              onClick={() => handleTogglePublish(project)}
                              title="Click to toggle publish status"
                            >
                              {project.PublicationStatus === 'Published' ? '● Published' : '○ Draft'}
                            </button>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn-icon"
                                onClick={() => handleOpenAddMediaForProject(project)}
                                title="Add Video / Photo"
                              >
                                <Upload size={14} />
                              </button>
                              <button className="btn-icon" onClick={() => handleOpenEditProject(project)} title="Edit Project">
                                <Edit size={14} />
                              </button>
                              <button
                                className="btn-icon danger"
                                onClick={() => setDeleteConfirm({
                                  open: true,
                                  type: 'project',
                                  id: project.ProjectId,
                                  title: project.ProjectName
                                })}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* =========================================================
              2. PROJECTS TAB
             ========================================================= */}
          {activeTab === 'projects' && (
            <div className="tab-view projects-view">
              <div className="view-toolbar">
                <div className="search-box">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search by code, name, or county..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                  />
                  {projectSearch && <button className="clear-btn" onClick={() => setProjectSearch('')}><X size={14} /></button>}
                </div>

                <div className="filter-group">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Planned">Planned</option>
                    <option value="Suspended">Suspended</option>
                  </select>

                  <select value={countyFilter} onChange={(e) => setCountyFilter(e.target.value)}>
                    <option value="All">All Counties</option>
                    {KENYA_COUNTIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="toolbar-actions">
                  <button className="btn-secondary highlight-btn" onClick={() => { setMediaUploadSource('file'); setMediaModal({ open: true, defaultProjectId: null }) }}>
                    <Upload size={15} /> Add Media
                  </button>
                  <button className="btn-primary" onClick={handleOpenCreateProject}>
                    <Plus size={15} /> New Project
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Project Name</th>
                      <th>County / Location</th>
                      <th>Media Assets</th>
                      <th>Cost (KES)</th>
                      <th>Length</th>
                      <th>Status</th>
                      <th>Publication</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project, index) => (
                      <tr key={project.ProjectId ?? `p-${index}`}>
                        <td>
                          <span className="code-pill">{project.ProjectCode}</span>
                        </td>
                        <td>
                          <strong>{project.ProjectName}</strong>
                          {project.ShortDescription && (
                            <div className="table-desc-sub">{project.ShortDescription}</div>
                          )}
                        </td>
                        <td>
                          <div className="location-cell">
                            <MapPin size={13} className="pin-icon" />
                            <span>{project.County || '—'}</span>
                            {project.SubCounty && <span className="subcounty-tag">({project.SubCounty})</span>}
                          </div>
                        </td>
                        <td>
                          <button
                            className="table-media-badge"
                            onClick={() => handleOpenAddMediaForProject(project)}
                            title="Add videos and photos for this project"
                          >
                            <Film size={12} />
                            <span>{projectMediaCounts[project.ProjectId] || 0} items</span>
                            <Plus size={11} className="plus-icon" />
                          </button>
                        </td>
                        <td>
                          {project.ProjectCost
                            ? `KES ${(Number(project.ProjectCost) / 1e9).toFixed(2)}B`
                            : '—'}
                        </td>
                        <td>{project.LengthKm ? `${project.LengthKm} km` : '—'}</td>
                        <td>
                          <span className={`status-pill ${(project.ProjectStatus || '').toLowerCase()}`}>
                            {project.ProjectStatus}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`publish-toggle ${project.PublicationStatus === 'Published' ? 'published' : 'draft'}`}
                            onClick={() => handleTogglePublish(project)}
                          >
                            {project.PublicationStatus === 'Published' ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-icon"
                              onClick={() => handleOpenAddMediaForProject(project)}
                              title="Add Videos / Photos"
                            >
                              <Upload size={14} />
                            </button>
                            <button
                              className="btn-icon"
                              onClick={() => handleOpenEditProject(project)}
                              title="Edit Project"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              className="btn-icon danger"
                              onClick={() => setDeleteConfirm({
                                open: true,
                                type: 'project',
                                id: project.ProjectId,
                                title: project.ProjectName
                              })}
                              title="Delete Project"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProjects.length === 0 && (
                      <tr key="no-filtered-projects">
                        <td colSpan="9" className="text-center">No projects match the current search or filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================
              3. MEDIA LIBRARY TAB
             ========================================================= */}
          {activeTab === 'media' && (
            <div className="tab-view media-view">
              <div className="view-toolbar">
                <div className="filter-chips">
                  {['All', 'VIDEO', 'IMAGE', '360_VIDEO', '360_IMAGE'].map(t => (
                    <button
                      key={t}
                      className={`filter-chip ${mediaTypeFilter === t ? 'active' : ''}`}
                      onClick={() => setMediaTypeFilter(t)}
                    >
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <button className="btn-primary" onClick={() => { setMediaUploadSource('file'); setMediaModal({ open: true, defaultProjectId: null }) }}>
                  <Upload size={16} /> Add Video / Photo
                </button>
              </div>

              <div className="media-grid">
                {filteredMedia.map((m, index) => (
                  <div key={m.MediaId ?? `media-${index}`} className="media-card">
                    <div className="media-preview-wrap">
                      {m.MediaType?.includes('VIDEO') ? (
                        <video
                          src={m.MediaUrl}
                          poster={m.ThumbnailUrl}
                          className="media-card-img"
                          muted
                          controls={false}
                        />
                      ) : (
                        <img src={m.ThumbnailUrl || m.MediaUrl} alt={m.Title || 'Media preview'} className="media-card-img" />
                      )}
                      <div className="media-card-badge">{m.MediaType}</div>
                      {m.IsFeatured && <div className="media-featured-badge">★ Featured</div>}
                      {m.MediaType?.includes('VIDEO') && (
                        <div className="media-play-indicator">
                          <Play size={22} fill="white" />
                        </div>
                      )}
                    </div>
                    <div className="media-card-body">
                      <h4 className="media-card-title">{m.Title || 'Project Media File'}</h4>
                      <p className="media-card-project">
                        <FolderOpen size={12} /> {m.ProjectName || `Project #${m.ProjectId}`}
                      </p>
                      {m.Description && <p className="media-card-desc">{m.Description}</p>}
                      <div className="media-card-footer">
                        <a href={m.MediaUrl} target="_blank" rel="noreferrer" className="media-card-link">
                          <Eye size={13} /> View Full
                        </a>
                        <button
                          className="btn-icon danger"
                          onClick={() => setDeleteConfirm({
                            open: true,
                            type: 'media',
                            id: m.MediaId,
                            projectId: m.ProjectId,
                            title: m.Title || 'Media File'
                          })}
                          title="Delete Media"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredMedia.length === 0 && (
                  <div className="empty-state-box">
                    <ImageIcon size={44} className="empty-icon" />
                    <h3>No Media Files Added Yet</h3>
                    <p>Add highway inspection videos, aerial drone shots, or site photos to bring your 3D globe to life.</p>
                    <button className="btn-primary" onClick={() => { setMediaUploadSource('file'); setMediaModal({ open: true, defaultProjectId: null }) }}>
                      <Upload size={16} /> Add Videos & Photos Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              4. CATEGORIES TAB
             ========================================================= */}
          {activeTab === 'categories' && (
            <div className="tab-view categories-view">
              <div className="view-toolbar">
                <h2>Highway Project Categories</h2>
                <button className="btn-primary" onClick={() => setCategoryModal({ open: true })}>
                  <Plus size={16} /> Add Category
                </button>
              </div>

              <div className="categories-grid">
                {categories.map((cat, index) => (
                  <div key={cat.CategoryId ?? `cat-${index}`} className="category-card">
                    <div className="category-card-header">
                      <div className="cat-icon-badge">
                        <Tag size={20} />
                      </div>
                      <h3>{cat.CategoryName}</h3>
                    </div>
                    <p className="category-card-desc">{cat.Description || 'No description provided.'}</p>
                    <div className="category-card-footer">
                      <span className="cat-code">Icon: {cat.IconName || 'road'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================
              5. USERS & ROLES TAB
             ========================================================= */}
          {activeTab === 'users' && (
            <div className="tab-view users-view">
              <div className="view-toolbar">
                <h2>KeNHA Authorized User Accounts</h2>
                <button className="btn-primary" onClick={() => setUserModal({ open: true })}>
                  <Plus size={16} /> Register New Account
                </button>
              </div>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Email Address</th>
                      <th>Assigned Role(s)</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userList.map((u, index) => (
                      <tr key={u.UserId ?? `user-${index}`}>
                        <td>
                          <strong>{u.FullName}</strong>
                        </td>
                        <td>
                          <span className="email-text">{u.Email}</span>
                        </td>
                        <td>
                          <div className="role-tags">
                            {(u.Roles || ['Viewer']).map(r => (
                              <span key={r} className="role-pill">
                                <Shield size={10} /> {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <button
                            className={`status-toggle ${u.IsActive ? 'active' : 'inactive'}`}
                            onClick={() => handleToggleUserActive(u)}
                            title="Click to toggle user active status"
                          >
                            {u.IsActive ? 'Active' : 'Suspended'}
                          </button>
                        </td>
                        <td>
                          {u.LastLoginAt
                            ? new Date(u.LastLoginAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })
                            : 'Never'}
                        </td>
                        <td>
                          <button
                            className="btn-icon danger"
                            onClick={() => setDeleteConfirm({
                              open: true,
                              type: 'user',
                              id: u.UserId,
                              title: u.FullName || u.Email
                            })}
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =========================================================
          MODALS & DIALOGS
         ========================================================= */}

      {/* 1. PROJECT MODAL (Create / Edit) */}
      {projectModal.open && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box project-modal-box">
            <div className="modal-header">
              <h3>{projectModal.mode === 'create' ? 'Add Highway Project' : 'Edit Project Details'}</h3>
              <button className="modal-close" onClick={() => setProjectModal({ open: false, mode: 'create', data: null })}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="modal-form">
              <div className="form-row two-col">
                <div className="form-group">
                  <label>Project Code *</label>
                  <input
                    type="text"
                    required
                    value={projectForm.projectCode}
                    onChange={(e) => setProjectForm({ ...projectForm, projectCode: e.target.value })}
                    placeholder="e.g. KEN-HWY-009"
                  />
                </div>
                <div className="form-group">
                  <label>Project Name *</label>
                  <input
                    type="text"
                    required
                    value={projectForm.projectName}
                    onChange={(e) => setProjectForm({ ...projectForm, projectName: e.target.value })}
                    placeholder="e.g. Nairobi-Nakuru Expressway"
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Project Status</label>
                  <select
                    value={projectForm.projectStatus}
                    onChange={(e) => setProjectForm({ ...projectForm, projectStatus: e.target.value })}
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Planned">Planned</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Publication Status</label>
                  <select
                    value={projectForm.publicationStatus}
                    onChange={(e) => setProjectForm({ ...projectForm, publicationStatus: e.target.value })}
                  >
                    <option value="Published">Published (Visible on Globe)</option>
                    <option value="Draft">Draft (Internal Only)</option>
                    <option value="Pending Review">Pending Review</option>
                  </select>
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Project Budget / Cost (KES)</label>
                  <input
                    type="number"
                    value={projectForm.projectCost}
                    onChange={(e) => setProjectForm({ ...projectForm, projectCost: e.target.value })}
                    placeholder="e.g. 15000000000"
                  />
                </div>
                <div className="form-group">
                  <label>Length (Kilometres)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={projectForm.lengthKm}
                    onChange={(e) => setProjectForm({ ...projectForm, lengthKm: e.target.value })}
                    placeholder="e.g. 45.5"
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>County *</label>
                  <select
                    value={projectForm.county}
                    onChange={(e) => setProjectForm({ ...projectForm, county: e.target.value })}
                  >
                    {KENYA_COUNTIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sub-County / Town</label>
                  <input
                    type="text"
                    value={projectForm.subCounty}
                    onChange={(e) => setProjectForm({ ...projectForm, subCounty: e.target.value })}
                    placeholder="e.g. Westlands"
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>GPS Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={projectForm.latitude}
                    onChange={(e) => setProjectForm({ ...projectForm, latitude: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>GPS Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={projectForm.longitude}
                    onChange={(e) => setProjectForm({ ...projectForm, longitude: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Short Summary</label>
                <input
                  type="text"
                  value={projectForm.shortDescription}
                  onChange={(e) => setProjectForm({ ...projectForm, shortDescription: e.target.value })}
                  placeholder="Key highlight for map cards..."
                />
              </div>

              <div className="form-group">
                <label>Full Project Description</label>
                <textarea
                  rows={3}
                  value={projectForm.fullDescription}
                  onChange={(e) => setProjectForm({ ...projectForm, fullDescription: e.target.value })}
                  placeholder="Comprehensive technical details..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setProjectModal({ open: false, mode: 'create', data: null })}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : (projectModal.mode === 'create' ? 'Create Project' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADVANCED MEDIA UPLOAD MODAL (Images, Videos, 360, Files, Presets) */}
      {mediaModal.open && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box media-modal-box">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Film className="modal-icon-header" size={20} />
                <h3>Add Project Video & Photo Media</h3>
              </div>
              <button className="modal-close" onClick={() => setMediaModal({ open: false, defaultProjectId: null })}>
                <X size={20} />
              </button>
            </div>

            {/* Media Source Tabs */}
            <div className="media-source-tabs">
              <button
                type="button"
                className={`source-tab ${mediaUploadSource === 'file' ? 'active' : ''}`}
                onClick={() => setMediaUploadSource('file')}
              >
                <Upload size={14} />
                <span>Upload From Computer</span>
              </button>

              <button
                type="button"
                className={`source-tab ${mediaUploadSource === 'url' ? 'active' : ''}`}
                onClick={() => setMediaUploadSource('url')}
              >
                <ExternalLink size={14} />
                <span>Direct Media URL / CDN</span>
              </button>

              <button
                type="button"
                className={`source-tab ${mediaUploadSource === 'presets' ? 'active' : ''}`}
                onClick={() => setMediaUploadSource('presets')}
              >
                <Film size={14} />
                <span>Highway Sample Presets</span>
              </button>
            </div>

            <form onSubmit={handleSaveMedia} className="modal-form">
              {/* Project selector */}
              <div className="form-group">
                <label>Target Highway Project *</label>
                <select
                  required
                  value={mediaForm.projectId}
                  onChange={(e) => setMediaForm({ ...mediaForm, projectId: e.target.value })}
                >
                  <option value="">Select a highway project...</option>
                  {projects.map(p => (
                    <option key={p.ProjectId} value={p.ProjectId}>
                      {p.ProjectCode} — {p.ProjectName} ({p.County || 'Kenya'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Option 1: File Browser / Drag & Drop */}
              {mediaUploadSource === 'file' && (
                <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="video/mp4,video/webm,video/ogg,image/png,image/jpeg,image/webp,image/jpg"
                    onChange={handleLocalFileSelect}
                  />
                  <div className="dropzone-content">
                    <div className="dropzone-icon-wrap">
                      <Upload size={28} />
                    </div>
                    {selectedFileName ? (
                      <div className="selected-file-notice">
                        <CheckCircle2 size={16} className="check-icon" />
                        <strong>Selected: {selectedFileName}</strong>
                        <span className="change-text">Click to choose a different file</span>
                      </div>
                    ) : (
                      <>
                        <h4>Click or Drag & Drop Video / Photo Here</h4>
                        <p>Supports MP4, WebM, MOV, High-Res PNG, JPG, WebP</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Source Option 2: Direct URL */}
              {mediaUploadSource === 'url' && (
                <div className="form-group">
                  <label>Media Direct URL (Video or Image) *</label>
                  <input
                    type="text"
                    required={mediaUploadSource === 'url'}
                    value={mediaForm.mediaUrl}
                    onChange={(e) => setMediaForm({ ...mediaForm, mediaUrl: e.target.value })}
                    placeholder="https://your-cdn.com/highway-inspection.mp4"
                  />
                </div>
              )}

              {/* Source Option 3: Presets */}
              {mediaUploadSource === 'presets' && (
                <div className="presets-list">
                  <label className="preset-label">Choose Sample 4K Footage / Drone Photo:</label>
                  <div className="preset-cards">
                    {SAMPLE_MEDIA_PRESETS.map((preset, i) => (
                      <div
                        key={i}
                        className={`preset-card ${mediaForm.mediaUrl === preset.url ? 'selected' : ''}`}
                        onClick={() => handleApplyPreset(preset)}
                      >
                        <img src={preset.thumbnail} alt={preset.title} className="preset-thumb" />
                        <div className="preset-info">
                          <span className="preset-type">{preset.type}</span>
                          <strong>{preset.title}</strong>
                          <p>{preset.desc}</p>
                        </div>
                        {mediaForm.mediaUrl === preset.url && (
                          <div className="preset-check">
                            <Check size={16} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Preview Window if media is loaded */}
              {mediaForm.mediaUrl && (
                <div className="media-preview-box">
                  <label className="preview-label">Live Preview:</label>
                  <div className="preview-player-container">
                    {mediaForm.mediaType?.includes('VIDEO') ? (
                      <video
                        src={mediaForm.mediaUrl}
                        controls
                        className="preview-media-player"
                      />
                    ) : (
                      <img
                        src={mediaForm.mediaUrl}
                        alt="Preview"
                        className="preview-media-player image-mode"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Media Format & Title */}
              <div className="form-row two-col">
                <div className="form-group">
                  <label>Media Format *</label>
                  <select
                    value={mediaForm.mediaType}
                    onChange={(e) => setMediaForm({ ...mediaForm, mediaType: e.target.value })}
                  >
                    <option value="VIDEO">Standard Video (MP4 / WebM)</option>
                    <option value="IMAGE">High-Res Photograph</option>
                    <option value="360_VIDEO">360° Virtual Reality Video</option>
                    <option value="360_IMAGE">360° VR Panorama Photo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Media Title *</label>
                  <input
                    type="text"
                    required
                    value={mediaForm.title}
                    onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                    placeholder="e.g. Aerial Drone Survey"
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Thumbnail Poster URL (Optional)</label>
                  <input
                    type="text"
                    value={mediaForm.thumbnailUrl}
                    onChange={(e) => setMediaForm({ ...mediaForm, thumbnailUrl: e.target.value })}
                    placeholder="https://... (Optional for video thumbnail)"
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={mediaForm.isFeatured}
                      onChange={(e) => setMediaForm({ ...mediaForm, isFeatured: e.target.checked })}
                    />
                    <span>Set as Primary Featured Hero Media</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Media Description / Notes</label>
                <input
                  type="text"
                  value={mediaForm.description}
                  onChange={(e) => setMediaForm({ ...mediaForm, description: e.target.value })}
                  placeholder="e.g. Recorded during phase 2 pavement compaction"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setMediaModal({ open: false, defaultProjectId: null })}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving Media...' : 'Save Media To Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CATEGORY MODAL */}
      {categoryModal.open && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <div className="modal-header">
              <h3>Create Infrastructure Category</h3>
              <button className="modal-close" onClick={() => setCategoryModal({ open: false })}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="modal-form">
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.categoryName}
                  onChange={(e) => setCategoryForm({ ...categoryForm, categoryName: e.target.value })}
                  placeholder="e.g. Interchanges & Flyovers"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Category scope and definition..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setCategoryModal({ open: false })}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. USER MODAL */}
      {userModal.open && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <div className="modal-header">
              <h3>Register KeNHA User Account</h3>
              <button className="modal-close" onClick={() => setUserModal({ open: false })}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="modal-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  placeholder="e.g. John Kamau"
                />
              </div>

              <div className="form-group">
                <label>Official Email Address *</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="e.g. j.kamau@kenha.co.ke"
                />
              </div>

              <div className="form-group">
                <label>Password (Min 6 Characters) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <div className="form-group">
                <label>Assigned Role *</label>
                <select
                  value={userForm.roleNames[0]}
                  onChange={(e) => setUserForm({ ...userForm, roleNames: [e.target.value] })}
                >
                  {ALL_ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setUserModal({ open: false })}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Creating...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DELETE CONFIRMATION MODAL */}
      {deleteConfirm.open && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box confirm-box">
            <div className="confirm-icon danger">
              <AlertCircle size={32} />
            </div>
            <h3>Confirm Deletion</h3>
            <p>
              Are you sure you want to delete <strong>{deleteConfirm.title}</strong>? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteConfirm({ open: false, type: null, id: null, title: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={confirmDeleteAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
