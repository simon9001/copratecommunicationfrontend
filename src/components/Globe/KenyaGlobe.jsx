import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import './KenyaGlobe.css';

const KenyaGlobe = React.forwardRef(({ projects = [], onProjectSelect }, ref) => {
  const globeRef = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Expose the internal globe ref methods to the parent via the forwarded ref
  React.useImperativeHandle(ref, () => ({
    pointOfView: (args) => globeRef.current?.pointOfView(args),
    controls: () => globeRef.current?.controls()
  }));

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (globeRef.current) {
      // On startup auto-rotate
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 1;

      // Stop auto-rotate and fly to Kenya after 1.5s
      setTimeout(() => {
        if (globeRef.current) {
          globeRef.current.controls().autoRotate = false;
          globeRef.current.pointOfView({ lat: 0.5, lng: 37.9, altitude: 1.8 }, 2000);
        }
      }, 1500);
    }
  }, []);

  const customMarker = d => {
    const el = document.createElement('div');
    el.className = 'globe-marker-pulse';
    el.onclick = () => onProjectSelect(d);
    
    const tooltip = document.createElement('div');
    tooltip.className = 'globe-marker-tooltip';
    tooltip.textContent = d.ProjectName;
    el.appendChild(tooltip);
    
    return el;
  };

  return (
    <div className="globe-container">
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="https://unpkg.com/three-globe@2.41.12/example/img/earth-night.jpg"
        backgroundColor="rgba(0,0,0,0)"
        atmosphereColor="#00E676"
        atmosphereAltitude={0.15}
        htmlElementsData={projects}
        htmlLat="Latitude"
        htmlLng="Longitude"
        htmlElement={customMarker}
      />
    </div>
  );
});

export default KenyaGlobe;
