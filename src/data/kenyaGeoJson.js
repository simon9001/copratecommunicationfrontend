/**
 * Kenya National Boundary & Regional GeoJSON Feature Collection
 * Draws glowing boundary outline on the 3D Globe
 */
export const kenyaCountryGeoJson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Kenya',
        code: 'KEN',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [41.85, 3.93],
            [41.91, 2.7],
            [40.98, -0.1],
            [41.56, -1.65],
            [41.0, -2.0],
            [40.9, -3.0],
            [39.2, -4.68],
            [38.5, -4.7],
            [37.7, -3.8],
            [37.0, -3.2],
            [35.5, -1.15],
            [34.0, -1.0],
            [33.91, 0.2],
            [34.0, 1.0],
            [34.7, 2.3],
            [35.0, 4.5],
            [35.8, 4.62],
            [36.0, 4.5],
            [38.0, 3.5],
            [39.0, 3.9],
            [41.85, 3.93],
          ],
        ],
      },
    },
  ],
}
