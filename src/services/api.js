import { API_CONFIG } from '../config/api.config.js'

async function request(endpoint, options = {}) {
  const baseUrl = API_CONFIG.getBaseUrl()
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const token = localStorage.getItem('kenha_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    const error = new Error(data.error?.message || data.message || 'Request failed')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

/* ---- Public Endpoints ---- */

export async function getPublicMapProjects(county, status) {
  const params = new URLSearchParams()
  if (county && county !== 'All') params.set('county', county)
  if (status && status !== 'All') params.set('status', status)
  const qs = params.toString()
  return request(`/public/map${qs ? '?' + qs : ''}`)
}

export async function getCountyStats() {
  return request('/public/counties/stats')
}

export async function getAllProjectRoutes() {
  return request('/public/routes')
}

export async function getProjectRoute(id) {
  return request(`/public/projects/${id}/route`)
}

export async function getPublicSummaries() {
  return request('/public/summary')
}

export async function getProjectBySlug(slug) {
  return request(`/projects/slug/${slug}`)
}

export async function getProjectById(id) {
  return request(`/projects/${id}`)
}

export async function getCategories() {
  return request('/categories')
}

export async function createCategory(data) {
  return request('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/* ---- Auth Endpoints ---- */

export async function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function getProfile() {
  return request('/auth/me')
}

/* ---- Projects Endpoints ---- */

export async function getProjects(params = {}) {
  const searchParams = new URLSearchParams(params)
  return request(`/projects?${searchParams.toString()}`)
}

export async function createProject(data) {
  return request('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateProject(id, data) {
  return request(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function updateProjectStatus(id, publicationStatus, comment = '') {
  return request(`/projects/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ publicationStatus, comment }),
  })
}

export async function deleteProject(id) {
  return request(`/projects/${id}`, {
    method: 'DELETE',
  })
}

/* ---- Media Endpoints ---- */

export async function getAllMedia() {
  return request('/media')
}

export async function createMedia(projectId, data) {
  return request(`/projects/${projectId}/media`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteMedia(projectId, mediaId) {
  return request(`/projects/${projectId}/media/${mediaId}`, {
    method: 'DELETE',
  })
}

/* ---- Users Endpoints ---- */

export async function getUsers() {
  return request('/users')
}

export async function createUser(data) {
  return request('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function toggleUserStatus(id, isActive) {
  return request(`/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  })
}

export async function deleteUser(id) {
  return request(`/users/${id}`, {
    method: 'DELETE',
  })
}

/* ---- Health ---- */

export async function getHealthStatus() {
  return request('/health')
}
