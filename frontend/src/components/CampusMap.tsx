'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Pulse, UrgencyLevel } from '@/lib/supabase';
import { schoolConfig, getUrgencyColor, getCategoryIcon } from '@/lib/school-config';
import { MapSkeleton } from './Skeleton';

// Fix Leaflet marker icon default
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface CampusMapProps {
  pulses: Pulse[];
  center: [number, number];
  zoom: number;
  onPulseClick?: (pulse: Pulse) => void;
  onMapClick?: (lat: number, lng: number) => void;
  userLocation?: [number, number] | null;
  isLoading?: boolean;
}

const DEFAULT_CENTER: [number, number] = [
  schoolConfig.defaultLat,
  schoolConfig.defaultLng,
];
const DEFAULT_ZOOM = schoolConfig.defaultZoom;

function PulseMarker({ pulse, onClick }: { pulse: Pulse; onClick: () => void }) {
  const color = getUrgencyColor(pulse.urgency);
  const iconChar = getCategoryIcon(pulse.category);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <Marker
      position={[pulse.lat, pulse.lng]}
      icon={
        L.divIcon({
          className: 'pulse-marker',
          html: `
            <div class="pulse-marker-icon" style="background: ${color};" aria-label="${pulse.urgency} urgency">
              ${iconChar}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
      }
    >
      <Popup
        className="pulse-popup"
        autoClose={false}
        closeOnClick={false}
      >
        <div className="p-2 min-w-[200px]" onClick={handleClick}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{iconChar}</span>
            <span className="font-semibold text-sm">{pulse.summary}</span>
          </div>
          <div className="text-xs text-gray-600 mb-1">{pulse.location_name}</div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className="px-2 py-0.5 rounded-full text-white font-medium"
              style={{ backgroundColor: color }}
            >
              {pulse.urgency}
            </span>
            <span className="text-gray-500">
              {formatTimeRemaining(pulse.expires_at)}
            </span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function UserLocationMarker({ position }: { position: [number, number] }) {
  return (
    <Marker position={position} icon={
      L.divIcon({
        className: 'user-marker',
        html: `
          <div style="
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #2563eb;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
            animation: pulse-ring 2s ease-out infinite;
          "></div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      })
    }>
      <Popup>
        <div className="p-2">Your Location</div>
      </Popup>
    </Marker>
  );
}

function MapEvents({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function MapCenterTracker({ onMove }: { onMove: (center: [number, number], zoom: number) => void }) {
  const map = useMap();
  useEffect(() => {
    const handler = () => {
      onMove([map.getCenter().lat, map.getCenter().lng], map.getZoom());
    };
    map.on('moveend', handler);
    return () => {
      map.off('moveend', handler);
    };
  }, [map, onMove]);
  return null;
}

export default function CampusMap({
  pulses,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  onPulseClick,
  onMapClick,
  userLocation,
  isLoading = false,
}: CampusMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState(zoom);

  const handleMove = useCallback((newCenter: [number, number], newZoom: number) => {
    setMapCenter(newCenter);
    setMapZoom(newZoom);
  }, []);

  if (isLoading) {
    return <MapSkeleton />;
  }

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      zoomControl={true}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      whenReady={() => {}}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <MapEvents onMapClick={onMapClick} />
      <MapCenterTracker onMove={handleMove} />
      
      {userLocation && <UserLocationMarker position={userLocation} />}
      
      {pulses.map((pulse) => (
        <PulseMarker
          key={pulse.id}
          pulse={pulse}
          onClick={() => onPulseClick?.(pulse)}
        />
      ))}
    </MapContainer>
  );
}

function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Expired';
  
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  
  if (hours > 0) return `${hours}h ${mins % 60}m left`;
  return `${mins}m left`;
}