'use client';

import { useVoiceToPulse } from '@/hooks/useVoiceToPulse';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { schoolConfig } from '@/lib/school-config';

interface VoicePulseButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export default function VoicePulseButton({ onTranscript, className = '' }: VoicePulseButtonProps) {
  const [showVisualizer, setShowVisualizer] = useState(false);
  const { isSupported, isListening, error, interimTranscript, startListening, stopListening, toggleListening } = useVoiceToPulse({
    onTranscript: (text) => {
      onTranscript(text);
      setShowVisualizer(false);
    },
  });

  const handleToggle = () => {
    if (!isSupported) return;
    toggleListening();
    setShowVisualizer(isListening); // Show visualizer when starting
  };

  if (!isSupported) {
    return (
      <button
        className={`p-2 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed ${className}`}
        disabled
        title="Speech recognition not supported in this browser"
      >
        <MicOff className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleToggle}
        disabled={isListening && !interimTranscript} // Allow stopping while listening
        className={`p-3 rounded-xl transition-all flex items-center justify-center ${
          isListening
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
            : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:text-gray-900 hover:shadow-xl'
        }`}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        title={isListening ? 'Stop voice input' : 'Start voice input'}
      >
        {isListening ? (
          <Mic className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </button>

      {/* Visualizer when listening */}
      {isListening && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48">
          <div className="bg-black/80 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-yellow-400 font-mono text-sm">🎙️ LISTENING</span>
              <button
                onClick={() => { stopListening(); setShowVisualizer(false); }}
                className="ml-2 p-1 text-gray-400 hover:text-white rounded"
                aria-label="Stop listening"
              >
                ✕
              </button>
            </div>
            {interimTranscript && (
              <div className="bg-white/10 rounded-lg p-2 text-sm text-white min-h-[2.5rem] font-mono">
                {interimTranscript}
              </div>
            )}
            {!interimTranscript && (
              <div className="text-gray-500 text-xs italic">Speak now...</div>
            )}
            <div className="flex justify-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-10 bg-yellow-400/50 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64">
          <div className="bg-red-500/90 text-white rounded-xl p-3 text-center text-sm shadow-lg">
            {error}
            <button
              onClick={() => { setShowVisualizer(false); }}
              className="ml-2 text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}