# School Configuration Template
# Copy this file to config/school.py and customize for your campus
# 
# For PulseCampus at YOUR SCHOOL:
# 1. Rename this file to config/school.py
# 2. Update the values below
# 3. Deploy!

from app.school_config import SchoolConfig

SCHOOL_CONFIG = SchoolConfig(
    # Basic info - CHANGE THESE
    name="Your School Pulse",
    short_name="SchoolPulse",
    domain="your-school.edu",  # For CORS, etc.
    
    # Map - CHANGE THESE to your campus center
    default_lat=37.7749,      # Your campus latitude
    default_lng=-122.4194,    # Your campus longitude
    default_zoom=16,
    # Optional: Restrict map to campus bounds [[south, west], [north, east]]
    # map_bounds=[[37.7700, -122.4250], [37.7800, -122.4100]],
    
    # Buildings - CHANGE THESE to your actual building names
    buildings=[
        "Main Library",
        "Student Center",
        "Engineering Hall",
        "Science Building",
        "Business School",
        "Arts & Humanities",
        "Residence Hall A",
        "Residence Hall B",
        "Recreation Center",
        "Health Services",
        "Parking Garage",
        "Central Quad",
        "Computer Lab",
        "Study Commons",
    ],
    
    # Courses - CHANGE THESE to your actual course codes
    courses=[
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
        # Add your school's actual course codes
    ],
    
    # Skills - customize or keep defaults
    skills=[
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
    
    # Categories - customize labels/icons for your campus culture
    categories=[
        {"value": "Academic", "label": "📚 Academic", "desc": "Homework, exams, study help"},
        {"value": "BorrowGear", "label": "🔧 Borrow Gear", "desc": "Calculators, chargers, tools, lab equipment"},
        {"value": "FoodSharing", "label": "🍕 Food Sharing", "desc": "Extra meals, snacks, leftovers, event food"},
        {"value": "SafetyEscort", "label": "🛡️ Safety Escort", "desc": "Walk home, campus safety, late night"},
        {"value": "GeneralHelp", "label": "🤝 General Help", "desc": "Anything else you need"},
        # Add campus-specific categories:
        # {"value": "RideShare", "label": "🚗 Ride Share", "desc": "Carpool to campus, airport runs"},
        # {"value": "EventBuddy", "label": "🎪 Event Buddy", "desc": "Find people for events, clubs"},
    ],
    
    # Urgency - customize colors/expiration if needed
    urgency_levels=[
        {"value": "Critical", "label": "Critical", "color": "#dc2626", "default_expiration": 15},
        {"value": "High", "label": "High", "color": "#ea580c", "default_expiration": 60},
        {"value": "Medium", "label": "Medium", "color": "#2563eb", "default_expiration": 120},
        {"value": "Low", "label": "Low", "color": "#16a34a", "default_expiration": 240},
    ],
    
    # Feature flags - enable/disable per campus
    enable_study_pods=True,
    enable_safety_escort=True,
    enable_food_sharing=True,
    
    # Branding - CHANGE THESE
    primary_color="#1e40af",      # Your school primary color
    secondary_color="#16a34a",    # Your school secondary color
    logo_emoji="🏫",              # Your school emoji/logo
)