const API_BASE = '/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = localStorage.getItem('kenha_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error?.message || data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/* ---- Public Endpoints ---- */

export async function getPublicMapProjects() {
  return request('/public/map');
}

export async function getPublicSummaries() {
  return request('/public/summary');
}

export async function getProjectBySlug(slug) {
  return request(`/projects/slug/${slug}`);
}

export async function getProjectById(id) {
  return request(`/projects/${id}`);
}

export async function getCategories() {
  return request('/categories');
}

/* ---- Auth Endpoints ---- */

export async function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getProfile() {
  return request('/auth/me');
}

/* ---- Admin Endpoints ---- */

export async function getProjects(params = {}) {
  const searchParams = new URLSearchParams(params);
  return request(`/projects?${searchParams.toString()}`);
}

export async function createProject(data) {
  return request('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(id, data) {
  return request(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id) {
  return request(`/projects/${id}`, {
    method: 'DELETE',
  });
}

export async function getHealthStatus() {
  return request('/health');
}
