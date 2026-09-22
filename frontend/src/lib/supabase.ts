import { createBrowserClient } from '@supabase/supabase-js';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types matching backend schemas
export type PulseCategory = 'Academic' | 'BorrowGear' | 'FoodSharing' | 'SafetyEscort' | 'GeneralHelp';
export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Pulse {
  id: string;
  raw_text: string;
  summary: string;
  category: PulseCategory;
  urgency: UrgencyLevel;
  item_or_action: string | null;
  location_name: string;
  lat: number;
  lng: number;
  expiration_minutes: number;
  is_safe: boolean;
  safety_reason: string | null;
  created_at: string;
  expires_at: string;
}

export interface StudyPod {
  id: string;
  course_code: string;
  topic: string;
  strong_skills: string[];
  needed_skills: string[];
  building_location: string;
  max_capacity: number;
  current_count: number;
  created_at: string;
}

export interface PodMatchResult {
  pod: StudyPod;
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
}

// Urgency color mapping
export const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  Critical: '#dc2626',
  High: '#ea580c',
  Medium: '#2563eb',
  Low: '#16a34a',
};

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  Critical: 'Critical',
  High: 'High',
  Medium: 'Medium',
  Low: 'Low',
};

// Category icons
export const CATEGORY_ICONS: Record<PulseCategory, string> = {
  Academic: '📚',
  BorrowGear: '🔧',
  FoodSharing: '🍕',
  SafetyEscort: '🛡️',
  GeneralHelp: '🤝',
};