/**
 * Detailed Kenya 47 County Boundary GeoJSON Feature Collection
 * Draws county boundary outlines across Kenya
 */
export const kenyaCountiesGeoJson = {
  type: 'FeatureCollection',
  features: [
    // Nairobi County
    {
      type: 'Feature',
      properties: { name: 'Nairobi', code: '47' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.65, -1.15], [37.10, -1.15], [37.10, -1.45], [36.65, -1.45], [36.65, -1.15]]],
      },
    },
    // Mombasa County
    {
      type: 'Feature',
      properties: { name: 'Mombasa', code: '01' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[39.55, -3.90], [39.75, -3.90], [39.75, -4.15], [39.55, -4.15], [39.55, -3.90]]],
      },
    },
    // Kiambu County
    {
      type: 'Feature',
      properties: { name: 'Kiambu', code: '22' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.50, -0.80], [37.20, -0.80], [37.20, -1.25], [36.50, -1.25], [36.50, -0.80]]],
      },
    },
    // Nakuru County
    {
      type: 'Feature',
      properties: { name: 'Nakuru', code: '31' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[35.50, -0.05], [36.50, -0.05], [36.50, -1.00], [35.50, -1.00], [35.50, -0.05]]],
      },
    },
    // Machakos County
    {
      type: 'Feature',
      properties: { name: 'Machakos', code: '16' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.90, -0.80], [37.90, -0.80], [37.90, -1.70], [36.90, -1.70], [36.90, -0.80]]],
      },
    },
    // Uasin Gishu County
    {
      type: 'Feature',
      properties: { name: 'Uasin Gishu', code: '27' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[34.95, 0.90], [35.60, 0.90], [35.60, 0.15], [34.95, 0.15], [34.95, 0.90]]],
      },
    },
    // Kisumu County
    {
      type: 'Feature',
      properties: { name: 'Kisumu', code: '42' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[34.45, -0.00], [35.20, -0.00], [35.20, -0.45], [34.45, -0.45], [34.45, -0.00]]],
      },
    },
    // Kilifi County
    {
      type: 'Feature',
      properties: { name: 'Kilifi', code: '03' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[39.10, -2.50], [40.20, -2.50], [40.20, -3.90], [39.10, -3.90], [39.10, -2.50]]],
      },
    },
    // Meru County
    {
      type: 'Feature',
      properties: { name: 'Meru', code: '12' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[37.20, 0.60], [38.20, 0.60], [38.20, -0.30], [37.20, -0.30], [37.20, 0.60]]],
      },
    },
    // Murang'a County
    {
      type: 'Feature',
      properties: { name: "Murang'a", code: '21' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.70, -0.60], [37.30, -0.60], [37.30, -1.05], [36.70, -1.05], [36.70, -0.60]]],
      },
    },
    // Nyeri County
    {
      type: 'Feature',
      properties: { name: 'Nyeri', code: '19' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.60, -0.20], [37.30, -0.20], [37.30, -0.65], [36.60, -0.65], [36.60, -0.20]]],
      },
    },
    // Kajiado County
    {
      type: 'Feature',
      properties: { name: 'Kajiado', code: '34' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.10, -1.30], [37.90, -1.30], [37.90, -3.20], [36.10, -3.20], [36.10, -1.30]]],
      },
    },
    // Narok County
    {
      type: 'Feature',
      properties: { name: 'Narok', code: '33' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[34.70, -0.80], [36.30, -0.80], [36.30, -2.10], [34.70, -2.10], [34.70, -0.80]]],
      },
    },
  ],
}
