'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/supabase-js';
import { MapPin, Loader2, RefreshCw, Bell, Settings, Menu, X } from 'lucide-react';
import CampusMap from '@/components/CampusMap';
import PulseList from '@/components/PulseList';
import PulseModal from '@/components/PulseModal';
import StudyPodMatcher from '@/components/StudyPodMatcher';
import { Pulse, PulseCategory, UrgencyLevel } from '@/lib/supabase';

const DEFAULT_CENTER: [number, number] = [
  parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT || '37.7245'),
  parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG || '-122.4773'),
];

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Dashboard() {
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(16);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPulseModal, setShowPulseModal] = useState(false);
  const [showPodMatcher, setShowPodMatcher] = useState(false);
  const [selectedPulse, setSelectedPulse] = useState<Pulse | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'pulses' | 'pods'>('pulses');

  // Fetch initial pulses
  const fetchPulses = useCallback(async () => {
    if (!userLocation) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiUrl}/api/pulses/nearby?lat=${userLocation[0]}&lng=${userLocation[1]}&radius_meters=1000`
      );
      
      if (!response.ok) throw new Error('Failed to fetch pulses');
      
      const data = await response.json();
      setPulses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pulses');
    } finally {
      setIsLoading(false);
    }
  }, [userLocation]);

  // Get user location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(loc);
        setMapCenter(loc);
      },
      (err) => {
        console.warn('Geolocation denied, using default:', err);
        setError('Location access denied - using default campus location');
        setUserLocation(DEFAULT_CENTER);
        setMapCenter(DEFAULT_CENTER);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // Fetch pulses when location is available
  useEffect(() => {
    if (userLocation) {
      fetchPulses();
    }
  }, [userLocation, fetchPulses]);

  // Realtime subscription for pulses
  useEffect(() => {
    const channel = supabase
      .channel('pulses-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pulses',
          filter: 'expires_at=gt.now()',
        },
        (payload) => {
          handleRealtimeChange(payload);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleRealtimeChange = (payload: any) => {
    const newPulse = payload.new as Pulse;
    
    setPulses((prev) => {
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
  };

  const handleMapClick = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
    // Could open pulse modal with pre-filled location
  };

  const handlePulseClick = (pulse: Pulse) => {
    setSelectedPulse(pulse);
    setMapCenter([pulse.lat, pulse.lng]);
    setMapZoom(18);
  };

  const handleDismissPulse = (pulseId: string) => {
    setPulses((prev) => prev.filter((p) => p.id !== pulseId));
  };

  const handlePulseCreated = () => {
    fetchPulses();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed bottom-4 right-4 z-40 lg:hidden p-3 rounded-full shadow-lg"
        style={{ backgroundColor: '#2563eb', color: 'white' }}
        aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Map Section - Left/Main */}
      <div className="relative flex-1 lg:w-3/4 min-h-screen">
        <CampusMap
          pulses={pulses}
          center={mapCenter}
          zoom={mapZoom}
          onPulseClick={handlePulseClick}
          onMapClick={handleMapClick}
          userLocation={userLocation}
        />

        {/* Map Controls Overlay */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-start justify-between p-4 lg:p-6 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">PulseCampus</h1>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                Live
              </span>
            </div>
          </div>
          
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={() => {
                if (userLocation) {
                  setMapCenter(userLocation);
                  setMapZoom(17);
                }
              }}
              disabled={!userLocation}
              className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 hover:shadow-xl transition-shadow"
              aria-label="Center on my location"
            >
              <MapPin className="w-5 h-5 text-gray-600" />
            </button>
            
            <button
              onClick={fetchPulses}
              disabled={isLoading}
              className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 hover:shadow-xl transition-shadow"
              aria-label="Refresh pulses"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-30">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: '#2563eb' }} />
              <p className="text-gray-600">Loading campus pulses...</p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="absolute bottom-4 left-4 right-4 max-w-md mx-auto z-30 pointer-events-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-2 text-red-700">
                <span className="flex-shrink-0">⚠️</span>
                <p className="text-sm">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selected Pulse Popup */}
        {selectedPulse && (
          <div className="absolute bottom-4 left-4 right-4 max-w-md mx-auto z-30 pointer-events-auto animate-slide-up">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${getUrgencyColor(selectedPulse.urgency)}15` }}>
                      {getCategoryIcon(selectedPulse.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedPulse.summary}</h3>
                      <p className="text-sm text-gray-500">{selectedPulse.location_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPulse(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: getUrgencyColor(selectedPulse.urgency) }}
                  >
                    {selectedPulse.urgency}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                    {formatTimeRemaining(selectedPulse.expires_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Buttons */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 lg:hidden pointer-events-auto">
          <button
            onClick={() => setShowPulseModal(true)}
            className="bg-white rounded-xl shadow-lg p-3 hover:shadow-xl transition-shadow"
            aria-label="Create pulse"
          >
            <span className="text-lg">➕</span>
          </button>
          <button
            onClick={() => setShowPodMatcher(true)}
            className="bg-white rounded-xl shadow-lg p-3 hover:shadow-xl transition-shadow"
            aria-label="Study pod matcher"
          >
            <span className="text-lg">📚</span>
          </button>
        </div>
      </div>

      {/* Sidebar - Right */}
      <aside className={`lg:w-1/4 hidden lg:block fixed lg:static inset-y-0 right-0 z-30 transition-transform duration-300 bg-white border-l border-gray-100 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">Live Feed</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPulseModal(true)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="New pulse"
              >
                <span className="text-lg">➕</span>
              </button>
              <button
                onClick={() => setShowPodMatcher(true)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Study pods"
              >
                <span className="text-lg">📚</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-100 px-4">
            <button
              onClick={() => setActiveTab('pulses')}
              className={`py-3 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'pulses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pulses ({pulses.filter(p => new Date(p.expires_at) > new Date()).length})
            </button>
            <button
              onClick={() => setActiveTab('pods')}
              className={`py-3 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'pods'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Study Pods
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'pulses' && (
              <PulseList
                pulses={pulses}
                userLocation={userLocation}
                onPulseClick={handlePulseClick}
                onDismiss={handleDismissPulse}
              />
            )}
            {activeTab === 'pods' && (
              <StudyPodMatcher userLocation={userLocation} />
            )}
          </div>
        </div>
      </aside>

      {/* Modals */}
      <PulseModal
        isOpen={showPulseModal}
        onClose={() => setShowPulseModal(false)}
        userLocation={userLocation}
        onSuccess={handlePulseCreated}
      />

      <StudyPodMatcher
        userLocation={userLocation}
      />
    </div>
  );
}

function getUrgencyColor(urgency: UrgencyLevel): string {
  const colors: Record<UrgencyLevel, string> = {
    Critical: '#dc2626',
    High: '#ea580c',
    Medium: '#2563eb',
    Low: '#16a34a',
  };
  return colors[urgency];
}

function getCategoryIcon(category: PulseCategory): string {
  const icons: Record<PulseCategory, string> = {
    Academic: '📚',
    BorrowGear: '🔧',
    FoodSharing: '🍕',
    SafetyEscort: '🛡️',
    GeneralHelp: '🤝',
  };
  return icons[category];
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

function sortPulses(a: Pulse, b: Pulse): number {
  const urgencyOrder: Record<string, number> = { Critical: 1, High: 2, Medium: 3, Low: 4 };
  const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  if (urgencyDiff !== 0) return urgencyDiff;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}