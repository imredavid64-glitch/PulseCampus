-- PulseCampus Demo Seed Data
-- Run this AFTER schema.sql in Supabase SQL Editor
-- Creates realistic demo pulses and study pods for hackathon presentation

-- ============================================
-- SAMPLE PULSES (near default campus center: 37.7245, -122.4773)
-- ============================================

-- Critical: Safety Escort (expires in 15 min)
INSERT INTO pulses (raw_text, summary, category, urgency, item_or_action, location_name, location, expiration_minutes, is_safe, safety_reason)
VALUES 
(
  'Walking back from late study session at Library, need someone to walk with me to Parking Structure. It''s dark and I feel unsafe.',
  'Safety escort to Parking Structure',
  'SafetyEscort',
  'Critical',
  'Walk together',
  'Library Entrance',
  ST_SetSRID(ST_MakePoint(-122.4775, 37.7243), 4326),
  15,
  true,
  null
),
(
  'Just saw someone suspicious near Engineering Building loading dock. Campus security notified but need eyes on area.',
  'Suspicious activity near Engineering',
  'SafetyEscort',
  'Critical',
  'Stay alert / report',
  'Engineering Building Loading Dock',
  ST_SetSRID(ST_MakePoint(-122.4770, 37.7248), 4326),
  20,
  true,
  null
);

-- High: Urgent Gear Needs (expires in 30-60 min)
INSERT INTO pulses (raw_text, summary, category, urgency, item_or_action, location_name, location, expiration_minutes, is_safe, safety_reason)
VALUES 
(
  'STAT 201 midterm in 45 minutes! Forgot my TI-84 calculator. Can anyone lend me one at Science Hall?',
  'Need TI-84 for STAT 201 midterm',
  'BorrowGear',
  'High',
  'TI-84 calculator',
  'Science Hall Room 101',
  ST_SetSRID(ST_MakePoint(-122.4768, 37.7250), 4326),
  45,
  true,
  null
),
(
  'Phone died and I need to call my ride. Anyone have a charger (USB-C) at Student Union? Stuck here for 30 min.',
  'Need USB-C charger at Student Union',
  'BorrowGear',
  'High',
  'USB-C charger',
  'Student Union 2nd Floor',
  ST_SetSRID(ST_MakePoint(-122.4778, 37.7240), 4326),
  30,
  true,
  null
),
(
  'CS 301 final project due in 2 hours, laptop charger broke. Need USB-C 65W charger at Engineering Building ASAP.',
  'Need USB-C 65W laptop charger',
  'BorrowGear',
  'High',
  'USB-C 65W charger',
  'Engineering Building Lab 3',
  ST_SetSRID(ST_MakePoint(-122.4772, 37.7246), 4326),
  60,
  true,
  null
);

-- Medium: Food Sharing (expires in 60-120 min)
INSERT INTO pulses (raw_text, summary, category, urgency, item_or_action, location_name, location, expiration_minutes, is_safe, safety_reason)
VALUES 
(
  'Club event just ended, have 15 leftover pizza boxes (pepperoni & cheese) at Student Union. Come get some!',
  'Free pizza at Student Union',
  'FoodSharing',
  'Medium',
  '15 pizza boxes',
  'Student Union Ballroom',
  ST_SetSRID(ST_MakePoint(-122.4780, 37.7238), 4326),
  90,
  true,
  null
),
(
  'Bought too many boba drinks for study group. 4 extra (2 milk tea, 1 matcha, 1 fruit tea) at Library Cafe. Free!',
  'Free boba drinks at Library',
  'FoodSharing',
  'Medium',
  '4 boba drinks',
  'Library Cafe',
  ST_SetSRID(ST_MakePoint(-122.4773, 37.7245), 4326),
  60,
  true,
  null
),
(
  'Department BBQ leftovers - burgers, hot dogs, veggie burgers at Engineering Building courtyard. Help yourself!',
  'Free BBQ leftovers at Engineering',
  'FoodSharing',
  'Medium',
  'Burgers & hot dogs',
  'Engineering Courtyard',
  ST_SetSRID(ST_MakePoint(-122.4769, 37.7247), 4326),
  120,
  true,
  null
);

