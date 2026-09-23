'use client';

import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface PulseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: [number, number] | null;
  onSuccess?: () => void;
}

const CATEGORIES = [
  { value: 'Academic', label: '📚 Academic', desc: 'Homework, exams, study help' },
  { value: 'BorrowGear', label: '🔧 Borrow Gear', desc: 'Calculators, chargers, tools' },
  { value: 'FoodSharing', label: '🍕 Food Sharing', desc: 'Extra meals, snacks, leftovers' },
  { value: 'SafetyEscort', label: '🛡️ Safety Escort', desc: 'Walk home, campus safety' },
  { value: 'GeneralHelp', label: '🤝 General Help', desc: 'Anything else you need' },
];

export default function PulseModal({ isOpen, onClose, userLocation, onSuccess }: PulseModalProps) {
  const [rawText, setRawText] = useState('');
  const [locationName, setLocationName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('GeneralHelp');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
      // Reset form
      setRawText('');
      setLocationName('');
      setSelectedCategory('GeneralHelp');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  // Auto-detect location name from user location
  useEffect(() => {
    if (userLocation && !locationName) {
      reverseGeocode(userLocation[0], userLocation[1]).then((name) => {
        setLocationName(name);
      }).catch(() => {});
    }
  }, [userLocation, locationName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rawText.trim()) {
      setError('Please describe what you need');
      return;
    }
    
    if (!userLocation) {
      setError('Location access required. Please enable location services.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/pulses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: rawText,
          location_name: locationName || 'Current Location',
          lat: userLocation[0],
          lng: userLocation[1],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create pulse');
      }

      setSuccess(true);
      onSuccess?.();
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">New Pulse</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Category Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`p-3 rounded-xl text-left text-sm transition-all ${
                    selectedCategory === cat.value
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{cat.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{cat.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Raw Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What do you need? <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={textareaRef}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g., Need a TI-84 calculator for my stats exam at 2pm outside Science Hall"
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right mt-1">{rawText.length}/500</p>
          </div>

          {/* Location Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location Name</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Science Hall Entrance"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                maxLength={100}
              />
            </div>
          </div>

          {/* Error/Success Message */}
          {(error || success) && (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ 
              backgroundColor: error ? '#fef2f2' : '#f0fdf4',
              borderColor: error ? '#fecaca' : '#bbf7d0'
            }}>
              {error ? (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              )}
              <p className="text-sm" style={{ color: error ? '#dc2626' : '#16a34a' }}>
                {error || 'Pulse posted successfully!'}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !rawText.trim()}
            className="w-full py-3 px-4 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#2563eb' }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Posting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Send className="w-5 h-5" />
                Post Pulse
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await response.json();
    
    // Prefer building name, then road, then neighbourhood
    const address = data.address || {};
    return address.building || 
           address.university || 
           address.road || 
           address.neighbourhood || 
           address.suburb || 
           'Current Location';
  } catch {
    return 'Current Location';
  }
}