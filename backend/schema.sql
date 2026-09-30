-- PulseCampus Database Schema
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS postgis;

-- Pulses Table
CREATE TABLE pulses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_text TEXT NOT NULL,
  summary VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Academic', 'BorrowGear', 'FoodSharing', 'SafetyEscort', 'GeneralHelp', 'BananaPulse')),
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

-- Push Subscriptions Table
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read own push subscription" ON push_subscriptions
  FOR SELECT USING (true);

CREATE POLICY "Public delete own push subscription" ON push_subscriptions
  FOR DELETE USING (true);

-- Kindness Chain Table
CREATE TABLE kindness_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  helper_pulse_id UUID NOT NULL REFERENCES pulses(id) ON DELETE CASCADE,
  helped_pulse_id UUID NOT NULL REFERENCES pulses(id) ON DELETE CASCADE,
  chain_type VARCHAR(20) DEFAULT 'direct',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX kindness_chains_helper_idx ON kindness_chains(helper_pulse_id);
CREATE INDEX kindness_chains_helped_idx ON kindness_chains(helped_pulse_id);

-- Enable RLS
ALTER TABLE kindness_chains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read kindness chains" ON kindness_chains
  FOR SELECT USING (true);

CREATE POLICY "Public insert kindness chains" ON kindness_chains
  FOR INSERT WITH CHECK (true);

-- Function to update expires_at index (run periodically via pg_cron or manual)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('clean-expired-pulses', '*/15 * * * *', 'DELETE FROM pulses WHERE expires_at < NOW();');

-- Gamification Tables
-- User Badges Table
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX user_badges_user_idx ON user_badges(user_id);

-- Enable RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read user badges" ON user_badges
  FOR SELECT USING (true);

CREATE POLICY "Public insert user badges" ON user_badges
  FOR INSERT WITH CHECK (true);

-- Study Pod Members Table
CREATE TABLE study_pod_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES study_pods(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pod_id, user_id)
);

CREATE INDEX study_pod_members_pod_idx ON study_pod_members(pod_id);
CREATE INDEX study_pod_members_user_idx ON study_pod_members(user_id);

-- Enable RLS
ALTER TABLE study_pod_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pod members" ON study_pod_members
  FOR SELECT USING (true);

CREATE POLICY "Public insert pod members" ON study_pod_members
  FOR INSERT WITH CHECK (true);

-- Add user_id to pulses for gamification tracking
-- ALTER TABLE pulses ADD COLUMN user_id TEXT;
-- CREATE INDEX pulses_user_idx ON pulses(user_id);

-- Add creator_id to study_pods
-- ALTER TABLE study_pods ADD COLUMN creator_id TEXT;
-- CREATE INDEX study_pods_creator_idx ON study_pods(creator_id);