-- Low: Academic & General Help (expires in 2-4 hours)
INSERT INTO pulses (raw_text, summary, category, urgency, item_or_action, location_name, location, expiration_minutes, is_safe, safety_reason)
VALUES 
(
  'CS 101 study group forming for midterm review. Meeting at Library 3rd floor study room 304 at 7pm. All welcome!',
  'CS 101 midterm study group 7pm',
  'Academic',
  'Low',
  'Study group',
  'Library Room 304',
  ST_SetSRID(ST_MakePoint(-122.4776, 37.7242), 4326),
  240,
  true,
  null
),
(
  'Found AirPods Pro in white case at Science Hall lobby. Turned in to front desk. Describe to claim!',
  'Found AirPods Pro at Science Hall',
  'GeneralHelp',
  'Low',
  'Lost & found',
  'Science Hall Lobby',
  ST_SetSRID(ST_MakePoint(-122.4767, 37.7251), 4326),
  360,
  true,
  null
),
(
  'Looking for MATH 201 textbook (Stewart Calculus 8th ed). Anyone have a copy to borrow or sell cheap?',
  'Need MATH 201 textbook',
  'Academic',
  'Low',
  'Textbook',
  'Campus Bookstore',
  ST_SetSRID(ST_MakePoint(-122.4774, 37.7239), 4326),
  360,
  true,
  null
),
(
  'Free coffee and donuts at Career Fair in Business School atrium until 2pm. Swing by!',
  'Free coffee at Career Fair',
  'FoodSharing',
  'Low',
  'Coffee & donuts',
  'Business School Atrium',
  ST_SetSRID(ST_MakePoint(-122.4782, 37.7235), 4326),
  180,
  true,
  null
),
(
  'Need help debugging React hook issue for CS 301 project. At Library computers, row 12. Buy you coffee!',
  'React debugging help needed',
  'Academic',
  'Low',
  'Code review',
  'Library Computer Lab',
  ST_SetSRID(ST_MakePoint(-122.4775, 37.7244), 4326),
  240,
  true,
  null
);

-- ============================================
-- SAMPLE STUDY PODS
-- ============================================

INSERT INTO study_pods (course_code, topic, strong_skills, needed_skills, building_location, max_capacity, current_count)
VALUES 
(
  'CS 101',
  'Midterm Review - Loops, Functions, Arrays',
  '{"Python", "Loops", "Functions", "Debugging"}',
  '{"Arrays", "Recursion", "Time Complexity"}',
  'Library Room 304',
  4,
  2
),
(
  'CS 101',
  'Project Help - Final Project Planning',
  '{"Python", "Git", "Project Planning", "OOP"}',
  '{"Data Structures", "File I/O", "Testing"}',
  'Engineering Building Lab 2',
  4,
  1
),
(
  'MATH 201',
  'Calculus II - Integration Techniques',
  '{"Integration", "Substitution", "Parts", "Partial Fractions"}',
  '{"Series", "Sequences", "Convergence Tests"}',
  'Science Hall Room 205',
  4,
  3
),
(
  'PHYS 101',
  'Mechanics - Forces & Motion Problem Set',
  '{"Free Body Diagrams", "Newton Laws", "Kinematics"}',
  '{"Work Energy", "Momentum", "Rotational Motion"}',
  'Science Hall Room 101',
  4,
  2
),
(
  'STAT 101',
  'Statistics - Hypothesis Testing & Confidence Intervals',
  '{"Descriptive Stats", "Probability", "Normal Distribution"}',
  '{"T-tests", "Chi-square", "Regression", "P-values"}',
  'Library Room 201',
  4,
  1
),
(
  'CS 301',
  'Data Structures - Trees & Graphs Implementation',
  '{"Python", "Classes", "Recursion", "Linked Lists"}',
  '{"Trees", "Graphs", "BFS/DFS", "Dynamic Programming"}',
  'Engineering Building Room 301',
  4,
  2
),
(
  'ECON 101',
  'Microeconomics - Supply/Demand & Elasticity',
  '{"Graphing", "Algebra", "Conceptual Understanding"}',
  '{"Elasticity Calculations", "Market Equilibrium", "Consumer Surplus"}',
  'Business School Room 150',
  4,
  1
),
(
  'CHEM 101',
  'General Chemistry - Stoichiometry & Bonding',
  '{"Molar Mass", "Balancing Equations", "Periodic Trends"}',
  '{"Lewis Structures", "VSEPR", "Polarity", "IMFs"}',
  'Science Hall Room 301',
  4,
  2
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check pulses
-- SELECT id, summary, category, urgency, location_name, expiration_minutes, 
--        EXTRACT(EPOCH FROM (expires_at - NOW()))/60 as minutes_left
-- FROM pulses 
-- WHERE expires_at > NOW() AND is_safe = TRUE
-- ORDER BY urgency, created_at DESC;

-- Check study pods
-- SELECT id, course_code, topic, building_location, current_count, max_capacity
-- FROM study_pods
-- ORDER BY course_code, created_at;

-- Test spatial query (1km radius from campus center)
-- SELECT summary, category, urgency, location_name,
--        ST_Distance(location, ST_SetSRID(ST_MakePoint(-122.4773, 37.7245), 4326)::geography) as distance_m
-- FROM pulses
-- WHERE expires_at > NOW() AND is_safe = TRUE
--   AND ST_DWithin(location, ST_SetSRID(ST_MakePoint(-122.4773, 37.7245), 4326)::geography, 1000)
-- ORDER BY urgency, distance_m;