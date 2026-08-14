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

// GeoJSON for Kenya's 47 counties
const KENYA_COUNTIES_GEOJSON_URL =
  'https://raw.githubusercontent.com/wmgeolab/geoBoundaries/main/releaseData/CGAZ/geoBoundaries-KEN-ADM1_simplified.geojson'

// Status color constants
const STATUS_COLORS = {
  Ongoing: '#FFC107',
  Completed: '#00E676',
  Planned: '#38BDF8',
  Suspended: '#FF5252',
  Draft: '#94A3B8',
}

// Generate styled Lucide Map-Pin SVG billboard icon
const locationPinCache = {}

function createLucideMapPinSvg(colorHex, isSelected = false) {
  const key = `${colorHex}_${isSelected ? 'sel' : 'norm'}`
  if (locationPinCache[key]) return locationPinCache[key]

  const cleanHex = colorHex.replace('#', '')
  const size = isSelected ? 64 : 50
  const glowRadius = isSelected ? 12 : 7
  const strokeWidth = isSelected ? 2.2 : 1.8

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
  <defs>
    <!-- Multi-layered Glow & Drop Shadow -->
    <filter id="pin-glow-${cleanHex}-${isSelected ? '1' : '0'}" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="rgba(0,0,0,0.85)" />
      <feDropShadow dx="0" dy="0" stdDeviation="${glowRadius}" flood-color="${colorHex}" flood-opacity="0.9" />
    </filter>
    
    <!-- Rich Metallic Vertical Gradient Fill -->
    <linearGradient id="pin-grad-${cleanHex}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${colorHex}" />
      <stop offset="65%" stop-color="${colorHex}" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#060A10" />
    </linearGradient>
  </defs>

  <g filter="url(#pin-glow-${cleanHex}-${isSelected ? '1' : '0'})">
    <!-- Lucide Map-Pin Path -->
    <path
      d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      fill="url(#pin-grad-${cleanHex})"
      stroke="#FFFFFF"
      stroke-width="${strokeWidth}"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <!-- Center Dot Indicator -->
    <circle
      cx="12"
      cy="10"
      r="3.2"
      fill="#FFFFFF"
      stroke="${colorHex}"
      stroke-width="1.6"
    />
  </g>
</svg>
`
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`
  locationPinCache[key] = dataUrl
  return dataUrl
}

// Generate Ground Target / Beacon Circle
function createGroundBeacon(colorHex) {
  const canvas = document.createElement('canvas')
  canvas.width = 48
  canvas.height = 48
  const ctx = canvas.getContext('2d')

  // Ground pulse halo
  ctx.beginPath()
  ctx.arc(24, 24, 20, 0, 2 * Math.PI)
  ctx.fillStyle = colorHex + '22'
  ctx.fill()

  // Middle ring
  ctx.beginPath()
  ctx.arc(24, 24, 12, 0, 2 * Math.PI)
  ctx.strokeStyle = colorHex
  ctx.lineWidth = 2
  ctx.stroke()

  // Center beacon dot
  ctx.beginPath()
  ctx.arc(24, 24, 4, 0, 2 * Math.PI)
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
    const countiesDS = new Cesium.CustomDataSource('kenya-counties')
    const projectsDS = new Cesium.CustomDataSource('kenya-projects')
    const routesDS = new Cesium.CustomDataSource('kenya-routes')
    const citiesDS = new Cesium.CustomDataSource('kenya-cities')

    viewer.dataSources.add(countiesDS)
    viewer.dataSources.add(projectsDS)
    viewer.dataSources.add(routesDS)
    viewer.dataSources.add(citiesDS)

    countiesDataSourceRef.current = countiesDS
    projectsDataSourceRef.current = projectsDS
    routesDataSourceRef.current = routesDS
    citiesDataSourceRef.current = citiesDS

    // Load Kenya 47 County Boundaries
    Cesium.GeoJsonDataSource.load(KENYA_COUNTIES_GEOJSON_URL, {
      stroke: Cesium.Color.fromCssColorString('rgba(255, 193, 7, 0.45)'),
      fill: Cesium.Color.fromCssColorString('rgba(255, 193, 7, 0.04)'),
      strokeWidth: 2,
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
              'rgba(255, 193, 7, 0.04)'
            )
            entity.polygon.outline = true
            entity.polygon.outlineColor = Cesium.Color.fromCssColorString(
              'rgba(255, 193, 7, 0.5)'
            )
            entity.polygon.outlineWidth = 2
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
            const time = Date.now() * 0.0025
            const bob = Math.sin(time + phase) * (isSelected ? 900 : 600)
            return [
              groundPosition,
              Cesium.Cartesian3.fromDegrees(lng, lat, baseAltitude + bob),
            ]
          }, false),
          width: isSelected ? 3 : 2,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.3,
            color: Cesium.Color.fromCssColorString(colorHex),
          }),
        },
      })

      // 3. Hovering Lucide Map-Pin SVG Icon
      ds.entities.add({
        position: hoveringPosition,
        billboard: {
          image: pinSvg,
          width: isSelected ? 60 : 46,
          height: isSelected ? 60 : 46,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // Exact pin tip touches bottom
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: p.ProjectCode || p.ProjectName,
          font: isSelected ? 'bold 12px "Space Grotesk", sans-serif' : '11px "Inter", sans-serif',
          fillColor: Cesium.Color.fromCssColorString('#FFFFFF'),
          backgroundColor: Cesium.Color.fromCssColorString('rgba(10, 16, 26, 0.9)'),
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(6, 4),
          outlineColor: Cesium.Color.fromCssColorString(colorHex),
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, isSelected ? -68 : -52),
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
            width: 4,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.25,
              color: Cesium.Color.fromCssColorString('rgba(0, 230, 118, 0.85)'),
            }),
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
