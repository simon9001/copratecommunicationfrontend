import { API_BASE_URL, BACKEND_URL } from '../backend'

/**
 * API Configuration Resolver
 * Uses the universal backend link from src/backend/backendLink.js.
 */
export const API_CONFIG = {
  backendUrl: BACKEND_URL,
  apiBaseUrl: API_BASE_URL,

  /**
   * Get current active API Base URL
   */
  getBaseUrl() {
    return API_BASE_URL
  },
}

