-- PulseCampus Database Schema
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS postgis;

-- Pulses Table
CREATE TABLE pulses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_text TEXT NOT NULL,
  summary VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Academic', 'BorrowGear', 'FoodSharing', 'SafetyEscort', 'GeneralHelp')),
  urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('Low', 'Medium', 'High', 'Critical')),
  item_or_action VARCHAR(100),
  location_name VARCHAR(100) NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  expiration_minutes INT NOT NULL CHECK (expiration_minutes BETWEEN 15 AND 360),
  is_safe BOOLEAN DEFAULT TRUE,
  safety_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ GENERATED ALWAYS AS (created_at + (expiration_minutes || ' minutes')::INTERVAL) STORED
);

-- Index for Spatial Queries
CREATE INDEX pulses_geo_idx ON pulses USING GIST (location);

-- Index for Active Pulses Query
CREATE INDEX pulses_active_idx ON pulses (expires_at) WHERE expires_at > NOW() AND is_safe = TRUE;

-- Study Pods Table
CREATE TABLE study_pods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code VARCHAR(20) NOT NULL,
  topic VARCHAR(100) NOT NULL,
  strong_skills TEXT[] NOT NULL DEFAULT '{}',
  needed_skills TEXT[] NOT NULL DEFAULT '{}',
  building_location VARCHAR(100) NOT NULL,
  max_capacity INT DEFAULT 4 CHECK (max_capacity BETWEEN 2 AND 8),
  current_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE pulses ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_pods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read active safe pulses" ON pulses 
  FOR SELECT USING (expires_at > NOW() AND is_safe = TRUE);

CREATE POLICY "Public insert pulses" ON pulses 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read study pods" ON study_pods 
  FOR SELECT USING (true);

CREATE POLICY "Public insert study pods" ON study_pods 
  FOR INSERT WITH CHECK (true);

-- Function to update expires_at index (run periodically via pg_cron or manual)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('clean-expired-pulses', '*/15 * * * *', 'DELETE FROM pulses WHERE expires_at < NOW();');