// School Configuration for Frontend
// Customize for your campus - copy to school-config.local.ts and modify

export interface SchoolConfig {
  name: string;
  shortName: string;
  domain: string;
  
  // Map defaults
  defaultLat: number;
  defaultLng: number;
  defaultZoom: number;
  mapBounds?: [[number, number], [number, number]];
  
  // Autocomplete data
  buildings: string[];
  courses: string[];
  skills: string[];
  
  // Categories
  categories: Array<{
    value: string;
    label: string;
    desc: string;
  }>;
  
  // Urgency levels
  urgencyLevels: Array<{
    value: string;
    label: string;
    color: string;
    defaultExpiration: number;
  }>;
  
  // Feature flags
  enableStudyPods: boolean;
  enableSafetyEscort: boolean;
  enableFoodSharing: boolean;
  maxPulseLength: number;
  defaultPodCapacity: number;
  
  // Branding
  primaryColor: string;
  secondaryColor: string;
  logoEmoji: string;
}

export const DEFAULT_SCHOOL_CONFIG: SchoolConfig = {
  name: "PulseCampus",
  shortName: "Pulse",
  domain: "localhost:3000",
  
  defaultLat: 37.7245,
  defaultLng: -122.4773,
  defaultZoom: 16,
  
  buildings: [
    "Library",
    "Student Union",
    "Engineering Building",
    "Science Hall",
    "Business School",
    "Arts Center",
    "Dormitory A",
    "Dormitory B",
    "Recreation Center",
    "Health Center",
    "Parking Structure",
    "Campus Quad",
  ],
  
  courses: [
    "CS 101", "CS 201", "CS 301", "CS 401",
    "MATH 101", "MATH 201", "MATH 301",
    "PHYS 101", "PHYS 201",
    "CHEM 101", "CHEM 201",
    "BIO 101", "BIO 201",
    "ECON 101", "ECON 201",
    "PSYC 101", "PSYC 201",
    "STAT 101", "STAT 201",
    "ENG 101", "ENG 201",
    "HIST 101", "PHIL 101",
  ],
  
  skills: [
    "Python", "JavaScript", "Java", "C++", "C", "Rust", "Go",
    "React", "Vue", "Angular", "Node.js", "Express", "Django", "FastAPI",
    "SQL", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS",
    "Git", "Linux", "Bash", "TypeScript", "GraphQL", "REST APIs",
    "Calculus", "Linear Algebra", "Discrete Math", "Statistics", "Probability",
    "Physics", "Chemistry", "Biology", "Organic Chemistry",
    "Data Structures", "Algorithms", "Machine Learning", "Deep Learning",
    "Computer Vision", "NLP", "Data Analysis", "Pandas", "NumPy", "TensorFlow",
    "Writing", "Research", "Technical Writing", "LaTeX", "Presentation",
    "Project Management", "Agile", "Scrum", "Team Leadership",
  ],
  
  categories: [
    { value: "Academic", label: "📚 Academic", desc: "Homework, exams, study help" },
    { value: "BorrowGear", label: "🔧 Borrow Gear", desc: "Calculators, chargers, tools" },
    { value: "FoodSharing", label: "🍕 Food Sharing", desc: "Extra meals, snacks, leftovers" },
    { value: "SafetyEscort", label: "🛡️ Safety Escort", desc: "Walk home, campus safety" },
    { value: "GeneralHelp", label: "🤝 General Help", desc: "Anything else you need" },
  ],
  
  urgencyLevels: [
    { value: "Critical", label: "Critical", color: "#dc2626", defaultExpiration: 15 },
    { value: "High", label: "High", color: "#ea580c", defaultExpiration: 60 },
    { value: "Medium", label: "Medium", color: "#2563eb", defaultExpiration: 120 },
    { value: "Low", label: "Low", color: "#16a34a", defaultExpiration: 240 },
  ],
  
  enableStudyPods: true,
  enableSafetyEscort: true,
  enableFoodSharing: true,
  maxPulseLength: 500,
  defaultPodCapacity: 4,
  
  primaryColor: "#2563eb",
  secondaryColor: "#16a34a",
  logoEmoji: "📍",
};

// Load config - can be overridden by env vars or local file
export function getSchoolConfig(): SchoolConfig {
  // Check for environment variable overrides
  if (typeof window !== 'undefined') {
    // Client-side: check for meta tags or window config
    if ((window as any).__SCHOOL_CONFIG__) {
      return { ...DEFAULT_SCHOOL_CONFIG, ...(window as any).__SCHOOL_CONFIG__ };
    }
  }
  
  // Server-side: could read from process.env
  if (typeof process !== 'undefined' && process.env.SCHOOL_NAME) {
    return {
      ...DEFAULT_SCHOOL_CONFIG,
      name: process.env.SCHOOL_NAME,
      shortName: process.env.SCHOOL_SHORT_NAME || DEFAULT_SCHOOL_CONFIG.shortName,
      defaultLat: parseFloat(process.env.SCHOOL_DEFAULT_LAT || String(DEFAULT_SCHOOL_CONFIG.defaultLat)),
      defaultLng: parseFloat(process.env.SCHOOL_DEFAULT_LNG || String(DEFAULT_SCHOOL_CONFIG.defaultLng)),
      defaultZoom: parseInt(process.env.SCHOOL_DEFAULT_ZOOM || String(DEFAULT_SCHOOL_CONFIG.defaultZoom)),
      primaryColor: process.env.SCHOOL_PRIMARY_COLOR || DEFAULT_SCHOOL_CONFIG.primaryColor,
      secondaryColor: process.env.SCHOOL_SECONDARY_COLOR || DEFAULT_SCHOOL_CONFIG.secondaryColor,
      logoEmoji: process.env.SCHOOL_LOGO_EMOJI || DEFAULT_SCHOOL_CONFIG.logoEmoji,
    };
  }
  
  return DEFAULT_SCHOOL_CONFIG;
}

export const schoolConfig = getSchoolConfig();

// Helper to get urgency color
export function getUrgencyColor(urgency: string): string {
  const level = schoolConfig.urgencyLevels.find(u => u.value === urgency);
  return level?.color || schoolConfig.primaryColor;
}

// Helper to get category icon
export function getCategoryIcon(category: string): string {
  const cat = schoolConfig.categories.find(c => c.value === category);
  return cat?.label.split(' ')[0] || '📍';
}