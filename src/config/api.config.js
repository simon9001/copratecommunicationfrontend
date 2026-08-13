/**
 * API Configuration Resolver
 * Reads runtime window.APP_CONFIG (public/config.js) or Vite .env variables.
 */

export const API_CONFIG = {
  // Development Backend URL
  development:
    (typeof window !== 'undefined' && window.APP_CONFIG?.API_DEV_URL) ||
    import.meta.env.VITE_API_BASE_URL_DEV ||
    'http://localhost:3000/api/v1',

  // Production Backend URL
  production:
    (typeof window !== 'undefined' && window.APP_CONFIG?.API_PROD_URL) ||
    import.meta.env.VITE_API_BASE_URL_PROD ||
    'https://api-vr.kenha.go.ke/api/v1',

  /**
   * Get current active API Base URL
   */
  getBaseUrl() {
    const windowEnv = typeof window !== 'undefined' && window.APP_CONFIG?.ENVIRONMENT
    const isProd =
      windowEnv === 'production' ||
      import.meta.env.PROD ||
      import.meta.env.VITE_APP_ENV === 'production'

    return isProd ? this.production : this.development
  },
}
