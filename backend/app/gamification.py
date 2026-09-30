import json
import logging
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from app.database import get_db
from app.config import settings

logger = logging.getLogger(__name__)

class GamificationService:
    def __init__(self):
        pass
    
    # Badge definitions
    BADGES = {
        'first_pulse': {
            'id': 'first_pulse',
            'name': 'First Responder',
            'description': 'Posted your first pulse',
            'icon': '🎯',
            'tier': 'bronze',
        },
        'pulse_streak_3': {
            'id': 'pulse_streak_3',
            'name': 'Getting Started',
            'description': 'Posted pulses 3 days in a row',
            'icon': '🔥',
            'tier': 'bronze',
        },
        'pulse_streak_7': {
            'id': 'pulse_streak_7',
            'name': 'Week Warrior',
            'description': 'Posted pulses 7 days in a row',
            'icon': '🔥🔥',
            'tier': 'silver',
        },
        'pulse_streak_30': {
            'id': 'pulse_streak_30',
            'name': 'Monthly Master',
            'description': 'Posted pulses 30 days in a row',
            'icon': '🔥🔥🔥',
            'tier': 'gold',
        },
        'helper_5': {
            'id': 'helper_5',
            'name': 'Good Samaritan',
            'description': 'Helped with 5 pulses',
            'icon': '🤝',
            'tier': 'bronze',
        },
        'helper_25': {
            'id': 'helper_25',
            'name': 'Community Hero',
            'description': 'Helped with 25 pulses',
            'icon': '🤝🤝',
            'tier': 'silver',
        },
        'helper_100': {
            'id': 'helper_100',
            'name': 'Guardian Angel',
            'description': 'Helped with 100 pulses',
            'icon': '🤝🤝🤝',
            'tier': 'gold',
        },
        'critical_responder': {
            'id': 'critical_responder',
            'name': 'First Responder',
            'description': 'Responded to a Critical urgency pulse',
            'icon': '🚨',
            'tier': 'silver',
        },
        'banana_kindness': {
            'id': 'banana_kindness',
            'name': 'Banana Ambassador',
            'description': 'Posted 10 Banana Pulse acts of kindness',
            'icon': '🍌',
            'tier': 'gold',
        },
        'study_buddy': {
            'id': 'study_buddy',
            'name': 'Study Buddy',
            'description': 'Joined 5 study pods',
            'icon': '📚',
            'tier': 'bronze',
        },
        'pod_leader': {
            'id': 'pod_leader',
            'name': 'Pod Leader',
            'description': 'Created 3 study pods',
            'icon': '👑',
            'tier': 'silver',
        },
        'night_owl': {
            'id': 'night_owl',
            'name': 'Night Owl',
            'description': 'Posted 10 pulses between 10pm-6am',
            'icon': '🦉',
            'tier': 'silver',
        },
        'early_bird': {
            'id': 'early_bird',
            'name': 'Early Bird',
            'description': 'Posted 10 pulses between 5am-8am',
            'icon': '🌅',
            'tier': 'silver',
        },
    }

    TIER_ORDER = {'bronze': 1, 'silver': 2, 'gold': 3}

    async def get_user_stats(self, user_id: str) -> Dict:
        """Get user's gamification stats."""
        db = await get_db()
        
        # Get pulse count
        pulse_count = await db.fetchval(
            "SELECT COUNT(*) FROM pulses WHERE user_id = $1",
            user_id
        ) or 0
        
        # Get help count (kindness chains where user was helper)
        help_count = await db.fetchval(
            "SELECT COUNT(*) FROM kindness_chains WHERE helper_pulse_id IN (SELECT id FROM pulses WHERE user_id = $1)",
            user_id
        ) or 0
        
        # Get study pod joins
        pod_joins = await db.fetchval(
            "SELECT COUNT(*) FROM study_pod_members WHERE user_id = $1",
            user_id
        ) or 0
        
        # Get created pods
        created_pods = await db.fetchval(
            "SELECT COUNT(*) FROM study_pods WHERE creator_id = $1",
            user_id
        ) or 0
        
        # Get streak
        streak = await self.get_streak(user_id)
        
        # Get badges
        badges = await self.get_user_badges(user_id)
        
        # Get total points
        points = await self.calculate_points(user_id)
        
        return {
            'user_id': user_id,
            'pulse_count': pulse_count,
            'help_count': help_count,
            'pod_joins': pod_joins,
            'created_pods': created_pods,
            'streak': streak,
            'badges': badges,
            'points': points,
            'level': self.get_level(points),
        }

    async def get_streak(self, user_id: str) -> int:
        """Calculate current posting streak in days."""
        db = await get_db()
        
        # Get distinct dates of pulses
        rows = await db.fetch(
            """
            SELECT DISTINCT DATE(created_at AT TIME ZONE 'UTC') as pulse_date
            FROM pulses 
            WHERE user_id = $1
            ORDER BY pulse_date DESC
            """,
            user_id
        )
        
        if not rows:
            return 0
        
        dates = [row['pulse_date'] for row in rows]
        today = datetime.utcnow().date()
        
        # Check if there's a pulse today or yesterday (streak continues)
        streak = 0
        check_date = today
        
        # If no pulse today, check yesterday
        if dates[0] != today:
            if dates[0] != today - timedelta(days=1):
                return 0
            check_date = today - timedelta(days=1)
        
        for date in dates:
            if date == check_date:
                streak += 1
                check_date -= timedelta(days=1)
            elif date < check_date:
                break
        
        return streak

    async def get_user_badges(self, user_id: str) -> List[Dict]:
        """Get user's earned badges."""
        db = await get_db()
        
        rows = await db.fetch(
            "SELECT badge_id, earned_at FROM user_badges WHERE user_id = $1 ORDER BY earned_at DESC",
            user_id
        )
        
        badges = []
        for row in rows:
            badge_def = self.BADGES.get(row['badge_id'])
            if badge_def:
                badges.append({
                    **badge_def,
                    'earned_at': row['earned_at'].isoformat(),
                })
        
        return badges

    async def check_and_award_badges(self, user_id: str, action: str, metadata: Dict = None) -> List[Dict]:
        """Check and award badges based on user action."""
        db = await get_db()
        stats = await self.get_user_stats(user_id)
        new_badges = []
        
        # Check each badge
        for badge_id, badge_def in self.BADGES.items():
            # Skip if already earned
            existing = await db.fetchval(
                "SELECT 1 FROM user_badges WHERE user_id = $1 AND badge_id = $2",
                user_id, badge_id
            )
            if existing:
                continue
            
            earned = False
            
            # Badge conditions
            if badge_id == 'first_pulse' and stats['pulse_count'] >= 1:
                earned = True
            elif badge_id == 'pulse_streak_3' and stats['streak'] >= 3:
                earned = True
            elif badge_id == 'pulse_streak_7' and stats['streak'] >= 7:
                earned = True
            elif badge_id == 'pulse_streak_30' and stats['streak'] >= 30:
                earned = True
            elif badge_id == 'helper_5' and stats['help_count'] >= 5:
                earned = True
            elif badge_id == 'helper_25' and stats['help_count'] >= 25:
                earned = True
            elif badge_id == 'helper_100' and stats['help_count'] >= 100:
                earned = True
            elif badge_id == 'study_buddy' and stats['pod_joins'] >= 5:
                earned = True
            elif badge_id == 'pod_leader' and stats['created_pods'] >= 3:
                earned = True
            
            # Time-based badges
            if action == 'create_pulse' and metadata:
                hour = metadata.get('hour', datetime.utcnow().hour)
                if badge_id == 'night_owl' and (hour >= 22 or hour <= 6):
                    night_count = await db.fetchval(
                        "SELECT COUNT(*) FROM pulses WHERE user_id = $1 AND EXTRACT(HOUR FROM created_at) IN (22,23,0,1,2,3,4,5,6)",
                        user_id
                    )
                    if night_count >= 10:
                        earned = True
                elif badge_id == 'early_bird' and 5 <= hour <= 8:
                    early_count = await db.fetchval(
                        "SELECT COUNT(*) FROM pulses WHERE user_id = $1 AND EXTRACT(HOUR FROM created_at) BETWEEN 5 AND 8",
                        user_id
                    )
                    if early_count >= 10:
                        earned = True
            
            # Category-specific badges
            if action == 'create_pulse' and metadata:
                category = metadata.get('category')
                if badge_id == 'critical_responder' and category == 'SafetyEscort':
                    earned = True
                elif badge_id == 'banana_kindness' and category == 'BananaPulse':
                    banana_count = await db.fetchval(
                        "SELECT COUNT(*) FROM pulses WHERE user_id = $1 AND category = 'BananaPulse'",
                        user_id
                    )
                    if banana_count >= 10:
                        earned = True
            
            if earned:
                await db.execute(
                    "INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)",
                    user_id, badge_id
                )
                new_badges.append({**badge_def, 'earned_at': datetime.utcnow().isoformat()})
        
        return new_badges

    async def calculate_points(self, user_id: str) -> int:
        """Calculate total points for user."""
        db = await get_db()
        stats = await self.get_user_stats(user_id)
        
        points = 0
        points += stats['pulse_count'] * 10
        points += stats['help_count'] * 25
        points += stats['pod_joins'] * 15
        points += stats['created_pods'] * 20
        points += stats['streak'] * 5
        
        # Badge points
        for badge in stats['badges']:
            tier_points = {'bronze': 50, 'silver': 150, 'gold': 500}
            points += tier_points.get(badge.get('tier', 'bronze'), 50)
        
        return points

    def get_level(self, points: int) -> int:
        """Calculate level from points (exponential curve)."""
        # Level formula: level = floor(sqrt(points / 100)) + 1
        import math
        return int(math.sqrt(points / 100)) + 1

    async def get_leaderboard(self, limit: int = 10, category: str = 'points') -> List[Dict]:
        """Get leaderboard."""
        db = await get_db()
        
        if category == 'points':
            order_by = "points DESC"
        elif category == 'streak':
            order_by = "streak DESC"
        elif category == 'helps':
            order_by = "help_count DESC"
        else:
            order_by = "points DESC"
        
        # This would require a materialized view or computed column in production
        # For now, compute on the fly for top users
        rows = await db.fetch(
            f"""
            SELECT user_id, 
                   COUNT(*) as pulse_count,
                   SUM(CASE WHEN category = 'SafetyEscort' THEN 1 ELSE 0 END) as critical_count
            FROM pulses
            GROUP BY user_id
            ORDER BY {order_by}
            LIMIT $1
            """,
            limit
        )
        
        leaderboard = []
        for i, row in enumerate(rows):
            stats = await self.get_user_stats(row['user_id'])
            leaderboard.append({
                'rank': i + 1,
                'user_id': row['user_id'],
                'points': stats['points'],
                'streak': stats['streak'],
                'help_count': stats['help_count'],
                'level': stats['level'],
                'badges': stats['badges'][:3],  # Top 3 badges
            })
        
        return leaderboard


gamification_service = GamificationService()