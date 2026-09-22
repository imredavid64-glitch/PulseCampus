import json
import logging
from google import genai
from google.genai import types
from app.config import settings
from app.schemas import AIParseResponse, PulseCategory, UrgencyLevel

logger = logging.getLogger(__name__)

client = genai.Client(api_key=settings.GEMINI_API_KEY)

PULSE_SYSTEM_PROMPT = """
You are PulseEngine, the AI backend for PulseCampus.
Analyze raw student posts, determine intent, extract entity data, assess urgency, flag safety violations, and output strict JSON.

Rules:
1. CATEGORIES: Select exactly one from ["Academic", "BorrowGear", "FoodSharing", "SafetyEscort", "GeneralHelp"].
2. URGENCY: Select from ["Low", "Medium", "High", "Critical"].
3. EXPIRATION_MINUTES: Assign timer (15-360 mins based on urgency):
   - Critical: 15-30 mins (safety, immediate needs)
   - High: 30-90 mins (exam prep, urgent gear)
   - Medium: 60-180 mins (food drops, general help)
   - Low: 120-360 mins (study pods, chat)
4. SAFETY_FLAG: Set `is_safe: false` for academic dishonesty, drugs, illegal actions, harassment, or dangerous requests.

Output Schema JSON:
{
  "category": "string",
  "summary": "string (max 100 chars)",
  "urgency": "Low" | "Medium" | "High" | "Critical",
  "item_or_action_needed": "string or null",
  "expiration_minutes": integer,
  "is_safe": boolean,
  "safety_reason": "string or null"
}
"""

POD_MATCH_SYSTEM_PROMPT = """
You are PodMatcher, the AI backend for PulseCampus study pod matching.
Given a user's skills and needs, and a list of existing study pods, rank pods by compatibility.

Compatibility factors:
1. Skill overlap: user's strong_skills matching pod's needed_skills (weight: 0.5)
2. Need overlap: user's needed_skills matching pod's strong_skills (weight: 0.3)
3. Course match: exact course_code match (weight: 0.2)

Output JSON array of matches sorted by score descending:
[
  {
    "pod_id": "uuid",
    "match_score": 0.85,
    "matching_skills": ["skill1", "skill2"],
    "missing_skills": ["skill3"]
  }
]
Only include pods with match_score > 0.3.
"""


async def parse_pulse(raw_text: str, location_name: str) -> AIParseResponse:
    """Parse raw student post into structured pulse data using Gemini."""
    prompt = f'User Post: "{raw_text}"\nLocation Context: "{location_name}"'
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=PULSE_SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        data = json.loads(response.text)
        return AIParseResponse(**data)
    except Exception as e:
        logger.error(f"Gemini parse error: {e}")
        # Fallback parsing
        return AIParseResponse(
            category=PulseCategory.GENERAL_HELP,
            summary=raw_text[:100],
            urgency=UrgencyLevel.MEDIUM,
            item_or_action_needed=None,
            expiration_minutes=60,
            is_safe=True,
            safety_reason=None
        )


async def match_pods(
    user_skills: list[str],
    needed_skills: list[str],
    course_code: str,
    pods: list[dict]
) -> list[dict]:
    """Use Gemini to rank study pods by compatibility."""
    if not pods:
        return []
    
    pods_json = json.dumps([
        {
            "id": p["id"],
            "course_code": p["course_code"],
            "strong_skills": p["strong_skills"],
            "needed_skills": p["needed_skills"]
        }
        for p in pods
    ])
    
    prompt = f"""
User Profile:
- Course: {course_code}
- Strong Skills: {user_skills}
- Needed Skills: {needed_skills}

Available Pods:
{pods_json}
"""
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=POD_MATCH_SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Gemini match error: {e}")
        # Fallback: simple skill overlap scoring
        return _fallback_match(user_skills, needed_skills, course_code, pods)


def _fallback_match(
    user_skills: list[str],
    needed_skills: list[str],
    course_code: str,
    pods: list[dict]
) -> list[dict]:
    """Simple skill overlap fallback when Gemini fails."""
    results = []
    user_strong = set(s.lower() for s in user_skills)
    user_needed = set(s.lower() for s in needed_skills)
    
    for pod in pods:
        pod_strong = set(s.lower() for s in pod.get("strong_skills", []))
        pod_needed = set(s.lower() for s in pod.get("needed_skills", []))
        
        # User can teach what pod needs
        teach_match = len(user_strong & pod_needed)
        # User needs what pod can teach
        learn_match = len(user_needed & pod_strong)
        # Course match
        course_match = 1 if pod.get("course_code") == course_code else 0
        
        score = (teach_match * 0.5) + (learn_match * 0.3) + (course_match * 0.2)
        max_possible = (len(pod_needed) * 0.5) + (len(pod_strong) * 0.3) + 0.2
        normalized = score / max_possible if max_possible > 0 else 0
        
        if normalized > 0.3:
            matching = list(user_strong & pod_needed) + list(user_needed & pod_strong)
            missing = list(pod_needed - user_strong) + list(pod_strong - user_needed)
            results.append({
                "pod_id": pod["id"],
                "match_score": round(normalized, 2),
                "matching_skills": matching[:5],
                "missing_skills": missing[:5]
            })
    
    return sorted(results, key=lambda x: x["match_score"], reverse=True)