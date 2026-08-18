import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { kenyaCities } from '../../data/kenyaCities.js'
import { WORLD_COUNTRIES_GEOJSON_URL, countryCentroids } from '../../data/worldCountriesData.js'
import { kenyaCountiesGeoJson } from '../../data/kenyaCountiesGeoJson.js'
import './KenyaGlobe.css'

// ── Cesium Ion Token ─────────────────────────────────────────────────────────
Cesium.Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwYTYxMTc3OC1hNDVlLTQ5YjctYjE2Yi1hOTExMjE2OGFmYzYiLCJpZCI6NDY3OTYyLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODY3MDI3ODh9.dnXqhqHP2EeIkKZZ6FCllUsXiazvySFjobxwdXe1rFw'

// ── Initial Framing for Kenya ────────────────────────────────────────────────
const KENYA_CENTER = {
  lng: 37.9,
  lat: 0.5,
  height: 1750000, // meters above terrain - frames all of Kenya cleanly
}

// GeoJSON for Kenya's 47 counties — loaded from bundled local data (no external dependency)

// Status color constants - KeNHA Brand
const STATUS_COLORS = {
  Ongoing: '#FDB813',
  Completed: '#00E676',
  Planned: '#38BDF8',
  Suspended: '#FF5252',
  Draft: '#94A3B8',
}

// Generate clean minimalist Map-Pin SVG billboard icon
const locationPinCache = {}

function createLucideMapPinSvg(colorHex, isSelected = false) {
  const key = `${colorHex}_${isSelected ? 'sel' : 'norm'}`
  if (locationPinCache[key]) return locationPinCache[key]

  const size = isSelected ? 48 : 36
  const strokeWidth = 2

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
  <defs>
    <filter id="pin-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="rgba(0,0,0,0.5)" />
    </filter>
  </defs>
  <g filter="url(#pin-shadow)">
    <path
      d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      fill="#0B121E"
      stroke="${colorHex}"
      stroke-width="${strokeWidth}"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle
      cx="12"
      cy="10"
      r="3"
      fill="${colorHex}"
    />
  </g>
</svg>
`
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`
  locationPinCache[key] = dataUrl
  return dataUrl
}

// Generate Ground Target Circle
function createGroundBeacon(colorHex) {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')

  // Clean ring
  ctx.beginPath()
  ctx.arc(16, 16, 8, 0, 2 * Math.PI)
  ctx.strokeStyle = colorHex
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Center dot
  ctx.beginPath()
  ctx.arc(16, 16, 3, 0, 2 * Math.PI)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()

  return canvas.toDataURL()
}

// ── KenyaGlobe Component (Powered by CesiumJS) ──────────────────────────────

