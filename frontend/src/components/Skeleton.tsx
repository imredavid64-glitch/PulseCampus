'use client';

import { MapPin, Clock, Users, BookOpen } from 'lucide-react';

export function MapSkeleton() {
  return (
    <div className="relative h-full w-full bg-gray-100 rounded-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
      
      {/* Fake map markers loading */}
      <div className="relative z-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-6 h-6 rounded-full bg-gray-300 animate-pulse" />
      </div>
      <div className="relative z-10 absolute top-1/3 left-1/3">
        <div className="w-6 h-6 rounded-full bg-gray-300 animate-pulse" />
      </div>
      <div className="relative z-10 absolute bottom-1/4 right-1/4">
        <div className="w-6 h-6 rounded-full bg-gray-300 animate-pulse" />
      </div>
      
      {/* Loading indicator */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading campus map...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PulseListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-t-2xl shadow-xl border-t border-gray-100">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
          <div className="w-32 h-6 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="w-20 h-6 rounded bg-gray-200 animate-pulse" />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 rounded" />
                <div className="flex gap-2">
                  <div className="h-5 w-20 bg-gray-200 rounded-full" />
                  <div className="h-5 w-24 bg-gray-200 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PulseCardSkeleton() {
  return (
    <button className="p-4 bg-gray-50 rounded-xl border border-gray-100 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-200" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="h-3 w-1/2 bg-gray-200 rounded" />
          <div className="flex gap-2">
            <div className="h-5 w-20 bg-gray-200 rounded-full" />
            <div className="h-5 w-24 bg-gray-200 rounded-full" />
          </div>
        </div>
      </div>
    </button>
  );
}

export function StudyPodMatcherSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gray-200 animate-pulse" />
          <div className="w-32 h-6 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="w-24 h-8 rounded bg-gray-200 animate-pulse" />
      </div>

      <div className="p-4 space-y-4">
        <div>
          <div className="h-4 w-1/4 bg-gray-200 rounded mb-2 animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded-xl animate-pulse" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="h-4 w-1/2 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-8 w-full bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-8 w-full bg-gray-200 rounded-lg animate-pulse mt-2" />
          </div>
          <div>
            <div className="h-4 w-1/2 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-8 w-full bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-8 w-full bg-gray-200 rounded-lg animate-pulse mt-2" />
          </div>
        </div>

        <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-20 bg-gray-200 rounded" />
            <div className="h-5 w-24 bg-gray-200 rounded-full" />
          </div>
          <div className="h-4 w-1/2 bg-gray-200 rounded" />
          <div className="flex items-center gap-3">
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </div>
          <div className="flex gap-1">
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
          </div>
        </div>
        <div className="h-10 w-24 bg-gray-200 rounded-lg flex-shrink-0" />
      </div>
    </div>
  );
}

export function PulseModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-up p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="w-5 h-5 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        
        <div>
          <div className="h-4 w-1/4 bg-gray-200 rounded mb-2 animate-pulse" />
          <div className="grid grid-cols-2 gap-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
        
        <div>
          <div className="h-4 w-1/4 bg-gray-200 rounded mb-2 animate-pulse" />
          <div className="h-24 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        
        <div>
          <div className="h-4 w-1/4 bg-gray-200 rounded mb-2 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}