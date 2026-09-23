from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class SchoolConfig(BaseModel):
    """Configuration for a specific campus - customize for your school."""
    
    # Basic info
    name: str = "PulseCampus"
    short_name: str = "Pulse"
    domain: str = "localhost:3000"
    
    # Map defaults
    default_lat: float = 37.7245
    default_lng: float = -122.4773
    default_zoom: int = 16
    map_bounds: Optional[List[List[float]]] = None  # [[south, west], [north, east]]
    
    # Campus buildings/locations for autocomplete
    buildings: List[str] = Field(default_factory=lambda: [
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
    ])
    
    # Common courses for autocomplete
    courses: List[str] = Field(default_factory=lambda: [
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
    ])
    
    # Common skills for study pods
    skills: List[str] = Field(default_factory=lambda: [
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
    ])
    
    # Pulse categories (customize labels/icons)
    categories: List[dict] = Field(default_factory=lambda: [
        {"value": "Academic", "label": "📚 Academic", "desc": "Homework, exams, study help"},
        {"value": "BorrowGear", "label": "🔧 Borrow Gear", "desc": "Calculators, chargers, tools"},
        {"value": "FoodSharing", "label": "🍕 Food Sharing", "desc": "Extra meals, snacks, leftovers"},
        {"value": "SafetyEscort", "label": "🛡️ Safety Escort", "desc": "Walk home, campus safety"},
        {"value": "GeneralHelp", "label": "🤝 General Help", "desc": "Anything else you need"},
    ])
    
    # Urgency levels with expiration defaults (minutes)
    urgency_levels: List[dict] = Field(default_factory=lambda: [
        {"value": "Critical", "label": "Critical", "color": "#dc2626", "default_expiration": 15},
        {"value": "High", "label": "High", "color": "#ea580c", "default_expiration": 60},
        {"value": "Medium", "label": "Medium", "color": "#2563eb", "default_expiration": 120},
        {"value": "Low", "label": "Low", "color": "#16a34a", "default_expiration": 240},
    ])
    
    # Feature flags
    enable_study_pods: bool = True
    enable_safety_escort: bool = True
    enable_food_sharing: bool = True
    max_pulse_length: int = 500
    max_pods_per_user: int = 3
    default_pod_capacity: int = 4
    
    # Branding
    primary_color: str = "#2563eb"
    secondary_color: str = "#16a34a"
    logo_emoji: str = "📍"


# Default config - override by creating config/<school>.py
DEFAULT_CONFIG = SchoolConfig()


def get_school_config() -> SchoolConfig:
    """Get school config - can be overridden by environment or file."""
    import os
    import importlib.util
    
    # Try to load custom config from config/school.py
    config_path = os.path.join(os.path.dirname(__file__), "..", "..", "config", "school.py")
    if os.path.exists(config_path):
        spec = importlib.util.spec_from_file_location("school_config", config_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        if hasattr(module, "SCHOOL_CONFIG"):
            return module.SCHOOL_CONFIG
    
    # Override with environment variables if set
    if os.getenv("SCHOOL_NAME"):
        return SchoolConfig(
            name=os.getenv("SCHOOL_NAME", DEFAULT_CONFIG.name),
            short_name=os.getenv("SCHOOL_SHORT_NAME", DEFAULT_CONFIG.short_name),
            default_lat=float(os.getenv("SCHOOL_DEFAULT_LAT", DEFAULT_CONFIG.default_lat)),
            default_lng=float(os.getenv("SCHOOL_DEFAULT_LNG", DEFAULT_CONFIG.default_lng)),
            default_zoom=int(os.getenv("SCHOOL_DEFAULT_ZOOM", DEFAULT_CONFIG.default_zoom)),
            primary_color=os.getenv("SCHOOL_PRIMARY_COLOR", DEFAULT_CONFIG.primary_color),
            secondary_color=os.getenv("SCHOOL_SECONDARY_COLOR", DEFAULT_CONFIG.secondary_color),
            logo_emoji=os.getenv("SCHOOL_LOGO_EMOJI", DEFAULT_CONFIG.logo_emoji),
        )
    
    return DEFAULT_CONFIG


# Singleton
school_config = get_school_config()