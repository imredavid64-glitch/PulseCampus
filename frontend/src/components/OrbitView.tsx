'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Pulse } from '@/lib/supabase';
import { getUrgencyColor, getCategoryIcon } from '@/lib/school-config';
import { schoolConfig } from '@/lib/school-config';

// Import Cesium CSS
import 'cesium/Build/Cesium/Widgets/widgets.css';

interface OrbitViewProps {
  pulses: Pulse[];
  center?: [number, number];
  zoom?: number;
  onPulseClick?: (pulse: Pulse) => void;
  userLocation?: [number, number] | null;
  isLoading?: boolean;
  className?: string;
}

const DEFAULT_CENTER: [number, number] = [schoolConfig.defaultLat, schoolConfig.defaultLng];
const DEFAULT_ZOOM = 15000;

export default function OrbitView({
  pulses,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  onPulseClick,
  userLocation,
  isLoading = false,
  className = ''
}: OrbitViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const entitiesRef = useRef<Map<string, any>>(new Map());
  const animationFrameRef = useRef<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [viewMode, setViewMode] = useState<'orbit' | 'globe' | 'map'>('orbit');
  const [Cesium, setCesium] = useState<any>(null);

  // Load Cesium module
  useEffect(() => {
    import('cesium').then(module => {
      setCesium(module.default || module);
    });
  }, []);

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!containerRef.current || isInitialized || !Cesium) return;

    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity,
      globe: true,
      terrainProvider: undefined,
      skyAtmosphere: true,
      skyBox: undefined,
    });

    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.skyAtmosphere.hueShift = -0.1;
    viewer.scene.skyAtmosphere.saturationShift = 0.2;
    viewer.scene.skyAtmosphere.brightnessShift = -0.1;

    const initialPosition = Cesium.Cartesian3.fromDegrees(center[1], center[0], zoom);
    viewer.camera.setView({
      destination: initialPosition,
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
    });

    viewerRef.current = viewer;
    setIsInitialized(true);

    // Click handler
    const handler = viewer.screenSpaceEventHandler;
    handler.setInputAction((click: any) => {
      const pickedObject = viewer.scene.pick(click.position);
      if (pickedObject && pickedObject.id && pickedObject.id.pulseId) {
        onPulseClick?.(pickedObject.id.pulseData);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      viewer.destroy();
      viewerRef.current = null;
      entitiesRef.current.clear();
      setIsInitialized(false);
    };
  }, [center, zoom, onPulseClick, Cesium, isInitialized]);

  // Update pulses
  useEffect(() => {
    if (!viewerRef.current || !isInitialized || !Cesium) return;

    const viewer = viewerRef.current;
    const currentPulseIds = new Set(pulses.map(p => p.id));
    const existingIds = Array.from(entitiesRef.current.keys());

    // Remove old entities
    for (const id of existingIds) {
      if (!currentPulseIds.has(id)) {
        const entity = entitiesRef.current.get(id);
        if (entity) viewer.entities.remove(entity);
        entitiesRef.current.delete(id);
      }
    }

    // Add/update entities
    pulses.forEach(pulse => {
      let entity = entitiesRef.current.get(pulse.id);
      
      const position = Cesium.Cartesian3.fromDegrees(pulse.lng, pulse.lat, 0);
      const color = Cesium.Color[urgencyColorMap[pulse.urgency]] || Cesium.Color.WHITE;
      const size = urgencySizes[pulse.urgency] || 8;
      const orbitHeight = 100000 + (4 - (urgencySizes[pulse.urgency] || 8) / 12 * 100000);

      if (!entity) {
        const orbitPosition = new Cesium.SampledPositionProperty();
        const now = Cesium.JulianDate.now();
        
        orbitPosition.addSample(now, position);
        
        const future = Cesium.JulianDate.addSeconds(now, 30, new Cesium.JulianDate());
        const orbitPos = Cesium.Cartesian3.fromDegrees(
          pulse.lng + 0.001 * Math.sin(Date.now() / 1000),
          pulse.lat + 0.001 * Math.cos(Date.now() / 1000),
          orbitHeight
        );
        orbitPosition.addSample(future, orbitPos);

        entity = viewer.entities.add({
          id: pulse.id,
          pulseId: pulse,
          pulseData: pulse,
          name: pulse.summary,
          position: orbitPosition,
          point: {
            pixelSize: size,
            color: color,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            scaleByDistance: new Cesium.NearFarScalar(1000, 1.5, 10000, 0.5),
          },
          label: {
            text: `${getCategoryIcon(pulse.category)} ${pulse.summary}`,
            font: '14px sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -20),
            scaleByDistance: new Cesium.NearFarScalar(1000, 1.0, 10000, 0.3),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          properties: {
            pulseData: pulse,
            createdAt: pulse.created_at,
            expiresAt: pulse.expires_at,
            urgency: pulse.urgency,
            category: pulse.category,
          },
        });

        animateOrbit(entity, pulse, orbitHeight, viewer, Cesium, animationFrameRef);
        entitiesRef.current.set(pulse.id, entity);
      } else {
        entity.point = {
          ...entity.point,
          pixelSize: size,
          color: color,
        };
        entity.label = {
          ...entity.label,
          text: `${getCategoryIcon(pulse.category)} ${pulse.summary}`,
        };
      }
    });
  }, [pulses, onPulseClick, Cesium]);

  // User location
  useEffect(() => {
    if (!viewerRef.current || !isInitialized || !userLocation || !Cesium) return;

    const viewer = viewerRef.current;
    
    if (entitiesRef.current.has('user-location')) {
      const entity = entitiesRef.current.get('user-location');
      if (entity) {
        entity.position = Cesium.Cartesian3.fromDegrees(userLocation[1], userLocation[0], 0);
        return;
      }
    }

    viewer.entities.add({
      id: 'user-location',
      name: 'Your Location',
      position: Cesium.Cartesian3.fromDegrees(userLocation[1], userLocation[0], 0),
      point: {
        pixelSize: 16,
        color: Cesium.Color.DODGERBLUE,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      label: {
        text: '📍 You',
        font: '12px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        pixelOffset: new Cesium.Cartesian2(0, -25),
        scaleByDistance: new Cesium.NearFarScalar(1000, 1.0, 10000, 0.3),
      },
    });
  }, [userLocation, Cesium]);

  const handleViewModeChange = useCallback((mode: 'orbit' | 'globe' | 'map') => {
    if (!viewerRef.current || !Cesium) return;
    
    setViewMode(mode);
    const viewer = viewerRef.current!;
    
    switch (mode) {
      case 'orbit':
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(center[1], center[0], zoom),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 },
          duration: 2,
        });
        break;
      case 'globe':
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(center[1], center[0], 2000000),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
          duration: 3,
        });
        break;
      case 'map':
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(center[1], center[0], 5000),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
          duration: 1.5,
        });
        break;
    }
  }, [center, zoom, Cesium]);

  if (isLoading) {
    return (
      <div className={`w-full h-full ${className}`} style={{ background: '#111827' }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading orbital view...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!Cesium) {
    return (
      <div className={`w-full h-full ${className}`} style={{ background: '#000' }}>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">Loading Cesium...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`} style={{ background: '#000' }}>
      <div ref={containerRef} className="w-full h-full" style={{ background: '#000' }} />
      
      {/* View Mode Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-xl p-2">
        <span className="text-xs text-gray-400 px-2">VIEW:</span>
        {(['orbit', 'globe', 'map'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => handleViewModeChange(mode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === mode
                ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/30'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/70 backdrop-blur-sm rounded-xl p-3 text-xs">
        <div className="text-yellow-400 font-medium mb-2">ORBITAL LEGEND</div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(urgencyColorMap).map(([urgency, colorName]) => (
            <div key={urgency} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ 
                  backgroundColor: colorName,
                  boxShadow: `0 0 8px ${colorName}`
                }} 
              />
              <span className="text-gray-300 capitalize">{urgency.toLowerCase()}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-dodgerblue" />
          <span className="text-gray-300">You</span>
        </div>
      </div>

      {/* Pulse Count */}
      <div className="absolute top-4 right-4 z-10 bg-black/70 backdrop-blur-sm rounded-xl p-3 text-right">
        <div className="text-yellow-400 font-bold text-xl">{pulses.length}</div>
        <div className="text-gray-400 text-xs">ACTIVE PULSES</div>
        <div className="text-gray-500 text-xs mt-1">
          {pulses.filter(p => p.urgency === 'Critical').length} critical •
          {pulses.filter(p => p.urgency === 'High').length} high
        </div>
      </div>

      {/* Time Travel Slider */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">TIME TRAVEL</span>
          <input
            type="range"
            min="0"
            max="24"
            value="12"
            step="0.5"
            className="w-48 h-1 bg-gray-700 rounded-lg appearance-none accent-yellow-400 cursor-pointer"
          />
          <span className="text-xs text-yellow-400 font-mono">12:00</span>
        </div>
      </div>
    </div>
  );
}

const urgencyColorMap: Record<string, string> = {
  Critical: 'RED',
  High: 'ORANGE',
  Medium: 'BLUE',
  Low: 'GREEN',
};

const urgencySizes: Record<string, number> = {
  Critical: 12,
  High: 10,
  Medium: 8,
  Low: 6,
};

function animateOrbit(entity: any, pulse: any, height: number, viewer: any, Cesium: any, animationFrameRef: React.MutableRefObject<number>) {
  if (!entity || !viewer) return;
  
  const startTime = Date.now();
  const duration = 30000;
  const radius = 0.0015;
  
  const animate = () => {
    if (!viewer || viewer.isDestroyed()) return;
    
    const elapsed = Date.now() - startTime;
    const progress = (elapsed % duration) / duration;
    const angle = progress * Math.PI * 2;
    
    const lng = pulse.lng + radius * Math.sin(angle);
    const lat = pulse.lat + radius * Math.cos(angle);
    
    const position = Cesium.Cartesian3.fromDegrees(lng, lat, height);
    entity.position = new Cesium.ConstantPositionProperty(position);
    
    animationFrameRef.current = requestAnimationFrame(animate);
  };
  
  animate();
}