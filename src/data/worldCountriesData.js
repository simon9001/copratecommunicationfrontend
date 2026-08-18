/**
 * World & African Countries Dataset
 * For rendering country boundaries and country labels on the 3D Globe
 */

// Lightweight simplified world country boundaries (low-res, safe for Cesium)
// Using natural earth low-res data via a CDN-hosted simplified source
export const WORLD_COUNTRIES_GEOJSON_URL =
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json'

export const countryCentroids = [
  // ── East Africa & Direct Neighbors (Tier 1) ───────────────────────────
  { name: 'KENYA', code: 'KEN', lat: 0.5, lng: 37.9, tier: 1, isHost: true },
  { name: 'UGANDA', code: 'UGA', lat: 1.37, lng: 32.29, tier: 1 },
  { name: 'TANZANIA', code: 'TZA', lat: -6.36, lng: 34.88, tier: 1 },
  { name: 'ETHIOPIA', code: 'ETH', lat: 9.14, lng: 40.48, tier: 1 },
  { name: 'SOMALIA', code: 'SOM', lat: 5.15, lng: 46.19, tier: 1 },
  { name: 'SOUTH SUDAN', code: 'SSD', lat: 6.87, lng: 31.30, tier: 1 },
  { name: 'RWANDA', code: 'RWA', lat: -1.94, lng: 29.87, tier: 1 },
  { name: 'BURUNDI', code: 'BDI', lat: -3.37, lng: 29.91, tier: 1 },

  // ── Wider East, Central & Horn of Africa (Tier 2) ─────────────────────
  { name: 'DEM. REP. CONGO', code: 'COD', lat: -4.03, lng: 21.75, tier: 2 },
  { name: 'SUDAN', code: 'SDN', lat: 12.86, lng: 30.21, tier: 2 },
  { name: 'ERITREA', code: 'ERI', lat: 15.17, lng: 39.78, tier: 2 },
  { name: 'DJIBOUTI', code: 'DJI', lat: 11.82, lng: 42.59, tier: 2 },
  { name: 'ZAMBIA', code: 'ZMB', lat: -13.13, lng: 27.84, tier: 2 },
  { name: 'MALAWI', code: 'MWI', lat: -13.25, lng: 34.30, tier: 2 },
  { name: 'MOZAMBIQUE', code: 'MOZ', lat: -18.66, lng: 35.52, tier: 2 },
  { name: 'ZIMBABWE', code: 'ZWE', lat: -19.01, lng: 29.15, tier: 2 },
  { name: 'MADAGASCAR', code: 'MDG', lat: -18.76, lng: 46.86, tier: 2 },
  { name: 'CENTRAL AFRICAN REP.', code: 'CAF', lat: 6.61, lng: 20.93, tier: 2 },
  { name: 'CHAD', code: 'TCD', lat: 15.45, lng: 18.73, tier: 2 },
  { name: 'CONGO', code: 'COG', lat: -0.22, lng: 15.82, tier: 2 },
  { name: 'GABON', code: 'GAB', lat: -0.80, lng: 11.60, tier: 2 },
  { name: 'ANGOLA', code: 'AGO', lat: -11.20, lng: 17.87, tier: 2 },
  { name: 'BOTSWANA', code: 'BWA', lat: -22.32, lng: 24.68, tier: 2 },
  { name: 'NAMIBIA', code: 'NAM', lat: -22.95, lng: 18.49, tier: 2 },
  { name: 'SOUTH AFRICA', code: 'ZAF', lat: -30.55, lng: 22.93, tier: 2 },

  // ── North & West Africa (Tier 2) ──────────────────────────────────────
  { name: 'EGYPT', code: 'EGY', lat: 26.82, lng: 30.80, tier: 2 },
  { name: 'LIBYA', code: 'LBY', lat: 26.33, lng: 17.22, tier: 2 },
  { name: 'NIGERIA', code: 'NGA', lat: 9.08, lng: 8.67, tier: 2 },
  { name: 'GHANA', code: 'GHA', lat: 7.94, lng: -1.02, tier: 2 },
  { name: 'CAMEROON', code: 'CMR', lat: 7.36, lng: 12.35, tier: 2 },
  { name: 'ALGERIA', code: 'DZA', lat: 28.03, lng: 1.65, tier: 2 },
  { name: 'MOROCCO', code: 'MAR', lat: 31.79, lng: -7.09, tier: 2 },

  // ── Middle East & Major Global Nations (Tier 3) ───────────────────────
  { name: 'SAUDI ARABIA', code: 'SAU', lat: 23.88, lng: 45.07, tier: 3 },
  { name: 'YEMEN', code: 'YEM', lat: 15.55, lng: 48.51, tier: 3 },
  { name: 'OMAN', code: 'OMN', lat: 21.51, lng: 55.92, tier: 3 },
  { name: 'UNITED ARAB EMIRATES', code: 'ARE', lat: 23.42, lng: 53.84, tier: 3 },
  { name: 'INDIA', code: 'IND', lat: 20.59, lng: 78.96, tier: 3 },
  { name: 'UNITED KINGDOM', code: 'GBR', lat: 55.37, lng: -3.43, tier: 3 },
  { name: 'FRANCE', code: 'FRA', lat: 46.22, lng: 2.21, tier: 3 },
  { name: 'GERMANY', code: 'DEU', lat: 51.16, lng: 10.45, tier: 3 },
  { name: 'CHINA', code: 'CHN', lat: 35.86, lng: 104.19, tier: 3 },
  { name: 'UNITED STATES', code: 'USA', lat: 37.09, lng: -95.71, tier: 3 },
  { name: 'BRAZIL', code: 'BRA', lat: -14.23, lng: -51.92, tier: 3 },
  { name: 'AUSTRALIA', code: 'AUS', lat: -25.27, lng: 133.77, tier: 3 },
]
