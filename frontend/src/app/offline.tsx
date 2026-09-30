'use client';

import { useEffect } from 'react';
import { WifiOff, RefreshCw, MapPin } from 'lucide-react';
import { useSchoolConfig } from '@/lib/school-config';

export default function Offline() {
  const config = useSchoolConfig();
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: config.primaryColor + '15' }}>
          <WifiOff className="w-12 h-12" style={{ color: config.primaryColor }} />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Offline</h1>
        <p className="text-gray-600 mb-6">
          PulseCampus works offline! Your pulses and study pods are cached.
        </p>

        <div className="space-y-3 mb-6 p-4 bg-white rounded-xl border border-gray-100 text-left">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5" style={{ color: config.primaryColor }} />
            Available Offline
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">✅ View cached pulses & study pods</li>
            <li className="flex items-center gap-2">✅ Browse campus map (cached tiles)</li>
            <li className="flex items-center gap-2">✅ Compose new pulses (queues for sync)</li>
            <li className="flex items-center gap-2">✅ Join study pods (queues for sync)</li>
          </ul>
        </div>

        <button
          onClick={handleRetry}
          className="w-full py-3 px-6 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2 mx-auto"
          style={{ backgroundColor: config.primaryColor }}
        >
          <RefreshCw className="w-5 h-5" />
          Reconnect & Sync
        </button>

        <p className="mt-4 text-xs text-gray-400">
          Data will sync automatically when you're back online.
        </p>
      </div>
    </div>
  );
}