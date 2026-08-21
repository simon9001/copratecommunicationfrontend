/**
 * ============================================================
 * UNIVERSAL BACKEND LINK
 * ============================================================
 * Edit your backend link here in one single place.
 * No .env configuration required!
 */

// Universal Backend Domain / Server URL (without trailing slash)
export const BACKEND_URL = 'https://developed-donated-feeling-terrorism.trycloudflare.com'

// Universal API Version 1 Base URL
export const API_BASE_URL = `${BACKEND_URL}/api/v1`

/**
 * Helper to construct full API endpoint URLs
 * @param {string} endpoint - Endpoint path (e.g. '/public/map' or 'auth/login')
 * @returns {string} - Full URL
 */
export function getApiUrl(endpoint = '') {
  if (!endpoint) return API_BASE_URL
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${API_BASE_URL}${cleanEndpoint}`
}

export default {
  BACKEND_URL,
  API_BASE_URL,
  getApiUrl,
}