const KenyaGlobe = forwardRef(function KenyaGlobe(
  {
    projects = [],
    projectRoutes = [],
    onProjectSelect,
    onCountySelect,
    viewMode = 'night',
    activeLayers = {},
    selectedProject = null,
    selectedCounty = null,
  },
  ref
) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)
  const countriesDataSourceRef = useRef(null)
  const countryLabelsDataSourceRef = useRef(null)
  const countiesDataSourceRef = useRef(null)
  const projectsDataSourceRef = useRef(null)
  const routesDataSourceRef = useRef(null)
  const citiesDataSourceRef = useRef(null)

  const [tooltip, setTooltip] = useState(null)
  const [isGlobeReady, setIsGlobeReady] = useState(false)

  // ── 1. Initialize Cesium Viewer ──────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return

    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      vrButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      scene3DOnly: true,
      shouldAnimate: true,
      terrain: Cesium.Terrain.fromWorldTerrain({
        requestWaterMask: true,
        requestVertexNormals: true,
      }),
    })

    viewerRef.current = viewer

    // Configure globe visual styling
    const scene = viewer.scene
    const globe = scene.globe
    globe.enableLighting = true
    globe.depthTestAgainstTerrain = false
    globe.baseColor = Cesium.Color.fromCssColorString('#060A10')

    // Initial camera positioning directly over Kenya
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        KENYA_CENTER.lng,
        KENYA_CENTER.lat,
        KENYA_CENTER.height
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-88),
        roll: 0.0,
      },
      duration: 2.2,
      easingFunction: Cesium.EasingFunction.QUADRATIC_OUT,
    })

    // Create DataSources
    const countriesDS = new Cesium.CustomDataSource('world-countries')
    const countryLabelsDS = new Cesium.CustomDataSource('country-labels')
    const countiesDS = new Cesium.CustomDataSource('kenya-counties')
    const projectsDS = new Cesium.CustomDataSource('kenya-projects')
    const routesDS = new Cesium.CustomDataSource('kenya-routes')
    const citiesDS = new Cesium.CustomDataSource('kenya-cities')

    viewer.dataSources.add(countriesDS)
    viewer.dataSources.add(countryLabelsDS)
    viewer.dataSources.add(countiesDS)
    viewer.dataSources.add(projectsDS)
    viewer.dataSources.add(routesDS)
    viewer.dataSources.add(citiesDS)

    countriesDataSourceRef.current = countriesDS
    countryLabelsDataSourceRef.current = countryLabelsDS
    countiesDataSourceRef.current = countiesDS
    projectsDataSourceRef.current = projectsDS
    routesDataSourceRef.current = routesDS
    citiesDataSourceRef.current = citiesDS

    // Load World & African Country Boundaries
    Cesium.GeoJsonDataSource.load(WORLD_COUNTRIES_GEOJSON_URL, {
      stroke: Cesium.Color.fromCssColorString('rgba(226, 232, 240, 0.35)'),
      fill: Cesium.Color.fromCssColorString('rgba(255, 255, 255, 0.01)'),
      strokeWidth: 1.2,
      clampToGround: true,
    })
      .then((geoJsonDS) => {
        // Process in chunks to avoid RangeError: Invalid array length on large GeoJSONs
        const entities = [...geoJsonDS.entities.values]
        const CHUNK = 30
        let i = 0

        function processChunk() {
          const end = Math.min(i + CHUNK, entities.length)
          for (; i < end; i++) {
            try {
              const entity = entities[i]
              const countryName =
                entity.properties?.name?.getValue() ||
                entity.properties?.ADMIN?.getValue() ||
                entity.properties?.NAME?.getValue() ||
                entity.name ||
                'Country'

              const isKenya = countryName.toLowerCase().includes('kenya')

              if (entity.polygon) {
                entity.polygon.material = Cesium.Color.fromCssColorString(
                  isKenya ? 'rgba(253, 184, 19, 0.04)' : 'rgba(255, 255, 255, 0.01)'
                )
                entity.polygon.outline = true
                entity.polygon.outlineColor = Cesium.Color.fromCssColorString(
                  isKenya ? 'rgba(253, 184, 19, 0.85)' : 'rgba(226, 232, 240, 0.35)'
                )
                entity.polygon.outlineWidth = isKenya ? 2.5 : 1.2
              }

              entity._countryName = countryName
              countriesDS.entities.add(entity)
            } catch (_) {
              // Skip malformed entities silently
            }
          }
          if (i < entities.length) {
            setTimeout(processChunk, 0) // yield to browser between chunks
          }
        }

        processChunk()
      })
      .catch((err) => {
        console.warn('Could not load world countries boundary GeoJSON:', err)
      })

    // Load Country Names / Centroid Labels
    countryCentroids.forEach((c) => {
      const isKenya = !!c.isHost
      countryLabelsDS.entities.add({
        position: Cesium.Cartesian3.fromDegrees(c.lng, c.lat, 400),
        point: {
          pixelSize: isKenya ? 5 : 3,
          color: Cesium.Color.fromCssColorString(isKenya ? '#FDB813' : 'rgba(226, 232, 240, 0.75)'),
          outlineColor: Cesium.Color.fromCssColorString('rgba(6, 10, 16, 0.9)'),
          outlineWidth: 1.5,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            c.tier === 1 ? 16000000 : c.tier === 2 ? 24000000 : 35000000
          ),
        },
        label: {
          text: c.name,
          font: isKenya ? 'bold 13px "Space Grotesk", sans-serif' : '10px "Space Grotesk", sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.fromCssColorString(isKenya ? '#FDB813' : '#CBD5E1'),
          outlineColor: Cesium.Color.fromCssColorString('#060A10'),
          outlineWidth: 2.5,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -6),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            c.tier === 1 ? 14000000 : c.tier === 2 ? 22000000 : 32000000
          ),
        },
        _countryName: c.name,
      })
    })

    // Load Kenya 47 County Boundaries from bundled local GeoJSON data
    Cesium.GeoJsonDataSource.load(kenyaCountiesGeoJson, {
      stroke: Cesium.Color.fromCssColorString('rgba(253, 184, 19, 0.45)'),
      fill: Cesium.Color.fromCssColorString('rgba(253, 184, 19, 0.03)'),
      strokeWidth: 1.5,
      clampToGround: true,
    })
      .then((geoJsonDS) => {
        geoJsonDS.entities.values.forEach((entity) => {
          const name =
            entity.properties?.shapeName?.getValue() ||
            entity.properties?.name?.getValue() ||
            entity.name ||
            'County'

          if (entity.polygon) {
            entity.polygon.material = Cesium.Color.fromCssColorString(
              'rgba(253, 184, 19, 0.03)'
            )
            entity.polygon.outline = true
            entity.polygon.outlineColor = Cesium.Color.fromCssColorString(
              'rgba(253, 184, 19, 0.45)'
            )
            entity.polygon.outlineWidth = 1.5
          }

          entity._kenhaCounty = {
            name,
            properties: { shapeName: name, name },
          }

          countiesDS.entities.add(entity)
        })
      })
      .catch((err) => {
        console.warn('Could not load county boundary GeoJSON:', err)
      })

    // Load Kenyan Cities and Towns
    kenyaCities.forEach((city) => {
      citiesDS.entities.add({
        position: Cesium.Cartesian3.fromDegrees(city.lng, city.lat, 200),
        point: {
          pixelSize: city.tier === 1 ? 5 : 3,
          color: Cesium.Color.fromCssColorString('rgba(56, 189, 248, 0.8)'),
          outlineColor: Cesium.Color.fromCssColorString('rgba(0,0,0,0.8)'),
          outlineWidth: 1,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            city.tier === 1 ? 4000000 : city.tier === 2 ? 1800000 : 900000
          ),
        },
        label: {
          text: city.name,
          font: '11px "Inter", sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.fromCssColorString('#E2E8F0'),
          outlineColor: Cesium.Color.fromCssColorString('#0A101A'),
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -8),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            city.tier === 1 ? 2500000 : city.tier === 2 ? 1200000 : 600000
          ),
        },
      })
    })

    // Screen-space interaction (click & hover)
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)

    handler.setInputAction((movement) => {
      const picked = scene.pick(movement.position)
      if (Cesium.defined(picked) && picked.id) {
        const entity = picked.id
        if (entity._kenhaProject) {
          onProjectSelect?.(entity._kenhaProject)
          return
        }
        if (entity._kenhaCounty) {
          onCountySelect?.(entity._kenhaCounty)
          return
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    handler.setInputAction((movement) => {
      const picked = scene.pick(movement.endPosition)
      if (Cesium.defined(picked) && picked.id) {
        const entity = picked.id
        if (entity._kenhaProject) {
          setTooltip({
            x: movement.endPosition.x,
            y: movement.endPosition.y - 45,
            title: entity._kenhaProject.ProjectName,
            subtitle: `${entity._kenhaProject.County || 'Kenya'} · ${entity._kenhaProject.ProjectStatus || 'Ongoing'}`,
          })
          containerRef.current.style.cursor = 'pointer'
          return
        }
        if (entity._kenhaCounty) {
          setTooltip({
            x: movement.endPosition.x,
            y: movement.endPosition.y - 30,
            title: `${entity._kenhaCounty.name} County`,
            subtitle: 'Click to explore projects',
          })
          containerRef.current.style.cursor = 'pointer'
          return
        }
        if (entity._countryName) {
          setTooltip({
            x: movement.endPosition.x,
            y: movement.endPosition.y - 30,
            title: entity._countryName,
            subtitle: 'Country Territory',
          })
          containerRef.current.style.cursor = 'default'
          return
        }
      }
      setTooltip(null)
      if (containerRef.current) containerRef.current.style.cursor = 'default'
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    setIsGlobeReady(true)

    return () => {
      handler.destroy()
      if (!viewer.isDestroyed()) {
        viewer.destroy()
      }
      viewerRef.current = null
    }
  }, [onProjectSelect, onCountySelect])

  // ── 2. Update Project Markers (Hovering Lucide Map-Pin SVG Billboard) ─────
  useEffect(() => {
    const ds = projectsDataSourceRef.current
    if (!ds) return

    ds.entities.removeAll()

    projects.forEach((p, idx) => {
      const lat = Number(p.Latitude)
      const lng = Number(p.Longitude)
      if (isNaN(lat) || isNaN(lng)) return

      const isSelected =
        selectedProject &&
        (selectedProject.ProjectId === p.ProjectId ||
          selectedProject.ProjectCode === p.ProjectCode)

      const status = p.ProjectStatus || p.Status || 'Ongoing'
      const colorHex = STATUS_COLORS[status] || '#00E676'
      const pinSvg = createLucideMapPinSvg(colorHex, isSelected)
      const groundBeaconImage = createGroundBeacon(colorHex)

      // Hovering vertical animation offset
      const baseAltitude = isSelected ? 4200 : 3000
      const phase = (idx * 1.3) % (Math.PI * 2)

      const hoveringPosition = new Cesium.CallbackProperty(() => {
        const time = Date.now() * 0.0025
        const bob = Math.sin(time + phase) * (isSelected ? 900 : 600)
        return Cesium.Cartesian3.fromDegrees(lng, lat, baseAltitude + bob)
      }, false)

      const groundPosition = Cesium.Cartesian3.fromDegrees(lng, lat, 20)

      // 1. Ground Beacon Target
      ds.entities.add({
        position: groundPosition,
        billboard: {
          image: groundBeaconImage,
          width: 32,
          height: 32,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      })

      // 2. Vertical Tether Line connecting ground beacon to floating pin
      ds.entities.add({
        polyline: {
          positions: new Cesium.CallbackProperty(() => {
            const time = Date.now() * 0.002
            const bob = Math.sin(time + phase) * (isSelected ? 500 : 350)
            return [
              groundPosition,
              Cesium.Cartesian3.fromDegrees(lng, lat, baseAltitude + bob),
            ]
          }, false),
          width: isSelected ? 2 : 1.2,
          material: Cesium.Color.fromCssColorString(isSelected ? '#FDB813' : 'rgba(255, 255, 255, 0.4)'),
        },
      })

      // 3. Hovering Lucide Map-Pin SVG Icon
      ds.entities.add({
        position: hoveringPosition,
        billboard: {
          image: pinSvg,
          width: isSelected ? 48 : 36,
          height: isSelected ? 48 : 36,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: p.ProjectCode || p.ProjectName,
          font: isSelected ? 'bold 12px "Space Grotesk", sans-serif' : '11px "Inter", sans-serif',
          fillColor: Cesium.Color.fromCssColorString('#FFFFFF'),
          backgroundColor: Cesium.Color.fromCssColorString('rgba(11, 18, 30, 0.9)'),
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(6, 4),
          outlineColor: Cesium.Color.fromCssColorString('rgba(255, 255, 255, 0.2)'),
          outlineWidth: 1,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, isSelected ? -56 : -42),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            1600000
          ),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        _kenhaProject: p,
      })
    })
  }, [projects, selectedProject])

  // ── 3. Update Project Routes ──────────────────────────────────────────────
  useEffect(() => {
    const ds = routesDataSourceRef.current
    if (!ds) return

    ds.entities.removeAll()

    projectRoutes.forEach((route) => {
      if (!route?.GeoJson) return
      try {
        const parsed =
          typeof route.GeoJson === 'string'
            ? JSON.parse(route.GeoJson)
            : route.GeoJson

        let coords = []
        if (parsed.type === 'LineString' && Array.isArray(parsed.coordinates)) {
          coords = parsed.coordinates
        } else if (
          parsed.type === 'Feature' &&
          parsed.geometry?.coordinates
        ) {
          coords = parsed.geometry.coordinates
        }

        if (coords.length < 2) return

        const flatPositions = coords.flatMap(([lng, lat, alt = 50]) => [
          lng,
          lat,
          alt,
        ])
        const positions =
          Cesium.Cartesian3.fromDegreesArrayHeights(flatPositions)

        ds.entities.add({
          polyline: {
            positions,
            width: 2.5,
            material: Cesium.Color.fromCssColorString('#FDB813'),
            clampToGround: true,
          },
        })
      } catch (err) {
        console.warn('Error parsing project route GeoJSON:', err)
      }
    })
  }, [projectRoutes])

  // ── 4. Manage Layer Visibility ────────────────────────────────────────────
  useEffect(() => {
    if (countriesDataSourceRef.current) {
      countriesDataSourceRef.current.show = activeLayers.countryBoundaries !== false
    }
    if (countryLabelsDataSourceRef.current) {
      countryLabelsDataSourceRef.current.show = activeLayers.countryLabels !== false
    }
    if (countiesDataSourceRef.current) {
      countiesDataSourceRef.current.show = activeLayers.counties !== false
    }
    if (citiesDataSourceRef.current) {
      citiesDataSourceRef.current.show = activeLayers.cities !== false
    }
    if (projectsDataSourceRef.current) {
      projectsDataSourceRef.current.show = activeLayers.projects !== false
    }
    if (routesDataSourceRef.current) {
      routesDataSourceRef.current.show = activeLayers.projectRoutes !== false
    }
  }, [activeLayers])

  // ── 5. Expose Imperative Controls for ExplorePage ─────────────────────────
  useImperativeHandle(
    ref,
    () => ({
      pointOfView: (pov, durationMs = 1000) => {
        const viewer = viewerRef.current
        if (!viewer) return { lat: 0.5, lng: 37.9, altitude: 1.8 }

        if (!pov) {
          // Read current POV
          const camera = viewer.camera
          const carto = Cesium.Cartographic.fromCartesian(camera.position)
          return {
            lat: Cesium.Math.toDegrees(carto.latitude),
            lng: Cesium.Math.toDegrees(carto.longitude),
            altitude: carto.height / 1000000,
          }
        }

        // Convert normalized altitude / height
        let targetHeight = 1600000
        if (pov.altitude !== undefined) {
          targetHeight =
            pov.altitude > 100 ? pov.altitude : pov.altitude * 1000000
        }

        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            pov.lng ?? KENYA_CENTER.lng,
            pov.lat ?? KENYA_CENTER.lat,
            targetHeight
          ),
          duration: (durationMs || 1000) / 1000,
          easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
        })
      },

      zoomIn: () => {
        viewerRef.current?.camera.zoomIn(350000)
      },

      zoomOut: () => {
        viewerRef.current?.camera.zoomOut(350000)
      },

      resetView: () => {
        viewerRef.current?.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            KENYA_CENTER.lng,
            KENYA_CENTER.lat,
            KENYA_CENTER.height
          ),
          duration: 1.5,
        })
      },
    }),
    []
  )

  return (
    <div className="kenya-cesium-wrapper">
      <div ref={containerRef} className="cesium-container" />

      {/* Floating Hover Tooltip */}
      {tooltip && (
        <div
          className="cesium-tooltip"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          <div className="tooltip-title">{tooltip.title}</div>
          {tooltip.subtitle && (
            <div className="tooltip-subtitle">{tooltip.subtitle}</div>
          )}
        </div>
      )}
    </div>
  )
})

export default KenyaGlobe
