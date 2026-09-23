'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, Pulse, UrgencyLevel } from '@/lib/supabase';
import { schoolConfig, getUrgencyColor, getCategoryIcon } from '@/lib/school-config';
import { MapPin, Clock, X } from 'lucide-react';
import { PulseListSkeleton, PulseCardSkeleton } from './Skeleton';

interface PulseListProps {
  pulses: Pulse[];
  userLocation: [number, number] | null;
  onPulseClick: (pulse: Pulse) => void;
  onDismiss: (pulseId: string) => void;
  isLoading?: boolean;
}

export default function PulseList({ pulses, userLocation, onPulseClick, onDismiss, isLoading = false }: PulseListProps) {
  const [realtimePulses, setRealtimePulses] = useState<Pulse[]>(pulses);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('pulses-changes')
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'pulses',
          filter: 'expires_at=gt.now()',
        },
        (payload: { eventType: string; new: Pulse | null; old: Pulse | null }) => {
          handleRealtimeChange(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Sync with props when they change (initial load)
  useEffect(() => {
    setRealtimePulses(pulses);
  }, [pulses]);

  const handleRealtimeChange = useCallback((payload: any) => {
    const newPulse = payload.new as Pulse;
    
    setRealtimePulses((prev) => {
      const exists = prev.find((p) => p.id === payload.new?.id);
      
      switch (payload.eventType) {
        case 'INSERT':
          if (!exists && newPulse?.is_safe) {
            return [newPulse, ...prev].sort(sortPulses);
          }
          return prev;
        case 'UPDATE':
          if (exists) {
            return prev.map((p) => (p.id === newPulse.id ? newPulse : p)).sort(sortPulses);
          }
          if (newPulse?.is_safe) {
            return [...prev, newPulse].sort(sortPulses);
          }
          return prev;
        case 'DELETE':
          return prev.filter((p) => p.id !== payload.old.id);
        default:
          return prev;
      }
    });
  }, []);

  // Filter expired pulses locally as backup
  const activePulses = realtimePulses.filter((p) => new Date(p.expires_at) > new Date());

  if (isLoading) {
    return <PulseListSkeleton />;
  }

  if (activePulses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
        <MapPin className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-lg font-medium">No active pulses nearby</p>
        <p className="text-sm mt-1">Be the first to post something!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-t-2xl shadow-xl border-t border-gray-100">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: schoolConfig.primaryColor }}></span>
          Live Pulse Feed
        </h2>
        <span className="text-sm text-gray-500">{activePulses.length} active</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activePulses.map((pulse) => (
          <PulseCard
            key={pulse.id}
            pulse={pulse}
            userLocation={userLocation}
            onClick={() => onPulseClick(pulse)}
            onDismiss={() => onDismiss(pulse.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PulseCard({ pulse, userLocation, onClick, onDismiss }: {
  pulse: Pulse;
  userLocation: [number, number] | null;
  onClick: () => void;
  onDismiss: () => void;
}) {
  const color = getUrgencyColor(pulse.urgency);
  const iconChar = getCategoryIcon(pulse.category);
  const distance = userLocation 
    ? calculateDistance(userLocation[0], userLocation[1], pulse.lat, pulse.lng)
    : null;

  return (
    <button
      onClick={onClick}
      className={`group relative p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${getUrgencyClass(pulse.urgency)}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          {iconChar}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{pulse.summary}</h3>
            <button
              onClick={(e) => { e.stopPropagation(); onDismiss(); }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {pulse.location_name}
            </span>
            {distance && (
              <span className="flex items-center gap-1">
                <span>·</span>
                {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
              </span>
            )}
          </div>
          
          <div className="mt-2 flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {pulse.urgency}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {formatTimeRemaining(pulse.expires_at)}
            </span>
            {pulse.item_or_action && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                {pulse.item_or_action}
              </span>
            )}
          </div>
        </div>
        
        {/* Urgency indicator bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ backgroundColor: color }}
        />
      </div>
    </button>
  );
}

function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Expired';
  
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  return `${mins}m`;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function sortPulses(a: Pulse, b: Pulse): number {
  const urgencyOrder: Record<string, number> = { Critical: 1, High: 2, Medium: 3, Low: 4 };
  const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  if (urgencyDiff !== 0) return urgencyDiff;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function getUrgencyClass(urgency: UrgencyLevel): string {
  const classes: Record<UrgencyLevel, string> = {
    Critical: 'red-500',
    High: 'orange-500',
    Medium: 'blue-500',
    Low: 'green-500',
  };
  return classes[urgency];
}